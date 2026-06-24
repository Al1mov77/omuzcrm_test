import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ example: 'JavaScript FullStack', description: 'Group name' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: '2026-05-01', description: 'Group starting date' })
  @IsNotEmpty()
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-10-01', description: 'Group ending date' })
  @IsNotEmpty()
  @IsDateString()
  endDate!: string;

  @ApiProperty({ example: 'uuid-branch-id', description: 'Branch ID' })
  @IsNotEmpty()
  @IsString()
  branchId!: string;

  @ApiProperty({ example: 'uuid-mentor-id', description: 'Mentor ID', required: false })
  @IsOptional()
  @IsString()
  mentorId?: string;

  @ApiProperty({ example: 'Room 101', description: 'Classroom', required: false })
  @IsOptional()
  @IsString()
  classroom?: string;

  @ApiProperty({ example: 'https://github.com/omuz/course', description: 'Learning resources URL', required: false })
  @IsOptional()
  @IsString()
  resourceUrl?: string;

  @ApiProperty({ example: 'uuid-course-id', description: 'Associated Course ID', required: false })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiProperty({ example: 20, description: 'Student enrollment limit', required: false })
  @IsOptional()
  studentLimit?: number;
}
