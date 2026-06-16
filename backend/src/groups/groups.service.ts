import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddStudentDto } from './dto/add-student.dto';
import { RemoveStudentDto } from './dto/remove-student.dto';
import { TransferStudentDto } from './dto/transfer-student.dto';
import { Role, StudentStatus } from '@prisma/client';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, role: Role) {
    if (role === Role.STUDENT) {
      const groupStudents = await this.prisma.groupStudent.findMany({
        where: { studentId: userId },
        include: {
          group: {
            include: {
              mentor: {
                select: { id: true, firstName: true, lastName: true, phone: true },
              },
              branch: true,
            },
          },
        },
      });
      return groupStudents.map(gs => gs.group);
    }

    return this.prisma.group.findMany({
      include: {
        mentor: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        branch: true,
      },
    });
  }

  async findOne(id: string, userId: string, role: Role) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        branch: true,
        mentor: {
          select: { id: true, firstName: true, lastName: true, phone: true, avatarUrl: true },
        },
        schedules: true,
        students: {
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, phone: true, parentPhone: true, avatarUrl: true, coins: true },
            },
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Auth check: Students can only view groups they belong to
    if (role === Role.STUDENT) {
      const isMember = group.students.some(s => s.studentId === userId);
      if (!isMember) {
        throw new ForbiddenException('You are not a member of this group');
      }
    }

    return group;
  }

  async create(createGroupDto: CreateGroupDto) {
    const group = await this.prisma.group.create({
      data: {
        name: createGroupDto.name,
        startDate: new Date(createGroupDto.startDate),
        endDate: new Date(createGroupDto.endDate),
        branchId: createGroupDto.branchId,
        mentorId: createGroupDto.mentorId,
        classroom: createGroupDto.classroom,
        resourceUrl: createGroupDto.resourceUrl,
      },
    });

    // Automatically create Week 1 with 1 initial lesson
    const startDate = new Date(createGroupDto.startDate);
    const week = await this.prisma.week.create({
      data: {
        groupId: group.id,
        weekNumber: 1,
      },
    });

    await this.prisma.lesson.create({
      data: {
        weekId: week.id,
        date: startDate,
      },
    });

    return group;
  }

  async update(id: string, updateGroupDto: UpdateGroupDto) {
    const group = await this.prisma.group.findUnique({ where: { id } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return this.prisma.group.update({
      where: { id },
      data: {
        name: updateGroupDto.name,
        startDate: updateGroupDto.startDate ? new Date(updateGroupDto.startDate) : undefined,
        endDate: updateGroupDto.endDate ? new Date(updateGroupDto.endDate) : undefined,
        branchId: updateGroupDto.branchId,
        mentorId: updateGroupDto.mentorId,
        classroom: updateGroupDto.classroom,
        resourceUrl: updateGroupDto.resourceUrl,
      },
    });
  }

  async remove(id: string) {
    await this.prisma.group.delete({ where: { id } });
    return { success: true };
  }

  async findStudents(id: string) {
    const group = await this.prisma.group.findUnique({ where: { id } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const students = await this.prisma.groupStudent.findMany({
      where: { groupId: id },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            parentPhone: true,
            avatarUrl: true,
            coins: true,
          },
        },
      },
    });

    return students;
  }

  async addStudent(id: string, addStudentDto: AddStudentDto) {
    const group = await this.prisma.group.findUnique({ where: { id } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const student = await this.prisma.user.findUnique({ where: { id: addStudentDto.studentId } });
    if (!student || student.role !== Role.STUDENT) {
      throw new BadRequestException('Invalid student ID');
    }

    // Check if already in group
    const existing = await this.prisma.groupStudent.findUnique({
      where: {
        groupId_studentId: {
          groupId: id,
          studentId: addStudentDto.studentId,
        },
      },
    });

    if (existing) {
      if (existing.status === StudentStatus.ACTIVE) {
        throw new BadRequestException('Student is already active in this group');
      } else {
        // Re-activate student
        const gs = await this.prisma.groupStudent.update({
          where: { id: existing.id },
          data: { status: StudentStatus.ACTIVE, leftReason: null },
        });
        await this.populateStudentJournal(id, addStudentDto.studentId);
        return gs;
      }
    }

    const gs = await this.prisma.groupStudent.create({
      data: {
        groupId: id,
        studentId: addStudentDto.studentId,
        status: StudentStatus.ACTIVE,
      },
    });
    await this.populateStudentJournal(id, addStudentDto.studentId);
    return gs;
  }

  async removeStudent(id: string, studentId: string, removeStudentDto: RemoveStudentDto) {
    const association = await this.prisma.groupStudent.findUnique({
      where: {
        groupId_studentId: {
          groupId: id,
          studentId,
        },
      },
    });

    if (!association) {
      throw new NotFoundException('Student is not in this group');
    }

    return this.prisma.groupStudent.update({
      where: { id: association.id },
      data: {
        status: StudentStatus.LEFT,
        leftReason: removeStudentDto.leftReason,
      },
    });
  }

  async transferStudent(id: string, studentId: string, transferStudentDto: TransferStudentDto) {
    // Verify target group exists
    const targetGroup = await this.prisma.group.findUnique({
      where: { id: transferStudentDto.targetGroupId },
    });
    if (!targetGroup) {
      throw new NotFoundException('Target group not found');
    }

    // Find current association
    const currentAssociation = await this.prisma.groupStudent.findUnique({
      where: {
        groupId_studentId: {
          groupId: id,
          studentId,
        },
      },
    });

    if (!currentAssociation) {
      throw new NotFoundException('Student is not active in this group');
    }

    // Set current association to TRANSFERED instead of deleting
    await this.prisma.groupStudent.update({
      where: { id: currentAssociation.id },
      data: {
        status: 'TRANSFERED' as any,
        leftReason: `Переведен в группу ${targetGroup.name}`,
      },
    }).catch(() => {});

    // Create target association (upsert if exists)
    const gs = await this.prisma.groupStudent.upsert({
      where: {
        groupId_studentId: {
          groupId: transferStudentDto.targetGroupId,
          studentId,
        },
      },
      update: {
        status: StudentStatus.ACTIVE,
        leftReason: null,
      },
      create: {
        groupId: transferStudentDto.targetGroupId,
        studentId,
        status: StudentStatus.ACTIVE,
      },
    });
    await this.populateStudentJournal(transferStudentDto.targetGroupId, studentId);
    return gs;
  }

  private async populateStudentJournal(groupId: string, studentId: string) {
    // Find all weeks for this group
    const weeks = await this.prisma.week.findMany({
      where: { groupId },
      include: { lessons: true },
    });

    for (const week of weeks) {
      // Create week exam if not exists
      await this.prisma.weekExam.upsert({
        where: {
          weekId_studentId: {
            weekId: week.id,
            studentId,
          },
        },
        update: {},
        create: {
          weekId: week.id,
          studentId,
          attended: true,
          bonus: 0,
          examScore: 0,
          sum: 0,
        },
      }).catch(() => {});

      // Create journal entries for each lesson
      for (const lesson of week.lessons) {
        await this.prisma.journalEntry.upsert({
          where: {
            lessonId_studentId: {
              lessonId: lesson.id,
              studentId,
            },
          },
          update: {},
          create: {
            lessonId: lesson.id,
            studentId,
            attended: true,
            score: 0,
          },
        }).catch(() => {});
      }
    }
  }
}
