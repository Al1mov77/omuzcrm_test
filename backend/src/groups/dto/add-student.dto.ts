import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddStudentDto {
  @ApiProperty({ example: 'uuid-student-id', description: 'Student User ID' })
  @IsNotEmpty()
  @IsString()
  studentId!: string;
}
