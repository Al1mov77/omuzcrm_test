import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { Language, Role } from '@prisma/client';

export class UpdateUserDto {
  @ApiProperty({ example: 'Umar', description: 'First name', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Sharipov', description: 'Last name', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

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

  @ApiProperty({ enum: Role, example: Role.MENTOR, description: 'User role', required: false })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({ example: 'branch-uuid', description: 'Branch ID', required: false })
  @IsOptional()
  @IsString()
  branchId?: string;
}
