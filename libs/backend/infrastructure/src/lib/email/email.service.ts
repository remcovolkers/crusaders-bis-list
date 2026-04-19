import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

const BASE_URL = 'https://crusaders-bis-list.onrender.com';

/** Wraps content in the standard Crusaders email shell. */
export function emailShell(body: string): string {
  return `
    <div style="font-family:sans-serif;color:#e2e8f0;background:#0f172a;padding:32px;border-radius:8px;max-width:480px;margin:0 auto;">
      <h2 style="color:#f0c040;margin-top:0;">Crusaders BiS List</h2>
      ${body}
      <p style="margin-top:24px;font-size:12px;color:#64748b;">
        Dit is een automatisch bericht van Crusaders BiS List.
      </p>
    </div>
  `;
}

/** Reusable CTA button for emails. */
export function emailButton(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#f0c040;color:#0f172a;border-radius:6px;text-decoration:none;font-weight:700;">${label}</a>`;
}

export { BASE_URL as EMAIL_BASE_URL };

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter | null;
  private readonly fromAddress: string;
  private readonly isDev: boolean;
  private readonly devRecipient: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT') ?? 587;
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    this.fromAddress = this.config.get<string>('SMTP_FROM') ?? user ?? 'noreply@crusadersbislist.com';
    this.isDev = this.config.get<string>('NODE_ENV') !== 'production';
    this.devRecipient = this.config.get<string>('DEV_EMAIL') ?? 'remco.volkers1@gmail.com';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      this.logger.warn('SMTP not configured — emails will be skipped. Set SMTP_HOST, SMTP_USER, SMTP_PASS.');
      this.transporter = null;
    }
  }

  async send(options: EmailOptions): Promise<void> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    await this.sendBulk(recipients, options.subject, options.html);
  }

  async sendBulk(recipients: string[], subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`[EmailService] Skipping email to ${recipients.length} recipient(s): SMTP not configured.`);
      return;
    }

    let targets = recipients;

    if (this.isDev) {
      this.logger.warn(
        `[EmailService] DEV mode — redirecting ${recipients.length} recipient(s) to ${this.devRecipient}`,
      );
      targets = [this.devRecipient];
    }

    const results = await Promise.allSettled(
      targets.map((to) => {
        const transport = this.transporter as Transporter;
        return transport.sendMail({
          from: this.fromAddress,
          to,
          subject: this.isDev ? `[DEV] ${subject}` : subject,
          html,
        });
      }),
    );

    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) {
      this.logger.error(`[EmailService] ${failed}/${targets.length} emails failed to send.`);
    } else {
      this.logger.log(`[EmailService] Sent ${targets.length} email(s): "${subject}"`);
    }
  }
}
