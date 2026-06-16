import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RemoveStudentDto {
  @ApiProperty({ example: 'Failed to attend regularly', description: 'Reason why the student is leaving the course' })
  @IsNotEmpty()
  @IsString()
  leftReason!: string;
}
