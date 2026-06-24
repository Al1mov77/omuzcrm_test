import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  async recordPayment(dto: CreatePaymentDto, employeeId: string) {
    // Verify student exists and is a STUDENT
    const student = await this.prisma.user.findUnique({
      where: { id: dto.studentId },
    });
    if (!student || student.role !== Role.STUDENT) {
      throw new BadRequestException('Target user must be a student');
    }

    return this.prisma.payment.create({
      data: {
        studentId: dto.studentId,
        amount: dto.amount,
        paymentType: dto.paymentType,
        date: dto.date ? new Date(dto.date) : new Date(),
        employeeId,
        comment: dto.comment,
      },
      include: {
        student: true,
        employee: true,
      },
    });
  }

  async findAll(studentId?: string, startDate?: string, endDate?: string) {
    const where: any = {};
    if (studentId) {
      where.studentId = studentId;
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    return this.prisma.payment.findMany({
      where,
      include: {
        student: true,
        employee: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        student: true,
        employee: true,
      },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async update(id: string, dto: UpdatePaymentDto) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const data: any = {};
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.paymentType !== undefined) data.paymentType = dto.paymentType;
    if (dto.comment !== undefined) data.comment = dto.comment;
    if (dto.date !== undefined) data.date = new Date(dto.date);

    return this.prisma.payment.update({
      where: { id },
      data,
      include: {
        student: true,
        employee: true,
      },
    });
  }

  async remove(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    await this.prisma.payment.delete({ where: { id } });
    return { success: true };
  }

  async getFinancialReport() {
    const payments = await this.prisma.payment.findMany();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalRevenue = 0;
    let todayRevenue = 0;
    let monthRevenue = 0;
    const typeBreakdown: Record<string, number> = {};

    for (const p of payments) {
      totalRevenue += p.amount;
      const pDate = new Date(p.date);
      if (pDate >= todayStart) {
        todayRevenue += p.amount;
      }
      if (pDate >= monthStart) {
        monthRevenue += p.amount;
      }

      typeBreakdown[p.paymentType] = (typeBreakdown[p.paymentType] || 0) + p.amount;
    }

    return {
      totalRevenue,
      todayRevenue,
      monthRevenue,
      typeBreakdown,
    };
  }

  async getDebtors() {
    // Get all students
    const students = await this.prisma.user.findMany({
      where: { role: Role.STUDENT },
      include: {
        groupStudents: {
          include: {
            group: {
              include: {
                course: true,
              },
            },
          },
        },
        payments: true,
      },
    });

    const debtors = [];

    for (const student of students) {
      let totalCoursePrice = 0;
      for (const gs of student.groupStudents) {
        if (gs.group.course) {
          totalCoursePrice += gs.group.course.price;
        }
      }

      const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
      const debt = totalCoursePrice - totalPaid;

      if (debt > 0) {
        const activeGroup = student.groupStudents.find(gs => gs.status === 'ACTIVE')?.group;
        debtors.push({
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          phone: student.phone,
          parentPhone: student.parentPhone,
          email: student.email,
          totalPrice: totalCoursePrice,
          totalPaid,
          debt,
          groupName: activeGroup ? activeGroup.name : 'No active group',
        });
      }
    }

    return debtors;
  }
}
