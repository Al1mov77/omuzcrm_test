import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.branch.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(name: string) {
    return this.prisma.branch.create({
      data: { name },
    });
  }

  async remove(id: string) {
    await this.prisma.branch.delete({ where: { id } });
    return { success: true };
  }
}
