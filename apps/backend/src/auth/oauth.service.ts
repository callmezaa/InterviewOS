import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as crypto from 'crypto';

interface FindOrCreateParams {
  provider: string;
  providerId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

@Injectable()
export class OAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async findOrCreateOAuthUser(params: FindOrCreateParams) {
    const { provider, providerId, email, name, avatarUrl } = params;

    // Try to find existing user by provider + providerId
    const existingByProvider = await this.prisma.user.findFirst({
      where: { provider, providerId },
    });

    if (existingByProvider) {
      return this.generateAuthPayload(existingByProvider);
    }

    // Check if email already registered (maybe via email/password)
    const existingByEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingByEmail) {
      // Link this OAuth provider to the existing account
      const updated = await this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          provider,
          providerId,
          ...(avatarUrl ? { avatarUrl } : {}),
        },
      });
      return this.generateAuthPayload(updated);
    }

    // Create new user with OAuth
    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        provider,
        providerId,
        avatarUrl,
        role: 'CANDIDATE',
      },
    });

    return this.generateAuthPayload(user);
  }

  private async generateAuthPayload(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatarUrl?: string | null;
  }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = crypto.randomBytes(40).toString('hex');

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
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
        avatarUrl: user.avatarUrl || null,
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
      token: accessToken,
      refreshToken,
    };
  }
}
