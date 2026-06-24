import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 'student-uuid-here' })
  @IsNotEmpty()
  @IsString()
  studentId!: string;

  @ApiProperty({ example: 500 })
  @IsNotEmpty()
  @IsNumber()
  amount!: number;

  @ApiProperty({ example: 'CASH' })
  @IsNotEmpty()
  @IsString()
  paymentType!: string;

  @ApiProperty({ example: '2026-06-24T10:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ example: 'Optional comment', required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}
