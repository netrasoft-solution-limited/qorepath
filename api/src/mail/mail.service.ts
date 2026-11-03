import { Injectable, Logger } from '@nestjs/common';
import { IntegrationsService } from '../integrations/integrations.service';

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

  // Credentials come from IntegrationsService: dashboard-managed values, else server env.
  constructor(private integrations: IntegrationsService) {}

  /** Sends one email and reports the outcome (used by the admin "send test email" button). */
  async sendOne(email: OutgoingEmail): Promise<{ ok: boolean; error?: string }> {
    const { apiKey, mailFrom } = await this.integrations.resend();
    if (!apiKey || !mailFrom) return { ok: false, error: 'Email is not configured yet — save a Resend API key and sender first.' };
    try {
      const res = await fetch(`${RESEND_BASE}/emails`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: mailFrom, to: [email.to], subject: email.subject, html: email.html }),
      });
      if (res.ok) return { ok: true };
      const body = (await res.json().catch(() => null)) as any;
      return { ok: false, error: `Resend ${res.status}: ${body?.message ?? 'send failed'}` };
    } catch {
      return { ok: false, error: 'Could not reach Resend' };
    }
  }

  /**
   * Sends each email individually (one recipient per message, so learners never
   * see each other's addresses). Never throws — a failed email must not break
   * the payment/enrollment/etc. flow that triggered it.
   */
  async send(emails: OutgoingEmail[]): Promise<void> {
    const list = emails.filter((e) => e.to);
    if (!list.length) return;

    const { apiKey, mailFrom } = await this.integrations.resend();
    if (!apiKey || !mailFrom) {
      this.logger.warn(`Email disabled (no Resend API key / sender configured) — skipped ${list.length} × "${list[0].subject}"`);
      return;
    }

    for (let i = 0; i < list.length; i += BATCH_SIZE) {
      const chunk = list.slice(i, i + BATCH_SIZE).map((e) => ({
        from: mailFrom,
        to: [e.to],
        subject: e.subject,
        html: e.html,
      }));
      try {
        const res = await fetch(`${RESEND_BASE}/emails/batch`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
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
