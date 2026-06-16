import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsBoolean } from 'class-validator';

export class UpdateExamDto {
  @ApiProperty({ example: 5, description: 'Bonus points awarded', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  bonus?: number;

  @ApiProperty({ example: 85, description: 'Exam score (0 to 100)', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  examScore?: number;

  @ApiProperty({ example: true, description: 'Exam attendance status', required: false })
  @IsOptional()
  @IsBoolean()
  attended?: boolean;
}
