import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddStudentDto } from './dto/add-student.dto';
import { RemoveStudentDto } from './dto/remove-student.dto';
import { TransferStudentDto } from './dto/transfer-student.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @ApiOperation({ summary: 'List all groups (Students get only their own, Mentors/SA get all)' })
  @ApiResponse({ status: 200, description: 'Groups retrieved successfully.' })
  findAll(@Req() req: any) {
    return this.groupsService.findAll(req.user.id, req.user.role);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new group (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Group created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden (requires Super Admin).' })
  create(@Body() createGroupDto: CreateGroupDto) {
    return this.groupsService.create(createGroupDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific group (Students can only see their own groups)' })
  @ApiResponse({ status: 200, description: 'Group returned successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden (cannot view non-member group).' })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.groupsService.findOne(id, req.user.id, req.user.role);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a group (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Group updated successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden (requires Super Admin).' })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  update(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto) {
    return this.groupsService.update(id, updateGroupDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a group (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Group deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden (requires Super Admin).' })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  remove(@Param('id') id: string) {
    return this.groupsService.remove(id);
  }

  @Get(':id/students')
  @Roles(Role.MENTOR, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get list of students in a group (Mentors & Super Admins)' })
  @ApiResponse({ status: 200, description: 'Students returned successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findStudents(@Param('id') id: string) {
    return this.groupsService.findStudents(id);
  }

  @Post(':id/students')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add a student to a group (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Student added successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  addStudent(@Param('id') id: string, @Body() addStudentDto: AddStudentDto) {
    return this.groupsService.addStudent(id, addStudentDto);
  }

  @Delete(':id/students/:studentId')
  @Roles(Role.MENTOR, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Exclude a student from a group (with left reason) -> moves to Left Course' })
  @ApiResponse({ status: 200, description: 'Student status updated to LEFT successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Student or Group not found.' })
  removeStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Body() removeStudentDto: RemoveStudentDto,
  ) {
    return this.groupsService.removeStudent(id, studentId, removeStudentDto);
  }

  @Patch(':id/students/:studentId/transfer')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Transfer a student to another group (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Student successfully transferred.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Student, Group, or Target Group not found.' })
  transferStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Body() transferStudentDto: TransferStudentDto,
  ) {
    return this.groupsService.transferStudent(id, studentId, transferStudentDto);
  }
}
