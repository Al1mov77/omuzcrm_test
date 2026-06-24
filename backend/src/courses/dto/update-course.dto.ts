import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class UpdateCourseDto {
  @ApiProperty({ example: 'Next.js Development', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Learn Next.js from scratch.', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 800, required: false })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
