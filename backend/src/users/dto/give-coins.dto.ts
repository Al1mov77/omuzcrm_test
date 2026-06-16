import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min, IsString } from 'class-validator';

export class GiveCoinsDto {
  @ApiProperty({ example: 50, description: 'Number of coins to give' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({ example: 'Perfect score on JS quiz', description: 'Reason for giving coins' })
  @IsNotEmpty()
  @IsString()
  reason!: string;
}
