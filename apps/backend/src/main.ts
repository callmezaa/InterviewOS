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

async function bootstrap() {
  // ── Sentry Error Monitoring ──────────────────────────────────────────────
  // Initialize before the NestJS app so startup errors are also captured.
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

  // Create the app with raw body buffer retained for Stripe webhook verification.
  // Disable the default NestJS logger — Pino handles all logging via LoggerModule.
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger: false,
  });

  // Replace NestJS default logger with Pino so all existing Logger instances
  // (new Logger('Context')) output structured JSON through Pino.
  app.useLogger(app.get(Logger));

  const logger = app.get(Logger);

  // ── Raw Body for Stripe Webhooks ───────────────────────────────────────────
  // Override the global JSON parser for the webhook route so Stripe can verify
  // the signature from the raw body buffer.
  app.use('/api/billing/webhook', express.raw({ type: '*/*' }));

  // ── CORS Allowlist ─────────────────────────────────────────────────────────
  // Read FRONTEND_URL from env. Supports comma-separated values for multi-origin
  // deployments (e.g. "https://app.interviewos.com,https://staging.interviewos.com").
  // In local development, localhost:3000 is always included as a safe fallback.
  const rawOrigins = process.env.FRONTEND_URL || 'http://localhost:3000';
  const allowedOrigins = rawOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // Always allow localhost variants in non-production so dev is never blocked
  if (process.env.NODE_ENV !== 'production') {
    const devOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
    devOrigins.forEach((o) => {
      if (!allowedOrigins.includes(o)) allowedOrigins.push(o);
    });
  }

  logger.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);

  // ── Cookie Parser ──────────────────────────────────────────────────────────
  // Required for httpOnly JWT cookie authentication. Parses Cookie header into
  // req.cookies so guards and strategies can read the token.
  app.use(cookieParser());

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Authorization,Content-Type,Accept',
  });

  // ── Security Headers (Helmet + CSP) ─────────────────────────────────────────
  // Strict Content Security Policy for the API server. Since this is a JSON API
  // (not serving HTML), we use a maximally restrictive policy. Only OAuth
  // redirect responses emit HTML, and they contain no external resources.
  // Violations are logged in development (reportOnly) and enforced in production.
  const cspDirectives = {
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
  } satisfies Record<string, Iterable<string>>;

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: cspDirectives,
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

  // ── Global Sentry Exception Filter ──────────────────────────────────────
  // Captures all unhandled exceptions and sends them to Sentry.
  app.useGlobalFilters(new SentryExceptionFilter());

  // ── Global Sentry User Context ──────────────────────────────────────────
  // Sets the authenticated user on Sentry scope for each request.
  app.useGlobalInterceptors(new SentryUserInterceptor());

  // ── Global Validation Pipe ──────────────────────────────────────────────────
  // Auto-validates all incoming request bodies using class-validator DTOs.
  // Strips unknown properties and transforms payloads to DTO instances.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── WebSocket Adapter with Redis (for horizontal scaling) ──────────────────
  // RedisIoAdapter extends CorsIoAdapter — inherits env-driven CORS allowlist
  // and attaches a Redis pub/sub adapter if REDIS_URL is configured.
  // Without Redis, Socket.IO gracefully falls back to single-instance mode.
  const configService = app.get(ConfigService);
  const redisAdapter = new RedisIoAdapter(app, configService);
  app.useWebSocketAdapter(redisAdapter);

  // Set global API prefix
  app.setGlobalPrefix('api');

  // ── Swagger / OpenAPI Documentation ────────────────────────────────────────
  // Exposed in development by default. Set SWAGGER_ENABLED=true in production
  // to force-enable (requires CSP relaxation — see helmet config above).
  // CSP is reportOnly in development, so Swagger UI's inline scripts load fine.
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

  // Serve local recording and avatar files (for development / local storage provider)
  const recordingsDir = path.join(process.cwd(), 'recordings');
  app.use('/recordings', express.static(recordingsDir));
  app.use('/avatars', express.static(recordingsDir));

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`InterviewOS Backend running on: http://localhost:${port}/api`);

  // ── Graceful Shutdown ──────────────────────────────────────────────────────
  // On SIGTERM/SIGINT, close the HTTP server and disconnect Redis clients.
  const signals = ['SIGTERM', 'SIGINT'] as const;
  for (const signal of signals) {
    process.on(signal, async () => {
      logger.log(`Received ${signal} — shutting down gracefully...`);
      await app.close();
      await redisAdapter.disconnect();
      process.exit(0);
    });
  }
}
void bootstrap();
