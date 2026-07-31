import 'reflect-metadata';
import * as Sentry from '@sentry/node';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger as PinoLogger } from 'nestjs-pino';
import { RedisIoAdapter } from './realtime/redis-io.adapter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import express from 'express';
import * as path from 'path';
import { SentryExceptionFilter } from './common/filters/sentry-exception.filter';
import { SentryUserInterceptor } from './common/interceptors/sentry-user.interceptor';

const port = Number(process.env.PORT) || 3001;

async function bootstrap() {
  // ── Sentry Error Monitoring ──────────────────────────────────────────────
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.25 : 0,
    enabled: !!process.env.SENTRY_DSN,
    integrations: [Sentry.httpIntegration(), Sentry.requestDataIntegration()],
    beforeSend(event) {
      if (process.env.NODE_ENV === 'development') return null;
      return event;
    },
  });

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger: false,
  });

  app.useLogger(app.get(PinoLogger));
  const logger = new Logger('Bootstrap');

  // ── CORS ─────────────────────────────────────────────────────────────────
  const rawOrigins = process.env.FRONTEND_URL || 'http://localhost:3000';
  const allowedOrigins = rawOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (process.env.NODE_ENV !== 'production') {
    ['http://localhost:3000', 'http://127.0.0.1:3000'].forEach((o) => {
      if (!allowedOrigins.includes(o)) allowedOrigins.push(o);
    });
  }
  logger.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
  app.use(cookieParser());
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Authorization,Content-Type,Accept',
  });

  // ── Security Headers ─────────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'none'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          scriptSrc: ["'none'"],
          styleSrc: ["'none'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          mediaSrc: ["'self'"],
          fontSrc: ["'self'"],
          connectSrc: ["'self'"],
          upgradeInsecureRequests: [] as string[],
        },
        reportOnly: process.env.NODE_ENV !== 'production',
      },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts:
        process.env.NODE_ENV === 'production'
          ? { maxAge: 31536000, includeSubDomains: true, preload: true }
          : false,
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: false,
    }),
  );

  app.useGlobalFilters(new SentryExceptionFilter());
  app.useGlobalInterceptors(new SentryUserInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── Redis / WebSocket ────────────────────────────────────────────────────
  const configService = app.get(ConfigService);
  const redisAdapter = new RedisIoAdapter(app, configService);
  app.useWebSocketAdapter(redisAdapter);

  app.setGlobalPrefix('api');

  // ── Swagger ──────────────────────────────────────────────────────────────
  if (
    process.env.NODE_ENV !== 'production' ||
    process.env.SWAGGER_ENABLED === 'true'
  ) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('InterviewOS API')
      .setDescription(
        'Backend API for the InterviewOS AI-powered technical interview platform',
      )
      .setVersion('1.0')
      .addCookieAuth('token')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('Swagger docs available at /api/docs');
  }

  // ── Static files (recorded media) ────────────────────────────────────────
  const recordingsDir = path.join(process.cwd(), 'recordings');
  app.use('/recordings', express.static(recordingsDir));

  await app.listen(port, '0.0.0.0');
  logger.log(`InterviewOS Backend running on: http://0.0.0.0:${port}/api`);

  // ── Graceful Shutdown ────────────────────────────────────────────────────
  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.on(signal, () => {
      void (async () => {
        try {
          logger.log(`Received ${signal} — shutting down gracefully...`);
          await app.close();
          await redisAdapter.disconnect();
        } catch {
          // best-effort shutdown
        }
        process.exit(0);
      })();
    });
  }
}

void bootstrap().catch((err) => {
  console.error(
    'FATAL: Failed to bootstrap backend:',
    err instanceof Error ? err.stack || err.message : String(err),
  );
  process.exit(1);
});
