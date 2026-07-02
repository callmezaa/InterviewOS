import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { CorsIoAdapter } from './cors-io.adapter';

export class RedisIoAdapter extends CorsIoAdapter {
  private readonly redisLogger = new Logger(RedisIoAdapter.name);
  private pubClient: Redis | null = null;
  private subClient: Redis | null = null;

  constructor(app: INestApplication, configService: ConfigService) {
    super(app, configService);

    const redisUrl = configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      this.redisLogger.warn(
        'REDIS_URL not set — Socket.IO running without Redis adapter (single-instance mode)',
      );
      return;
    }

    this.pubClient = new Redis(redisUrl, {
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    });

    this.subClient = new Redis(redisUrl, {
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    });

    this.pubClient.on('error', (err) =>
      this.redisLogger.error(`Redis pub client error: ${err.message}`),
    );
    this.subClient.on('error', (err) =>
      this.redisLogger.error(`Redis sub client error: ${err.message}`),
    );
    this.pubClient.on('connect', () =>
      this.redisLogger.log('Redis pub client connected'),
    );
    this.subClient.on('connect', () =>
      this.redisLogger.log('Redis sub client connected'),
    );

    this.connectWithRetry();
  }

  private async connectWithRetry(): Promise<void> {
    try {
      await this.pubClient?.connect();
      await this.subClient?.connect();
      this.redisLogger.log('Redis clients connected successfully');
    } catch {
      this.redisLogger.warn(
        'Redis connection failed — Socket.IO will run without Redis adapter. ' +
          'Start Redis or set REDIS_URL to enable horizontal scaling.',
      );
    }
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);

    if (this.pubClient && this.subClient) {
      const redisAdapter = createAdapter(this.pubClient, this.subClient);
      server.adapter(redisAdapter);
      this.redisLogger.log(
        'Socket.IO Redis adapter attached for horizontal scaling',
      );
    }

    return server;
  }

  async disconnect(): Promise<void> {
    const tasks: Promise<unknown>[] = [];
    if (this.pubClient) {
      tasks.push(
        this.pubClient.quit().catch(() => this.pubClient?.disconnect()),
      );
    }
    if (this.subClient) {
      tasks.push(
        this.subClient.quit().catch(() => this.subClient?.disconnect()),
      );
    }
    if (tasks.length) {
      await Promise.all(tasks);
      this.redisLogger.log('Redis clients disconnected');
    }
  }
}
