import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    console.log('[TRACE] PrismaService.onModuleInit — connecting...');
    await this.$connect();
    console.log('[TRACE] PrismaService connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
