import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'Next.js Development' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Learn Next.js from scratch.', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 800 })
  @IsNotEmpty()
  @IsNumber()
  price!: number;

  @ApiProperty({ example: 5 })
  @IsNotEmpty()
  @IsNumber()
  duration!: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
