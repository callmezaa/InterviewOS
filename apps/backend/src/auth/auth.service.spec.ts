import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let mailService: jest.Mocked<MailService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: Role.CANDIDATE,
    passwordHash: 'hashed-password',
    emailVerified: new Date(),
    verificationToken: null,
    verificationTokenExpiry: null,
    refreshToken: null,
    refreshTokenExpiry: null,
    organizationId: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            organization: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
            sendEmailVerification: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);
    mailService = module.get(MailService);

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('creates a new user and returns auth payload', async () => {
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.register(
        'test@example.com',
        'password123',
        'Test User',
      );

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'test@example.com',
          passwordHash: 'hashed-password',
          name: 'Test User',
          role: Role.CANDIDATE,
        }),
      });
      expect(mailService.sendEmailVerification).toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@example.com',
        role: Role.CANDIDATE,
      });
      expect(result).toHaveProperty('token', 'mock-jwt-token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toMatchObject({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: Role.CANDIDATE,
      });
    });

    it('throws ConflictException when email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.register('test@example.com', 'password123', 'Test User'),
      ).rejects.toThrow(ConflictException);

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('uses provided role when specified', async () => {
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        role: Role.INTERVIEWER,
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        role: Role.INTERVIEWER,
      });

      const result = await service.register(
        'test@example.com',
        'password123',
        'Test User',
        Role.INTERVIEWER,
      );

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ role: Role.INTERVIEWER }),
      });
      expect(result.user.role).toBe(Role.INTERVIEWER);
    });
  });

  describe('login', () => {
    it('returns auth payload on valid credentials', async () => {
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.login('test@example.com', 'password123');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashed-password',
      );
      expect('user' in result && result).toHaveProperty(
        'token',
        'mock-jwt-token',
      );
      expect('user' in result && result).toHaveProperty('refreshToken');
      expect('user' in result && result.user).toMatchObject({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: Role.CANDIDATE,
      });
    });

    it('throws UnauthorizedException for non-existent email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login('unknown@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.login('test@example.com', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user has no passwordHash', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: null,
        emailVerified: null,
      });

      await expect(
        service.login('test@example.com', 'password123'),
      ).rejects.toThrow('This account uses Google/GitHub Sign-In');
    });

    it('throws ForbiddenException when email not verified', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        emailVerified: null,
      });

      await expect(
        service.login('test@example.com', 'password123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
