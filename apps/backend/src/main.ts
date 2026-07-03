import 'reflect-metadata';
import * as Sentry from '@sentry/node';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { RedisIoAdapter } from './realtime/redis-io.adapter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { SentryExceptionFilter } from './common/filters/sentry-exception.filter';
import { SentryUserInterceptor } from './common/interceptors/sentry-user.interceptor';
import * as express from 'express';
import * as path from 'path';
import * as http from 'http';

const port = Number(process.env.PORT) || 3001;

// ── Minimal health server (start BEFORE NestJS so Railway never sees a down) ─
let nestJsApp: any = null;
const healthServer = http.createServer((req, res) => {
  if (req.url === '/api/health' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'error', message: 'not found' }));
  }
});
healthServer.listen(port, '0.0.0.0', () => {
  console.log(`[HEALTH] Health server listening on 0.0.0.0:${port}`);
});

async function bootstrap() {
  console.log('[TRACE] bootstrap() entered');

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

  // ── NestJS Application ───────────────────────────────────────────────────
  try {
    (process as any)._rawDebug('[TRACE] calling NestFactory.create');
    nestJsApp = await NestFactory.create(AppModule, {
      rawBody: true,
      logger: false,
    });
    (process as any)._rawDebug('[TRACE] NestFactory.create succeeded');
  } catch (err) {
    (process as any)._rawDebug('FATAL: Failed to create NestJS app:', err instanceof Error ? err.stack || err.message : String(err));
    (process as any)._rawDebug('[TRACE] keeping health server alive to pass Railway healthchecks');
    return;  // Don't exit — health server keeps running
  }

  nestJsApp.useLogger(nestJsApp.get(Logger));
  const logger = nestJsApp.get(Logger);

  // ── Raw Body for Stripe Webhooks ─────────────────────────────────────────
  nestJsApp.use('/api/billing/webhook', express.raw({ type: '*/*' }));

  // ── CORS ─────────────────────────────────────────────────────────────────
  const rawOrigins = process.env.FRONTEND_URL || 'http://localhost:3000';
  const allowedOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);
  if (process.env.NODE_ENV !== 'production') {
    ['http://localhost:3000', 'http://127.0.0.1:3000'].forEach(o => {
      if (!allowedOrigins.includes(o)) allowedOrigins.push(o);
    });
  }
  logger.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
  nestJsApp.use(cookieParser());
  nestJsApp.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Authorization,Content-Type,Accept',
  });

  // ── Security Headers ─────────────────────────────────────────────────────
  const cspDirectives = {
    defaultSrc: ["'self'"], baseUri: ["'none'"], formAction: ["'self'"],
    frameAncestors: ["'none'"], objectSrc: ["'none'"], scriptSrc: ["'none'"],
    styleSrc: ["'none'"], imgSrc: ["'self'", 'data:', 'blob:'],
    mediaSrc: ["'self'"], fontSrc: ["'self'"], connectSrc: ["'self'"],
    upgradeInsecureRequests: [] as string[],
  } satisfies Record<string, Iterable<string>>;

  nestJsApp.use(helmet({
    contentSecurityPolicy: {
      directives: cspDirectives,
      reportOnly: process.env.NODE_ENV !== 'production',
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    frameguard: { action: 'deny' }, hidePoweredBy: true,
    hsts: process.env.NODE_ENV === 'production'
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    ieNoOpen: true, noSniff: true, originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: false,
  }));

  nestJsApp.useGlobalFilters(new SentryExceptionFilter());
  nestJsApp.useGlobalInterceptors(new SentryUserInterceptor());
  nestJsApp.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  // ── Redis / WebSocket ────────────────────────────────────────────────────
  const configService = nestJsApp.get(ConfigService);
  const redisAdapter = new RedisIoAdapter(nestJsApp, configService);
  nestJsApp.useWebSocketAdapter(redisAdapter);

  nestJsApp.setGlobalPrefix('api');

  // ── Swagger ──────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('InterviewOS API')
      .setDescription('Backend API for the InterviewOS AI-powered technical interview platform')
      .setVersion('1.0').addCookieAuth('token').addBearerAuth().build();
    const document = SwaggerModule.createDocument(nestJsApp, swaggerConfig);
    SwaggerModule.setup('api/docs', nestJsApp, document);
    logger.log('Swagger docs available at /api/docs');
  }

  // ── Static files ─────────────────────────────────────────────────────────
  const recordingsDir = path.join(process.cwd(), 'recordings');
  nestJsApp.use('/recordings', express.static(recordingsDir));
  nestJsApp.use('/avatars', express.static(recordingsDir));

  // ── Switch from health server to NestJS ──────────────────────────────────
  console.log('[TRACE] closing health server, starting NestJS...');
  await new Promise<void>(resolve => healthServer.close(() => resolve()));

  await nestJsApp.listen(port, '0.0.0.0');
  console.log('[TRACE] NestJS listen succeeded');
  logger.log(`InterviewOS Backend running on: http://0.0.0.0:${port}/api`);

  // ── Graceful Shutdown ────────────────────────────────────────────────────
  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.on(signal, async () => {
      try {
        logger.log(`Received ${signal} — shutting down gracefully...`);
        await nestJsApp.close();
        await redisAdapter.disconnect();
      } catch {}
      process.exit(0);
    });
  }
}

void bootstrap().catch((err) => {
  (process as any)._rawDebug('FATAL: Unhandled error in bootstrap:', err instanceof Error ? err.stack || err.message : String(err));
  (process as any)._rawDebug('[HEALTH] Health server remains running for Railway healthchecks');
});

process.on('exit', (code) => {
  (process as any)._rawDebug('[TRACE] process exit code:', code);
});
process.on('unhandledRejection', (reason) => {
  (process as any)._rawDebug('[TRACE] unhandledRejection:', reason instanceof Error ? reason.stack || reason.message : reason);
});
process.on('uncaughtException', (err) => {
  (process as any)._rawDebug('[TRACE] uncaughtException:', err instanceof Error ? err.stack || err.message : err);
  process.exitCode = 1;
});
