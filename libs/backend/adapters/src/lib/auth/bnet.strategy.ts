import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-bnet';
import { ConfigService } from '@nestjs/config';
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
  ) {
    super({
      clientID: config.getOrThrow<string>('BLIZZARD_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('BLIZZARD_CLIENT_SECRET'),
      callbackURL: config.getOrThrow<string>('BNET_CALLBACK_URL'),
      region: config.get<string>('BLIZZARD_REGION') ?? 'eu',
      scope: ['wow.profile'],
      state: true,
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
    const session = req.session as unknown as Record<string, unknown>;
    const linkUserId = session['linkUserId'] as string | undefined;

    if (!linkUserId) {
      done(new Error('Battle.net login is not supported; use account linking'), false);
      return;
    }

    const user = await this.linkBnet.execute(linkUserId, String(profile.id), profile.battletag, accessToken);
    done(null, user);
  }
}
