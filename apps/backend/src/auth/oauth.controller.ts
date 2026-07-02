import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from '../common/constants/cookies';

@ApiTags('OAuth')
@Controller('auth')
export class OAuthController {
  constructor(private readonly configService: ConfigService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const payload = (req as any).user;
    if (!payload) {
      return res.redirect(`${frontendUrl}/auth/login?error=oauth_failed`);
    }
    const secure = process.env.NODE_ENV === 'production';
    res.cookie(
      ACCESS_TOKEN_COOKIE,
      payload.token,
      accessTokenCookieOptions(secure),
    );
    res.cookie(
      REFRESH_TOKEN_COOKIE,
      payload.refreshToken,
      refreshTokenCookieOptions(secure),
    );
    const userEncoded = encodeURIComponent(JSON.stringify(payload.user));
    return res.redirect(
      `${frontendUrl}/auth/oauth-callback?user=${userEncoded}`,
    );
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const payload = (req as any).user;
    if (!payload) {
      return res.redirect(`${frontendUrl}/auth/login?error=oauth_failed`);
    }
    const secure = process.env.NODE_ENV === 'production';
    res.cookie(
      ACCESS_TOKEN_COOKIE,
      payload.token,
      accessTokenCookieOptions(secure),
    );
    res.cookie(
      REFRESH_TOKEN_COOKIE,
      payload.refreshToken,
      refreshTokenCookieOptions(secure),
    );
    const userEncoded = encodeURIComponent(JSON.stringify(payload.user));
    return res.redirect(
      `${frontendUrl}/auth/oauth-callback?user=${userEncoded}`,
    );
  }
}
