import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.branch.findMany({
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        _count: {
          select: {
            users: true,
            groups: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        users: {
          where: { role: Role.STUDENT },
          select: { id: true, firstName: true, lastName: true, phone: true, parentPhone: true, coins: true },
        },
        groups: {
          include: {
            mentor: {
              select: { id: true, firstName: true, lastName: true },
            },
            course: true,
            _count: {
              select: { students: true },
            },
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    return branch;
  }

  async create(data: { name: string; address?: string; phone?: string; email?: string; managerId?: string }) {
    return this.prisma.branch.create({
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        managerId: data.managerId || null,
        isActive: true,
      },
    });
  }

  async update(id: string, data: { name?: string; address?: string; phone?: string; email?: string; managerId?: string; isActive?: boolean }) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return this.prisma.branch.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        managerId: data.managerId === '' ? null : data.managerId,
        isActive: data.isActive,
      },
    });
  }

  async remove(id: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    await this.prisma.branch.delete({ where: { id } });
    return { success: true };
  }
}
