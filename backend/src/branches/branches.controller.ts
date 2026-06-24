import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ example: 'Dushanbe' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Rudaki Ave 45', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: '+992900111222', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'dushanbe@omuz.tj', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: 'manager-user-id', required: false })
  @IsOptional()
  @IsString()
  managerId?: string;
}

export class UpdateBranchDto {
  @ApiProperty({ example: 'Dushanbe', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Rudaki Ave 45', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: '+992900111222', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'dushanbe@omuz.tj', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: 'manager-user-id', required: false })
  @IsOptional()
  @IsString()
  managerId?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@ApiTags('branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @ApiOperation({ summary: 'List all branches' })
  @ApiResponse({ status: 200, description: 'Branches list returned.' })
  findAll() {
    return this.branchesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch details (students, groups, manager)' })
  @ApiResponse({ status: 200, description: 'Branch details returned.' })
  @ApiResponse({ status: 404, description: 'Branch not found.' })
  findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new branch' })
  @ApiResponse({ status: 201, description: 'Branch created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() dto: CreateBranchDto) {
    return this.branchesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Update branch' })
  @ApiResponse({ status: 200, description: 'Branch updated successfully.' })
  @ApiResponse({ status: 404, description: 'Branch not found.' })
  update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.branchesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a branch' })
  @ApiResponse({ status: 200, description: 'Branch deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }
}
