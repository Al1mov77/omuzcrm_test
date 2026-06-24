import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class TimetableService {
  constructor(private prisma: PrismaService) {}

  async getTimetable(branchId?: string, dateStr?: string, view?: 'day' | 'week' | 'month') {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const targetView = view || 'week';

    let startDate = new Date(targetDate);
    let endDate = new Date(targetDate);

    if (targetView === 'day') {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (targetView === 'week') {
      // Get Monday of the week
      const day = targetDate.getDay();
      const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust if Sunday
      startDate = new Date(targetDate.setDate(diff));
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (targetView === 'month') {
      startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    // Fetch groups and their schedules
    const where: any = { isActive: true };
    if (branchId) {
      where.branchId = branchId;
    }

    const groups = await this.prisma.group.findMany({
      where,
      include: {
        mentor: {
          select: { firstName: true, lastName: true },
        },
        schedules: true,
      },
    });

    const events: any[] = [];
    const currentDate = new Date(startDate);

    // Expand weekly recurring schedules into concrete calendar dates within the date range
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      const prismaDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Monday is 1, Sunday is 7

      for (const group of groups) {
        // Find schedules for this day
        const daySchedules = group.schedules.filter(s => s.dayOfWeek === prismaDayOfWeek);

        for (const schedule of daySchedules) {
          // Format date as YYYY-MM-DD
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;

          events.push({
            id: schedule.id,
            groupId: group.id,
            groupName: group.name,
            mentorName: group.mentor ? `${group.mentor.firstName} ${group.mentor.lastName}` : 'TBD',
            classroom: schedule.classroom || group.classroom || 'TBD',
            date: dateStr,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Sort events by date and startTime
    events.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });

    return events;
  }

  async getGroupSchedule(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { schedules: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group.schedules;
  }

  private async checkOverlap(
    groupId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    classroom?: string,
    excludeScheduleId?: string,
  ) {
    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const targetClassroom = classroom || group.classroom;
    if (!targetClassroom) {
      return;
    }

    // Find conflict schedules in the same branch and classroom on same day
    const conflictSchedules = await this.prisma.schedule.findMany({
      where: {
        dayOfWeek,
        classroom: targetClassroom,
        group: {
          branchId: group.branchId,
        },
        id: excludeScheduleId ? { not: excludeScheduleId } : undefined,
      },
      include: {
        group: true,
      },
    });

    for (const sched of conflictSchedules) {
      if (startTime < sched.endTime && endTime > sched.startTime) {
        throw new BadRequestException(
          `Вақти ҷадвал бо гурӯҳи "${sched.group.name}" дар синфхонаи "${targetClassroom}" рӯзи ${dayOfWeek} соати ${sched.startTime}-${sched.endTime} мухолифат дорад.`,
        );
      }
    }
  }

  async addSchedule(groupId: string, createScheduleDto: CreateScheduleDto) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const classroom = createScheduleDto.classroom || group.classroom || 'TBD';

    await this.checkOverlap(
      groupId,
      createScheduleDto.dayOfWeek,
      createScheduleDto.startTime,
      createScheduleDto.endTime,
      classroom,
    );

    return this.prisma.schedule.create({
      data: {
        groupId,
        dayOfWeek: createScheduleDto.dayOfWeek,
        startTime: createScheduleDto.startTime,
        endTime: createScheduleDto.endTime,
        classroom,
      },
    });
  }

  async updateSchedule(groupId: string, scheduleId: string, updateScheduleDto: UpdateScheduleDto) {
    const schedule = await this.prisma.schedule.findUnique({ where: { id: scheduleId } });
    if (!schedule || schedule.groupId !== groupId) {
      throw new NotFoundException('Schedule slot not found in this group');
    }

    const classroom = updateScheduleDto.classroom || schedule.classroom || 'TBD';
    const dayOfWeek = updateScheduleDto.dayOfWeek !== undefined ? updateScheduleDto.dayOfWeek : schedule.dayOfWeek;
    const startTime = updateScheduleDto.startTime || schedule.startTime;
    const endTime = updateScheduleDto.endTime || schedule.endTime;

    await this.checkOverlap(
      groupId,
      dayOfWeek,
      startTime,
      endTime,
      classroom,
      scheduleId,
    );

    return this.prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        dayOfWeek,
        startTime,
        endTime,
        classroom,
      },
    });
  }

  async deleteSchedule(groupId: string, scheduleId: string) {
    const schedule = await this.prisma.schedule.findUnique({ where: { id: scheduleId } });
    if (!schedule || schedule.groupId !== groupId) {
      throw new NotFoundException('Schedule slot not found in this group');
    }

    await this.prisma.schedule.delete({ where: { id: scheduleId } });
    return { success: true };
  }
}
