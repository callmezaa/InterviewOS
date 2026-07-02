import { Module } from '@nestjs/common';
import { BrandingController } from './branding.controller';
import { BrandingService } from './branding.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [BrandingController],
  providers: [BrandingService, PrismaService],
  exports: [BrandingService],
})
export class BrandingModule {}
