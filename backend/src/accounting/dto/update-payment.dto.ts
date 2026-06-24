import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

export class UpdatePaymentDto {
  @ApiProperty({ example: 500, required: false })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiProperty({ example: 'CASH', required: false })
  @IsOptional()
  @IsString()
  paymentType?: string;

  @ApiProperty({ example: '2026-06-24T10:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ example: 'Updated comment', required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}
