import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: '000000000', description: 'Phone number of the user' })
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @ApiProperty({ example: '000000000', description: 'Password of the user' })
  @IsNotEmpty()
  @IsString()
  password!: string;
}
