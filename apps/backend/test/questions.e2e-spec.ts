import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import * as cookieParser from 'cookie-parser';

describe('Questions (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/questions', () => {
    it('returns 401 without auth', () => {
      return request(app.getHttpServer()).get('/api/questions').expect(401);
    });
  });

  describe('GET /api/templates', () => {
    it('returns templates without auth (public)', () => {
      return request(app.getHttpServer())
        .get('/api/templates')
        .expect(200)
        .expect([]);
    });
  });

  describe('GET /api/questions/categories', () => {
    it('returns 401 without auth', () => {
      return request(app.getHttpServer())
        .get('/api/questions/categories')
        .expect(401);
    });
  });
});
