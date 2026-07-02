import { Module } from '@nestjs/common';
import { DataExportController } from './data-export.controller';
import { DataExportService } from './data-export.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [DataExportController],
  providers: [DataExportService, PrismaService],
})
export class DataExportModule {}
