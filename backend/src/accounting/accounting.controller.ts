import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('accounting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/payments')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.MENTOR, Role.TEACHER)
  @ApiOperation({ summary: 'List and filter payments' })
  findAll(
    @Query('studentId') studentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.accountingService.findAll(studentId, startDate, endDate);
  }

  @Get('report')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get financial revenue report' })
  getReport() {
    return this.accountingService.getFinancialReport();
  }

  @Get('debts')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.MENTOR, Role.TEACHER)
  @ApiOperation({ summary: 'Get list of debtor students' })
  getDebts() {
    return this.accountingService.getDebtors();
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get payment details' })
  findOne(@Param('id') id: string) {
    return this.accountingService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Record a student payment' })
  create(@Body() dto: CreatePaymentDto, @Req() req: any) {
    return this.accountingService.recordPayment(dto, req.user.id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update payment record' })
  update(@Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    return this.accountingService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Delete payment record' })
  remove(@Param('id') id: string) {
    return this.accountingService.remove(id);
  }
}
