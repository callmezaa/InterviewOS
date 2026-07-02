import {
  Controller,
  Post,
  Get,
  Body,
  Delete,
  Param,
  UseGuards,
  Patch,
  Req,
  Res,
  UnauthorizedException,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiConsumes } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import type { Request, Response, Express } from 'express';
import { AuthService, type SessionMetadata } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthThrottlerGuard } from './auth-throttler.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
} from '../common/constants/cookies';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginWithTokenDto } from './dto/login-with-token.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(AuthThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private getSessionMetadata(req: Request): SessionMetadata {
    const ua = req.headers['user-agent'] || '';
    const ip = req.ip || req.socket?.remoteAddress || req.headers['x-forwarded-for'] as string || undefined;
    return { userAgent: ua, ipAddress: ip };
  }

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const { user, token, refreshToken } = await this.authService.register(
      dto.email,
      dto.password,
      dto.name,
      dto.role,
      this.getSessionMetadata(req),
    );
    const secure = false;
    res.cookie(ACCESS_TOKEN_COOKIE, token, accessTokenCookieOptions(secure));
    res.cookie(
      REFRESH_TOKEN_COOKIE,
      refreshToken,
      refreshTokenCookieOptions(secure),
    );
    return { user, token, refreshToken };
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const result = await this.authService.login(dto.email, dto.password, this.getSessionMetadata(req));

    if ('twoFactorRequired' in result) {
      return result;
    }

    const { user, token, refreshToken } = result;
    const secure = false;
    res.cookie(ACCESS_TOKEN_COOKIE, token, accessTokenCookieOptions(secure));
    res.cookie(
      REFRESH_TOKEN_COOKIE,
      refreshToken,
      refreshTokenCookieOptions(secure),
    );
    return { user, token, refreshToken };
  }

  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  @Get('me')
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, dto);
  }

  // ── 2FA Endpoints ────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  @Post('2fa/setup')
  async setup2fa(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.setup2fa(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  @Post('2fa/verify')
  async verify2faSetup(
    @CurrentUser() user: AuthenticatedUser,
    @Body('token') token: string,
  ) {
    if (!token) throw new BadRequestException('Verification token is required');
    return this.authService.verify2faSetup(user.id, token);
  }

  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  @Post('2fa/disable')
  async disable2fa(
    @CurrentUser() user: AuthenticatedUser,
    @Body('password') password?: string,
  ) {
    return this.authService.disable2fa(user.id, password);
  }

  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  @Post('2fa/backup-codes')
  async generateBackupCodes(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.generateBackupCodes(user.id);
  }

  @SkipThrottle()
  @Post('2fa/challenge')
  async verify2faChallenge(
    @Body('tempToken') tempToken: string,
    @Body('code') code: string,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    if (!tempToken)
      throw new BadRequestException('Temporary token is required');
    if (!code) throw new BadRequestException('Verification code is required');

    const result = await this.authService.verify2faChallenge(tempToken, code, this.getSessionMetadata(req));
    const { user, token, refreshToken } = result;
    const secure = false;
    res.cookie(ACCESS_TOKEN_COOKIE, token, accessTokenCookieOptions(secure));
    res.cookie(
      REFRESH_TOKEN_COOKIE,
      refreshToken,
      refreshTokenCookieOptions(secure),
    );
    return { user, token, refreshToken };
  }

  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  @Delete('avatar')
  async deleteAvatar(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.deleteAvatar(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  @Post('avatar')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Only image files are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Avatar file is required');
    }
    return this.authService.uploadAvatar(user.id, file.buffer, file.mimetype);
  }

  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  @Patch('password')
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return {
      message: 'If that email is registered, a reset link has been sent.',
    };
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { message: 'Password updated successfully.' };
  }

  @Post('verify-email')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authService.verifyEmail(dto.token);
    return { message: 'Email verified successfully.' };
  }

  @Post('resend-verification')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.authService.resendVerificationEmail(dto.email);
    return {
      message:
        'If that email is registered and unverified, a new verification link has been sent.',
    };
  }

  @Post('login-with-token')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async loginWithToken(
    @Body() dto: LoginWithTokenDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const { user, token, refreshToken } = await this.authService.loginWithToken(
      dto.token,
      this.getSessionMetadata(req),
    );
    const secure = false;
    res.cookie(ACCESS_TOKEN_COOKIE, token, accessTokenCookieOptions(secure));
    res.cookie(
      REFRESH_TOKEN_COOKIE,
      refreshToken,
      refreshTokenCookieOptions(secure),
    );
    return { user, token, refreshToken };
  }

  @Post('refresh')
  @SkipThrottle()
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }
    const result = await this.authService.refreshToken(refreshToken, this.getSessionMetadata(req));
    const secure = process.env.NODE_ENV === 'production';
    res.cookie(
      ACCESS_TOKEN_COOKIE,
      result.token,
      accessTokenCookieOptions(secure),
    );
    res.cookie(
      REFRESH_TOKEN_COOKIE,
      result.refreshToken,
      refreshTokenCookieOptions(secure),
    );
    return { user: result.user, token: result.token };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    const result = await this.authService.logout(refreshToken);
    const secure = process.env.NODE_ENV === 'production';
    res.clearCookie(ACCESS_TOKEN_COOKIE, clearAccessTokenCookie(secure));
    res.clearCookie(REFRESH_TOKEN_COOKIE, clearRefreshTokenCookie(secure));
    return result;
  }

  // ── Session Management ──────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  @Get('sessions')
  async getSessions(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    let currentSessionId: string | undefined;
    if (refreshToken) {
      const session = await this.authService.findSessionByRefreshToken(refreshToken);
      currentSessionId = session?.id;
    }
    return this.authService.getSessions(user.id, currentSessionId);
  }

  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  @Delete('sessions/:id')
  async revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (refreshToken) {
      const session = await this.authService.findSessionByRefreshToken(refreshToken);
      if (session?.id === id) {
        throw new BadRequestException('Cannot revoke current session. Use logout instead.');
      }
    }
    return this.authService.revokeSession(user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  @Delete('sessions')
  async revokeOtherSessions(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    let currentSessionId: string | undefined;
    if (refreshToken) {
      const session = await this.authService.findSessionByRefreshToken(refreshToken);
      currentSessionId = session?.id;
    }
    return this.authService.revokeOtherSessions(user.id, currentSessionId!);
  }
}
