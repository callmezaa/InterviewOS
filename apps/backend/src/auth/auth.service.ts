import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';
import { MediaService } from '../media/media.service';
import { ActivityService } from '../activity/activity.service';
import * as bcrypt from 'bcrypt';
import { Role, Plan, Session } from '@prisma/client';
import * as crypto from 'crypto';
import otplib from 'otplib';
import QRCode from 'qrcode';

export interface SessionMetadata {
  deviceName?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  browser?: string;
  os?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly mediaService: MediaService,
    private readonly activityService: ActivityService,
  ) {}

  async register(email: string, password: string, name: string, role?: Role, sessionMetadata?: SessionMetadata) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role || Role.CANDIDATE,
        verificationToken,
        verificationTokenExpiry,
        // Auto-verify in development so login works immediately
        ...(process.env.NODE_ENV !== 'production' && { emailVerified: new Date() }),
      },
    });

    await this.mailService.sendEmailVerification(
      user.email,
      user.name,
      verificationToken,
    );

    await this.activityService.log({
      userId: user.id,
      type: 'account_created',
      title: name,
      description: 'Account created',
      metadata: { email },
    }).catch(() => {});

    return this.generateAuthPayload(user, sessionMetadata);
  }

  async updateProfile(userId: string, data: { name?: string; email?: string; role?: Role }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (data.email && data.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existing) {
        throw new ConflictException('Email already in use');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.role !== undefined && { role: data.role }),
      },
    });

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      plan: updated.plan,
      avatarUrl: updated.avatarUrl,
      twoFactorEnabled: updated.twoFactorEnabled,
    };
  }

  async deleteAvatar(userId: string): Promise<{ avatarUrl: null }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });

    return { avatarUrl: null };
  }

  // ── 2FA ──────────────────────────────────────────────────

  async setup2fa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    const secret = otplib.generateSecret();
    const otpauth = otplib.generateURI({
      issuer: 'InterviewOS',
      label: user.email,
      secret,
    });

    const qrCode = await QRCode.toDataURL(otpauth);

    // Backup codes (10 codes, hex)
    const backupCodes: string[] = [];
    const backupCodesHashed: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      backupCodes.push(code);
      backupCodesHashed.push(await bcrypt.hash(code, 6));
    }

    // Save secret + hashed backup codes
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorBackupCodes: JSON.stringify(backupCodesHashed),
      },
    });

    return {
      secret,
      qrCode,
      backupCodes,
      uri: otpauth,
    };
  }

  async verify2faSetup(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }
    if (!user.twoFactorSecret) {
      throw new BadRequestException(
        '2FA has not been initialized. Call setup first.',
      );
    }

    const isValid = otplib.verifySync({ token, secret: user.twoFactorSecret });
    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { message: '2FA enabled successfully' };
  }

  async disable2fa(userId: string, password?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    // If user has a password, require re-authentication
    if (user.passwordHash) {
      if (!password) {
        throw new BadRequestException(
          'Current password is required to disable 2FA',
        );
      }
      const verified = await bcrypt.compare(password, user.passwordHash);
      if (!verified) {
        throw new UnauthorizedException('Password is incorrect');
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: null,
        twoFactorEnabled: false,
        twoFactorBackupCodes: null,
      },
    });

    return { message: '2FA disabled successfully' };
  }

  async generateBackupCodes(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    const backupCodes: string[] = [];
    const backupCodesHashed: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      backupCodes.push(code);
      backupCodesHashed.push(await bcrypt.hash(code, 6));
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorBackupCodes: JSON.stringify(backupCodesHashed),
      },
    });

    return { backupCodes };
  }

  async login(
    email: string,
    password: string,
    sessionMetadata?: SessionMetadata,
  ): Promise<
    | { user: unknown; token: string; refreshToken: string; sessionId: string }
    | { twoFactorRequired: true; tempToken: string }
  > {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'This account uses Google/GitHub Sign-In. Please sign in with your social account.',
      );
    }

    const verified = await bcrypt.compare(password, user.passwordHash);
    if (!verified) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException({
        message: 'Please verify your email before signing in.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    // 2FA check
    if (user.twoFactorEnabled) {
      const tempToken = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
          type: '2fa_challenge',
        },
        { expiresIn: '5m' },
      );
      return { twoFactorRequired: true, tempToken };
    }

    return this.generateAuthPayload(user, sessionMetadata);
  }

  async verify2faChallenge(tempToken: string, token: string, sessionMetadata?: SessionMetadata) {
    let payload: { sub: string; email: string; role: string; type: string };
    try {
      payload = this.jwtService.verify(tempToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired 2FA challenge token');
    }

    if (payload.type !== '2fa_challenge') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) throw new NotFoundException('User not found');
    if (!user.twoFactorEnabled)
      throw new BadRequestException('2FA is not enabled');
    if (!user.twoFactorSecret)
      throw new BadRequestException('2FA not configured');

    // Try TOTP first, then backup codes
    const isTotpValid = otplib.verifySync({
      token,
      secret: user.twoFactorSecret,
    });
    if (isTotpValid) {
      return this.generateAuthPayload(user, sessionMetadata);
    }

    // Try backup codes
    if (user.twoFactorBackupCodes) {
      const hashedCodes: string[] = JSON.parse(user.twoFactorBackupCodes);
      for (let i = 0; i < hashedCodes.length; i++) {
        const match = await bcrypt.compare(token, hashedCodes[i]);
        if (match) {
          // Remove used backup code
          hashedCodes.splice(i, 1);
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              twoFactorBackupCodes: JSON.stringify(hashedCodes),
            },
          });
          return this.generateAuthPayload(user, sessionMetadata);
        }
      }
    }

    throw new UnauthorizedException('Invalid verification code');
  }

  async uploadAvatar(
    userId: string,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<{ avatarUrl: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const avatarUrl = await this.mediaService.uploadAvatar(
      userId,
      fileBuffer,
      mimeType,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return { avatarUrl };
  }

  async refreshToken(refreshToken: string, sessionMetadata?: SessionMetadata) {
    // Try Session model first (new flow)
    const existingSession = await this.prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (existingSession && existingSession.expiresAt > new Date()) {
      const user = existingSession.user;
      const tokens = await this.generateTokens(
        user.id,
        user.email,
        user.role,
        user.plan,
      );

      // Rotate session: create new, delete old
      const newSession = await this.createSession(user.id, tokens.refreshToken, {
        deviceName: existingSession.deviceName ?? undefined,
        deviceType: existingSession.deviceType as SessionMetadata['deviceType'],
        browser: existingSession.browser ?? undefined,
        os: existingSession.os ?? undefined,
        ipAddress: existingSession.ipAddress ?? undefined,
        ...sessionMetadata,
      });
      await this.prisma.session.delete({ where: { id: existingSession.id } });

      // Legacy: update User.refreshToken
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          refreshToken: tokens.refreshToken,
          refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          plan: user.plan,
          avatarUrl: user.avatarUrl || null,
          twoFactorEnabled: user.twoFactorEnabled,
        },
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        sessionId: newSession.id,
      };
    }

    // Fallback: legacy refresh token on User model
    const user = await this.prisma.user.findFirst({
      where: { refreshToken },
    });

    if (
      !user ||
      !user.refreshTokenExpiry ||
      user.refreshTokenExpiry < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.plan,
    );

    const session = await this.createSession(user.id, tokens.refreshToken, sessionMetadata);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: tokens.refreshToken,
        refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
        avatarUrl: user.avatarUrl || null,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      sessionId: session.id,
    };
  }

  async getSessions(userId: string, currentSessionId?: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true,
        deviceName: true,
        deviceType: true,
        browser: true,
        os: true,
        ipAddress: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
    });
    return sessions.map((s) => ({
      ...s,
      isCurrent: s.id === currentSessionId,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    await this.prisma.session.delete({ where: { id: sessionId } });
    return { message: 'Session revoked successfully' };
  }

  async revokeOtherSessions(userId: string, currentSessionId: string) {
    await this.prisma.session.deleteMany({
      where: { userId, id: { not: currentSessionId } },
    });
    return { message: 'Other sessions revoked successfully' };
  }

  private parseUserAgent(ua: string): { browser: string; os: string; deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown'; deviceName: string } {
    const lower = ua.toLowerCase();
    let browser = 'Unknown';
    let os = 'Unknown';
    let deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown' = 'unknown';
    let deviceName = 'Unknown';

    // Browser detection
    if (lower.includes('edg/') || lower.includes('edge/')) browser = 'Edge';
    else if (lower.includes('chrome/')) browser = 'Chrome';
    else if (lower.includes('safari/')) browser = 'Safari';
    else if (lower.includes('firefox/')) browser = 'Firefox';
    else if (lower.includes('opera/') || lower.includes('opr/')) browser = 'Opera';

    // OS detection
    if (lower.includes('windows')) os = 'Windows';
    else if (lower.includes('mac os')) os = 'macOS';
    else if (lower.includes('linux')) os = 'Linux';
    else if (lower.includes('android')) os = 'Android';
    else if (lower.includes('ios') || lower.includes('iphone') || lower.includes('ipad')) os = 'iOS';
    else if (lower.includes('chrome os')) os = 'ChromeOS';

    // Device type detection
    if (lower.includes('iphone') || lower.includes('android') && lower.includes('mobile')) {
      deviceType = 'mobile';
      deviceName = os === 'iOS' ? 'iPhone' : 'Android Phone';
    } else if (lower.includes('ipad') || lower.includes('tablet') || lower.includes('playbook') || lower.includes('silk')) {
      deviceType = 'tablet';
      deviceName = lower.includes('ipad') ? 'iPad' : 'Android Tablet';
    } else if (lower.includes('macintosh') || lower.includes('windows') || lower.includes('linux') && !lower.includes('android')) {
      deviceType = 'desktop';
      deviceName = os === 'macOS' ? 'Mac' : os === 'Windows' ? 'PC' : 'Linux Desktop';
    }

    return { browser, os, deviceType, deviceName };
  }

  private async createSession(
    userId: string,
    refreshToken: string,
    metadata?: SessionMetadata,
  ) {
    const parsed = metadata?.userAgent
      ? this.parseUserAgent(metadata.userAgent)
      : null;

    return this.prisma.session.create({
      data: {
        userId,
        refreshToken,
        deviceName: metadata?.deviceName ?? parsed?.deviceName ?? 'Unknown',
        deviceType: metadata?.deviceType ?? parsed?.deviceType ?? 'unknown',
        browser: metadata?.browser ?? parsed?.browser ?? null,
        os: metadata?.os ?? parsed?.os ?? null,
        ipAddress: metadata?.ipAddress ?? null,
        userAgent: metadata?.userAgent ?? null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async findSessionByRefreshToken(refreshToken: string) {
    return this.prisma.session.findUnique({
      where: { refreshToken },
      select: { id: true },
    });
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      const session = await this.prisma.session.findUnique({
        where: { refreshToken },
      });
      if (session) {
        await this.prisma.session.delete({ where: { id: session.id } });
      }
      // Also clear legacy User.refreshToken if it matches
      const user = await this.prisma.user.findFirst({
        where: { refreshToken },
      });
      if (user) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { refreshToken: null, refreshTokenExpiry: null },
        });
      }
    }
    return { message: 'Logged out successfully' };
  }

  async loginWithToken(token: string, sessionMetadata?: SessionMetadata) {
    let payload: { sub: string; email: string; role: string; name?: string };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired invite link');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const authPayload = await this.generateAuthPayload(user, sessionMetadata);

    return {
      user: authPayload.user,
      token: authPayload.token,
      refreshToken: authPayload.refreshToken,
      sessionId: authPayload.sessionId,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    await this.mailService.sendPasswordResetEmail(user.email, user.name, token);
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { resetToken: token },
    });
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    });
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { verificationToken: token },
    });
    if (
      !user ||
      !user.verificationTokenExpiry ||
      user.verificationTokenExpiry < new Date()
    ) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return;

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { verificationToken, verificationTokenExpiry },
    });

    await this.mailService.sendEmailVerification(
      user.email,
      user.name,
      verificationToken,
    );
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    currentSessionId?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        'This account uses Google/GitHub Sign-In. Please use "Forgot Password" to set a password first.',
      );
    }

    const verified = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!verified) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Revoke all other sessions as a security measure
    if (currentSessionId) {
      await this.prisma.session.deleteMany({
        where: { userId, id: { not: currentSessionId } },
      });
    }

    return { message: 'Password updated successfully' };
  }

  private async generateTokens(
    id: string,
    email: string,
    role: string,
    plan: Plan,
  ) {
    const payload = { sub: id, email, role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = crypto.randomBytes(40).toString('hex');

    return { accessToken, refreshToken };
  }

  private async generateAuthPayload(
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      plan: Plan;
      avatarUrl?: string | null;
      twoFactorEnabled?: boolean;
    },
    sessionMetadata?: SessionMetadata,
  ) {
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.plan,
    );

    // Create session record for multi-session support
    const session = await this.createSession(user.id, tokens.refreshToken, sessionMetadata);

    // Legacy: still store refreshToken on User for backward compat
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: tokens.refreshToken,
        refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    let branding = null;
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { organizationId: true },
    });
    if (fullUser?.organizationId) {
      branding = await this.prisma.organization.findUnique({
        where: { id: fullUser.organizationId },
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          primaryColor: true,
        },
      });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
        avatarUrl: user.avatarUrl || null,
        twoFactorEnabled: user.twoFactorEnabled,
        branding: branding
          ? { ...branding, isCustomized: true }
          : {
              id: null,
              name: 'InterviewOS',
              slug: null,
              logoUrl: null,
              primaryColor: '#0066cc',
              isCustomized: false,
            },
      },
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      sessionId: session.id,
    };
  }
}
