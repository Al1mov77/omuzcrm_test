import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getDiagnostics() {
    const diag: any = {
      timestamp: new Date().toISOString(),
      dbPush: {
        output: (PrismaService as any).dbPushOutput || '',
        error: (PrismaService as any).dbPushError || ''
      },
      database: {
        status: 'unknown',
        error: null,
        userCount: 0,
        tables: []
      }
    };

    try {
      await this.prisma.$connect();
      diag.database.status = 'connected';
      
      diag.database.userCount = await this.prisma.user.count();

      const tables: any[] = await this.prisma.$queryRawUnsafe(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );
      diag.database.tables = tables.map(t => t.name);
    } catch (err: any) {
      diag.database.status = 'error';
      diag.database.error = {
        message: err.message,
        code: err.code,
        stack: err.stack
      };
    }

    return diag;
  }
}
