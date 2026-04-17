import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-bnet';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LinkBnetUseCase } from '@crusaders-bis-list/backend-application';
import { User } from '@crusaders-bis-list/backend-domain';
import { Request } from 'express';

interface BnetUserProfile {
  id: number | string;
  battletag: string;
}

type DoneFn = (err: unknown, user?: User | false) => void;

@Injectable()
export class BnetStrategy extends PassportStrategy(Strategy, 'bnet') {
  constructor(
    private readonly config: ConfigService,
    private readonly linkBnet: LinkBnetUseCase,
    private readonly jwtService: JwtService,
  ) {
    super({
      clientID: config.getOrThrow<string>('BLIZZARD_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('BLIZZARD_CLIENT_SECRET'),
      callbackURL: config.getOrThrow<string>('BNET_CALLBACK_URL'),
      region: config.get<string>('BLIZZARD_REGION') ?? 'eu',
      scope: ['wow.profile'],
      state: false,
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    accessToken: string,
    _refreshToken: string,
    profile: BnetUserProfile,
    done: DoneFn,
  ): Promise<void> {
    const linkToken = req.query['state'] as string | undefined;
    if (!linkToken) {
      done(new UnauthorizedException('Missing link token'), false);
      return;
    }
    let userId: string;
    try {
      const payload = this.jwtService.verify<{ sub: string }>(linkToken);
      userId = payload.sub;
    } catch {
      done(new UnauthorizedException('Invalid or expired link token'), false);
      return;
    }
    const user = await this.linkBnet.execute(userId, String(profile.id), profile.battletag, accessToken);
    done(null, user);
  }
}
