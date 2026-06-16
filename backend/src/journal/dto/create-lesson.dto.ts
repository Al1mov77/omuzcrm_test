import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsDateString } from 'class-validator';

export class CreateLessonDto {
  @ApiProperty({ example: '2026-05-04', description: 'Lesson date' })
  @IsNotEmpty()
  @IsDateString()
  date!: string;
}
