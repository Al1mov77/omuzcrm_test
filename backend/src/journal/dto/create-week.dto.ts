import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, Min } from 'class-validator';

export class CreateWeekDto {
  @ApiProperty({ example: 1, description: 'Week number' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  weekNumber!: number;
}
