import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, Min, Max, IsString, Matches, IsOptional } from 'class-validator';

export class CreateScheduleDto {
  @ApiProperty({ example: 1, description: 'Day of week: 1 (Monday) to 7 (Sunday)' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek!: number;

  @ApiProperty({ example: '14:00', description: 'Start time in HH:mm format' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Start time must be in HH:mm format' })
  startTime!: string;

  @ApiProperty({ example: '16:00', description: 'End time in HH:mm format' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'End time must be in HH:mm format' })
  endTime!: string;

  @ApiProperty({ example: 'Room 101', description: 'Classroom room name', required: false })
  @IsOptional()
  @IsString()
  classroom?: string;
}
