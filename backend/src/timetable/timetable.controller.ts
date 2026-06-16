import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TimetableService } from './timetable.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('timetable')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Get()
  @ApiOperation({ summary: 'Get timetable schedules with date filters and day/week/month view' })
  @ApiResponse({ status: 200, description: 'Schedules retrieved successfully.' })
  getTimetable(
    @Query('branchId') branchId?: string,
    @Query('date') date?: string,
    @Query('view') view?: 'day' | 'week' | 'month',
  ) {
    return this.timetableService.getTimetable(branchId, date, view);
  }

  @Get(':groupId')
  @ApiOperation({ summary: 'Get timetable of a specific group' })
  @ApiResponse({ status: 200, description: 'Group schedules retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  getGroupSchedule(@Param('groupId') groupId: string) {
    return this.timetableService.getGroupSchedule(groupId);
  }

  @Post(':groupId')
  @Roles(Role.MENTOR, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add a new schedule slot for a group (Mentors & SA)' })
  @ApiResponse({ status: 201, description: 'Schedule slot added successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  addSchedule(@Param('groupId') groupId: string, @Body() createScheduleDto: CreateScheduleDto) {
    return this.timetableService.addSchedule(groupId, createScheduleDto);
  }

  @Patch(':groupId/:scheduleId')
  @Roles(Role.MENTOR, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Change schedule slot details (Mentors & SA)' })
  @ApiResponse({ status: 200, description: 'Schedule slot changed successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Schedule slot or group not found.' })
  updateSchedule(
    @Param('groupId') groupId: string,
    @Param('scheduleId') scheduleId: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ) {
    return this.timetableService.updateSchedule(groupId, scheduleId, updateScheduleDto);
  }

  @Delete(':groupId/:scheduleId')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a schedule slot (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Schedule slot deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Schedule slot or group not found.' })
  deleteSchedule(@Param('groupId') groupId: string, @Param('scheduleId') scheduleId: string) {
    return this.timetableService.deleteSchedule(groupId, scheduleId);
  }
}
