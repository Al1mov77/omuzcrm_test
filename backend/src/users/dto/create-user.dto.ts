import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { Role, Language } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: '992900112233', description: 'User phone number (unique)' })
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsNotEmpty()
  @IsString()
  password!: string;

  @ApiProperty({ example: 'Umar', description: 'First name' })
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Sharipov', description: 'Last name' })
  @IsNotEmpty()
  @IsString()
  lastName!: string;

  @ApiProperty({ enum: Role, example: Role.STUDENT, description: 'Role' })
  @IsNotEmpty()
  @IsEnum(Role)
  role!: Role;

  @ApiProperty({ example: 'uuid-branch-id', description: 'Branch ID', required: false })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiProperty({ example: '2005-06-15', description: 'Birth Date', required: false })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiProperty({ example: 'Dushanbe, Somoni St 12', description: 'Home Address', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: '992999888777', description: 'Parent Phone Number (students)', required: false })
  @IsOptional()
  @IsString()
  parentPhone?: string;

  @ApiProperty({ enum: Language, example: Language.RU, description: 'Interface language', required: false })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;
}
