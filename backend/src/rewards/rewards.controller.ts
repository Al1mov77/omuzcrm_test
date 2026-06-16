import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RewardsService } from './rewards.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('rewards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get current user coin balance' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully.' })
  getBalance(@Req() req: any) {
    return this.rewardsService.getBalance(req.user.id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history of current user' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully.' })
  getTransactions(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.rewardsService.getTransactions(req.user.id, search, startDate, endDate);
  }

  @Get('shop')
  @ApiOperation({ summary: 'Get list of items available in the shop' })
  @ApiResponse({ status: 200, description: 'Shop items returned successfully.' })
  getShop() {
    return this.rewardsService.getShop();
  }

  @Post('shop/:itemId/redeem')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Exchange coins for a prize (Students only)' })
  @ApiResponse({ status: 200, description: 'Successfully redeemed.' })
  @ApiResponse({ status: 400, description: 'Insufficient balance or item not available.' })
  @ApiResponse({ status: 403, description: 'Forbidden (requires Student role).' })
  redeem(@Req() req: any, @Param('itemId') itemId: string) {
    return this.rewardsService.redeem(req.user.id, itemId);
  }

  @Post('items')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new reward item in the shop (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Item created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  createItem(@Body() createRewardDto: CreateRewardDto) {
    return this.rewardsService.createItem(createRewardDto);
  }

  @Patch('items/:id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a shop item (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Item updated successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  updateItem(@Param('id') id: string, @Body() updateRewardDto: UpdateRewardDto) {
    return this.rewardsService.updateItem(id, updateRewardDto);
  }

  @Delete('items/:id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a shop item (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Item deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  deleteItem(@Param('id') id: string) {
    return this.rewardsService.deleteItem(id);
  }
}
