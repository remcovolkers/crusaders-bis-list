import { Inject, Injectable } from '@nestjs/common';
import {
  RESERVATION_REPOSITORY,
  IReservationRepository,
  USER_REPOSITORY,
  IUserRepository,
  RAIDER_REPOSITORY,
  IRaiderRepository,
} from '@crusaders-bis-list/backend-domain';
import { EmailService, emailShell, emailButton, EMAIL_BASE_URL } from '@crusaders-bis-list/backend-infrastructure';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ResetAllReservationsUseCase {
  private readonly isDev: boolean;
  private readonly devEmail: string;

  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepo: IReservationRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    @Inject(RAIDER_REPOSITORY)
    private readonly raiderRepo: IRaiderRepository,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {
    this.isDev = this.config.get<string>('NODE_ENV') !== 'production';
    this.devEmail = this.config.get<string>('DEV_EMAIL') ?? 'remco.volkers1@gmail.com';
  }

  async execute(reason?: string): Promise<void> {
    if (this.isDev) {
      const devUser = await this.userRepo.findByEmail(this.devEmail);
      if (devUser) {
        const raider = await this.raiderRepo.findByUserId(devUser.id);
        if (raider) await this.reservationRepo.deleteByRaider(raider.id);
      }
    } else {
      await this.reservationRepo.deleteAll();
    }

    const users = await this.userRepo.findAll();
    const emails = users.map((u) => u.email).filter(Boolean);

    if (emails.length === 0) return;

    const reasonBlock = reason?.trim()
      ? `<p style="margin-top:12px;padding:10px 14px;background:rgba(240,192,64,0.08);border-left:3px solid #f0c040;border-radius:4px;font-style:italic;">"${reason.trim()}"</p>`
      : '';

    await this.emailService.sendBulk(
      emails,
      'Crusaders BiS List — Reserveringen gereset',
      emailShell(`
        <p>Hoi,</p>
        <p>
          Een officer heeft zojuist <strong>alle reserveringen gereset</strong>.
          Je kunt opnieuw je BiS-items reserveren.
        </p>
        ${reasonBlock}
        ${emailButton('Naar BiS List', `${EMAIL_BASE_URL}/loot`)}
      `),
    );
  }
}
