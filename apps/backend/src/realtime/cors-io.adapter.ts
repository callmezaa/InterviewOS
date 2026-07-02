import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServerOptions } from 'socket.io';

/**
 * CorsIoAdapter
 *
 * A custom Socket.io adapter that reads the CORS allowlist from the
 * FRONTEND_URL environment variable at runtime, instead of hardcoding
 * `origin: '*'` in the @WebSocketGateway decorator (which is evaluated
 * statically at class-decoration time before NestJS DI is ready).
 *
 * Usage in main.ts:
 *   const configService = app.get(ConfigService);
 *   app.useWebSocketAdapter(new CorsIoAdapter(app, configService));
 */
export class CorsIoAdapter extends IoAdapter {
  private readonly allowedOrigins: string[];
  protected readonly logger = new Logger(CorsIoAdapter.name);

  constructor(app: INestApplication, configService: ConfigService) {
    super(app);

    // Parse comma-separated FRONTEND_URL into an allowlist array
    const rawOrigins =
      configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    this.allowedOrigins = rawOrigins
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    // Always permit localhost variants outside of production so local dev is never blocked
    if (configService.get<string>('NODE_ENV') !== 'production') {
      const devOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
      devOrigins.forEach((o) => {
        if (!this.allowedOrigins.includes(o)) this.allowedOrigins.push(o);
      });
    }

    this.logger.log(
      `[WebSocket] CORS allowed origins: ${this.allowedOrigins.join(', ')}`,
    );
  }

  createIOServer(
    port: number,
    options?: Partial<ServerOptions>,
  ): import('socket.io').Server {
    const opts = {
      ...options,
      cors: {
        origin: (
          requestOrigin: string | undefined,
          callback: (err: Error | null, allow?: boolean) => void,
        ) => {
          // Allow server-to-server calls (no Origin header) and allowlisted origins
          if (!requestOrigin || this.allowedOrigins.includes(requestOrigin)) {
            callback(null, true);
          } else {
            this.logger.warn(
              `[WebSocket] CORS rejected origin: ${requestOrigin}`,
            );
            callback(
              new Error(
                `WebSocket CORS policy: ${requestOrigin} is not allowed`,
              ),
            );
          }
        },
        credentials: true,
        methods: ['GET', 'POST'],
      },
    };

    return super.createIOServer(port, opts);
  }
}
