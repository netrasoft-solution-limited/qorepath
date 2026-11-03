import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const RESEND_BASE = 'https://api.resend.com';
// Resend's batch endpoint accepts at most 100 emails per request.
const BATCH_SIZE = 100;

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private config: ConfigService) {}

  private get apiKey() {
    return this.config.get<string>('RESEND_API_KEY');
  }

  private get from() {
    return this.config.get<string>('MAIL_FROM');
  }

  /**
   * Sends each email individually (one recipient per message, so learners never
   * see each other's addresses). Never throws — a failed email must not break
   * the payment/enrollment/etc. flow that triggered it.
   */
  async send(emails: OutgoingEmail[]): Promise<void> {
    const list = emails.filter((e) => e.to);
    if (!list.length) return;

    if (!this.apiKey || !this.from) {
      this.logger.warn(
        `Email disabled (RESEND_API_KEY / MAIL_FROM not set) — skipped ${list.length} × "${list[0].subject}"`,
      );
      return;
    }

    for (let i = 0; i < list.length; i += BATCH_SIZE) {
      const chunk = list.slice(i, i + BATCH_SIZE).map((e) => ({
        from: this.from,
        to: [e.to],
        subject: e.subject,
        html: e.html,
      }));
      try {
        const res = await fetch(`${RESEND_BASE}/emails/batch`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chunk),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          this.logger.error(`Resend ${res.status} sending "${chunk[0].subject}": ${body}`);
        }
      } catch (err) {
        this.logger.error('Could not reach Resend', err as Error);
      }
    }
  }
}
