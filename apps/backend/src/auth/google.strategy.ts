import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { OAuthService } from './oauth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: OAuthService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: `${configService.getOrThrow<string>('BACKEND_URL')}/api/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: {
      id: string;
      emails?: { value: string; verified?: boolean }[];
      name?: { givenName?: string; familyName?: string };
      displayName?: string;
      photos?: { value: string }[];
    },
    done: (err: Error | null, user?: any) => void,
  ) {
    const { id, emails, name, displayName, photos } = profile;
    const email = emails?.[0]?.value;
    if (!email) {
      done(new Error('Google account has no email address'), null);
      return;
    }

    const user = await this.oauthService.findOrCreateOAuthUser({
      provider: 'google',
      providerId: id,
      email,
      name: displayName || name?.givenName || email.split('@')[0],
      avatarUrl: photos?.[0]?.value || null,
    });

    done(null, user);
  }
}
