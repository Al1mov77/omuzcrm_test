import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { Role } from '@prisma/client';

@Injectable()
export class RewardsService {
  constructor(private prisma: PrismaService) {}

  async getBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { coins: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { balance: user.coins };
  }

  async getTransactions(userId: string, search?: string, startDate?: string, endDate?: string) {
    const where: any = { userId };

    if (search) {
      where.reason = { contains: search, mode: 'insensitive' };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    return this.prisma.coinTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getShop() {
    return this.prisma.rewardItem.findMany({
      orderBy: { coinCost: 'asc' },
    });
  }

  async redeem(userId: string, itemId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== Role.STUDENT) {
      throw new BadRequestException('Only students can redeem items from the shop');
    }

    const item = await this.prisma.rewardItem.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException('Reward item not found');
    }
    if (!item.isAvailable) {
      throw new BadRequestException('This item is currently out of stock');
    }

    if (user.coins < item.coinCost) {
      throw new BadRequestException('Insufficient coins');
    }

    // Wrap in interactive transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Decrement user coins
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          coins: {
            decrement: item.coinCost,
          },
        },
      });

      // 2. Create redemption record
      await tx.rewardRedemption.create({
        data: {
          userId,
          itemId,
        },
      });

      // 3. Create negative transaction log
      await tx.coinTransaction.create({
        data: {
          userId,
          amount: -item.coinCost,
          reason: `Redeemed ${item.title}`,
        },
      });

      return {
        success: true,
        balance: updatedUser.coins,
        itemRedeemed: item.title,
      };
    });
  }

  async createItem(createRewardDto: CreateRewardDto) {
    return this.prisma.rewardItem.create({
      data: {
        title: createRewardDto.title,
        coinCost: createRewardDto.coinCost,
        imageUrl: createRewardDto.imageUrl,
        isAvailable: createRewardDto.isAvailable ?? true,
      },
    });
  }

  async updateItem(id: string, updateRewardDto: UpdateRewardDto) {
    const item = await this.prisma.rewardItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Reward item not found');
    }

    return this.prisma.rewardItem.update({
      where: { id },
      data: {
        title: updateRewardDto.title,
        coinCost: updateRewardDto.coinCost,
        imageUrl: updateRewardDto.imageUrl,
        isAvailable: updateRewardDto.isAvailable,
      },
    });
  }

  async deleteItem(id: string) {
    const item = await this.prisma.rewardItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Reward item not found');
    }

    await this.prisma.rewardItem.delete({ where: { id } });
    return { success: true };
  }
}
