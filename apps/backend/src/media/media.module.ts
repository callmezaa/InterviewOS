import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { PrismaService } from '../prisma.service';
import { OwnershipGuard } from '../common/guards/ownership.guard';

@Module({
  controllers: [MediaController],
  providers: [MediaService, PrismaService, OwnershipGuard],
  exports: [MediaService],
})
export class MediaModule {}
