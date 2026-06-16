import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TransferStudentDto {
  @ApiProperty({ example: 'uuid-target-group-id', description: 'Group ID to transfer student to' })
  @IsNotEmpty()
  @IsString()
  targetGroupId!: string;
}
