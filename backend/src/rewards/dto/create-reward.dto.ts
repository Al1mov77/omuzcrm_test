import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, Min, IsOptional, IsBoolean } from 'class-validator';

export class CreateRewardDto {
  @ApiProperty({ example: 'Omuz T-shirt', description: 'Reward item title' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({ example: 100, description: 'Cost in coins' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  coinCost!: number;

  @ApiProperty({ example: '/rewards/tshirt.png', description: 'Image URL', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: true, description: 'Is item in stock and available for redemption', required: false })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
