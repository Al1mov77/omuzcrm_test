import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsInt, Min, Max, IsString } from 'class-validator';

export class UpdateEntryDto {
  @ApiProperty({ example: true, description: 'Attendance status', required: false })
  @IsOptional()
  @IsBoolean()
  attended?: boolean;

  @ApiProperty({ example: 5, description: 'Lesson score (0 to 5)', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  score?: number;

  @ApiProperty({ example: 'Excellent participation', description: 'Teacher note', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
