import { Injectable } from '@nestjs/common';
import {
  HealthCheckResult,
  HealthCheckService,
  HealthIndicatorResult,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Database connectivity — runs a SELECT 1 query
      () => this.prismaHealth.pingCheck('database', this.prisma),

      // Heap memory — warn if > 256 MB, fail if > 512 MB
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),

      // RSS memory — fail if > 512 MB
      () => this.memory.checkRSS('memory_rss', 512 * 1024 * 1024),
    ]);
  }
}
