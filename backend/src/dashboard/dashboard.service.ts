import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountingService } from '../accounting/accounting.service';
import { Role } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private accountingService: AccountingService,
  ) {}

  async getDashboardStats() {
    const totalStudents = await this.prisma.user.count({
      where: { role: Role.STUDENT },
    });

    const totalGroups = await this.prisma.group.count({
      where: { isActive: true },
    });

    const totalCourses = await this.prisma.course.count({
      where: { isActive: true },
    });

    const totalTeachers = await this.prisma.user.count({
      where: {
        OR: [
          { role: Role.MENTOR },
          { role: Role.TEACHER },
        ],
      },
    });

    const financeReport = await this.accountingService.getFinancialReport();
    const debtors = await this.accountingService.getDebtors();

    // Mock notification list
    const notifications = [
      { id: '1', text: 'Нов донишҷӯ Iso Musoev ба қайд гирифта шуд.', time: '10 дақиқа пеш' },
      { id: '2', text: 'Пардохти 800 сомонӣ аз ҷониби Ahmadshoh Hayotov сабт шуд.', time: '3 соат пеш' },
      { id: '3', text: 'Гурӯҳи нави "Next js - 10" сохта шуд.', time: '1 рӯз пеш' },
      { id: '4', text: 'Муаллим Muhammadsurur Abdulloev ба гурӯҳ пайваст.', time: '2 рӯз пеш' },
    ];

    return {
      totalStudents,
      totalGroups,
      totalCourses,
      totalTeachers,
      todayRevenue: financeReport.todayRevenue,
      monthRevenue: financeReport.monthRevenue,
      debtorsCount: debtors.length,
      debtorsList: debtors.slice(0, 5), // Return top 5 debtors
      notifications,
    };
  }
}
