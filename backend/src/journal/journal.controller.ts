import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JournalService } from './journal.service';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { CreateWeekDto } from './dto/create-week.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('journal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/journal')
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Get(':groupId')
  @ApiOperation({ summary: 'Get journal of a group with all weeks (Group members & SA)' })
  @ApiResponse({ status: 200, description: 'Journal returned successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  getJournal(@Param('groupId') groupId: string, @Req() req: any) {
    return this.journalService.getJournal(groupId, req.user.id, req.user.role);
  }

  @Get(':groupId/week/:weekNumber')
  @ApiOperation({ summary: 'Get data of a specific week (Group members & SA)' })
  @ApiResponse({ status: 200, description: 'Week data returned successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Week not found.' })
  getWeekData(
    @Param('groupId') groupId: string,
    @Param('weekNumber', ParseIntPipe) weekNumber: number,
    @Req() req: any,
  ) {
    return this.journalService.getWeekData(groupId, weekNumber, req.user.id, req.user.role);
  }

  @Patch(':groupId/entry/:entryId')
  @Roles(Role.MENTOR, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update attendance and/or score of a student for a lesson (Mentors & SA)' })
  @ApiResponse({ status: 200, description: 'Journal entry updated successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Entry not found.' })
  updateEntry(
    @Param('groupId') groupId: string,
    @Param('entryId') entryId: string,
    @Body() updateEntryDto: UpdateEntryDto,
  ) {
    return this.journalService.updateEntry(groupId, entryId, updateEntryDto);
  }

  @Patch(':groupId/exam/:examId')
  @Roles(Role.MENTOR, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update weekly exam results and bonus points (Mentors & SA)' })
  @ApiResponse({ status: 200, description: 'Exam record updated successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Exam record not found.' })
  updateExam(
    @Param('groupId') groupId: string,
    @Param('examId') examId: string,
    @Body() updateExamDto: UpdateExamDto,
  ) {
    return this.journalService.updateExam(groupId, examId, updateExamDto);
  }

  @Get(':groupId/chart')
  @ApiOperation({ summary: 'Get line chart data for group progress over weeks (Group members & SA)' })
  @ApiResponse({ status: 200, description: 'Chart data returned successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  getChartData(@Param('groupId') groupId: string, @Req() req: any) {
    return this.journalService.getChartData(groupId, req.user.id, req.user.role);
  }

  @Post(':groupId/weeks')
  @Roles(Role.MENTOR, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new week for the journal (Mentors & SA)' })
  @ApiResponse({ status: 201, description: 'Week created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  createWeek(@Param('groupId') groupId: string, @Body() createWeekDto: CreateWeekDto) {
    return this.journalService.createWeek(groupId, createWeekDto);
  }

  @Post(':groupId/weeks/:weekId/lessons')
  @Roles(Role.MENTOR, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add a lesson inside a week (Mentors & SA)' })
  @ApiResponse({ status: 201, description: 'Lesson created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Week not found.' })
  createLesson(
    @Param('groupId') groupId: string,
    @Param('weekId') weekId: string,
    @Body() createLessonDto: CreateLessonDto,
  ) {
    return this.journalService.createLesson(groupId, weekId, createLessonDto);
  }

  @Delete(':groupId/weeks/:weekId')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a week (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Week deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Week not found.' })
  deleteWeek(
    @Param('groupId') groupId: string,
    @Param('weekId') weekId: string,
  ) {
    return this.journalService.deleteWeek(groupId, weekId);
  }
}
