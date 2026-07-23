import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { RealtimeModule } from './realtime/realtime.module';
import { InterviewModule } from './interview/interview.module';
import { AiModule } from './ai/ai.module';
import { MediaModule } from './media/media.module';
import { WebRtcModule } from './webrtc/webrtc.module';
import { QuestionsModule } from './questions/questions.module';
import { TemplatesModule } from './templates/templates.module';
import { BrandingModule } from './branding/branding.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DataExportModule } from './data-export/data-export.module';
import { HealthModule } from './health/health.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { ActivityModule } from './activity/activity.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = config.get('NODE_ENV') === 'production';
        const level = config.get('LOG_LEVEL', isProd ? 'info' : 'debug');

        return {
          pinoHttp: {
            level,
            transport: isProd
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: true,
                    translateTime: 'SYS:HH:MM:ss',
                  },
                },
            genReqId: (req: any) =>
              req.headers['x-request-id'] || crypto.randomUUID(),
            autoLogging: {
              ignore: (req: any) => !!req.url?.startsWith('/api/health'),
            },
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'res.headers["set-cookie"]',
                '*.password',
                '*.passwordHash',
                '*.token',
                '*.refreshToken',
                '*.resetToken',
                '*.verificationToken',
                '*.twoFactorSecret',
                '*.twoFactorBackupCodes',
              ],
              remove: true,
            },
            serializers: {
              req(req: any) {
                return { id: req.id, method: req.method, url: req.url };
              },
              res(res: any) {
                return { statusCode: res.statusCode };
              },
            },
          },
        };
      },
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLE_TTL', 60000),
          limit: config.get('THROTTLE_LIMIT', 30),
        },
      ],
    }),
    AuthModule,
    RealtimeModule,
    InterviewModule,
    AiModule,
    MediaModule,
    WebRtcModule,
    QuestionsModule,
    TemplatesModule,
    BrandingModule,
    NotificationsModule,
    DataExportModule,
    HealthModule,
    IntegrationsModule,
    ActivityModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
