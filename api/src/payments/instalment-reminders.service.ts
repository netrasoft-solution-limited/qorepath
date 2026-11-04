import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Payment } from './payment.entity';
import { SettingsService } from '../settings/settings.service';
import { NotificationsService } from '../mail/notifications.service';
import { AuditService } from '../audit/audit.service';

const FIRST_RUN_MS = 60 * 1000;
const EVERY_MS = 60 * 60 * 1000;

/**
 * Emails learners about unpaid instalment balances. The free API server sleeps when idle, so this
 * runs a minute after each start-up and then hourly while awake; each balance records when it was
 * last reminded, so however often the server wakes, nobody is emailed more than once per interval.
 */
@Injectable()
export class InstalmentRemindersService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(InstalmentRemindersService.name);
  private timers: NodeJS.Timeout[] = [];
  private running = false;

  constructor(
    private dataSource: DataSource,
    private settings: SettingsService,
    private notifications: NotificationsService,
    private audit: AuditService,
  ) {}

  onApplicationBootstrap() {
    if (process.env.DISABLE_REMINDERS === 'true') return;
    const first = setTimeout(() => {
      this.run().catch(() => {});
      const every = setInterval(() => this.run().catch(() => {}), EVERY_MS);
      every.unref();
      this.timers.push(every);
    }, FIRST_RUN_MS);
    first.unref();
    this.timers.push(first);
  }

  onApplicationShutdown() {
    this.timers.forEach(clearTimeout);
  }

  /** Sends whatever reminders are due; returns how many went out. */
  async run(): Promise<{ sent: number }> {
    if (this.running) return { sent: 0 };
    this.running = true;
    try {
      const plan = await this.settings.getPaymentPlan();
      const email = (await this.settings.getEmailSettings())['instalment reminder'];
      if (!plan.maxReminders || (email && !email.enabled)) return { sent: 0 };

      // Open balances whose first instalment is paid and whose last reminder (or the first payment) is old enough.
      const due: { id: string }[] = await this.dataSource.query(
        `SELECT b.id FROM payments b
         JOIN payments f ON f."planReference" = b."planReference" AND f."installmentNumber" = 1 AND f.status = 'paid'
         WHERE b."installmentNumber" > 1 AND b.status = 'pending' AND b."remindersSent" < $1
           AND COALESCE(b."lastReminderAt", f."updatedAt") < now() - make_interval(days => $2)
         ORDER BY b."createdAt" LIMIT 200`,
        [plan.maxReminders, plan.reminderEveryDays],
      );

      let sent = 0;
      for (const { id } of due) {
        // Claim it first so two runs can never email the same balance twice.
        const [, claimed] = await this.dataSource.query(
          `UPDATE payments SET "remindersSent" = "remindersSent" + 1, "lastReminderAt" = now()
           WHERE id = $1 AND status = 'pending' AND "remindersSent" < $2
             AND ("lastReminderAt" IS NULL OR "lastReminderAt" < now() - make_interval(days => $3))
           RETURNING id`,
          [id, plan.maxReminders, plan.reminderEveryDays],
        );
        if (!claimed) continue;
        const b = await this.dataSource.getRepository(Payment).findOneBy({ id });
        if (!b?.user?.email) continue;
        this.notifications.instalmentReminder({
          email: b.user.email, firstName: b.user.firstName, track: b.program?.track ?? 'your program', balance: b.amount,
        });
        sent++;
      }
      if (sent) {
        this.logger.log(`Sent ${sent} instalment reminder(s)`);
        await this.audit.record({
          actor: null, action: 'INSTALMENT_REMINDERS_SENT', entity: 'Payment',
          summary: `Emailed ${sent} instalment balance reminder${sent === 1 ? '' : 's'}`,
        });
      }
      return { sent };
    } catch (err) {
      this.logger.error('Instalment reminders failed', err as Error);
      return { sent: 0 };
    } finally {
      this.running = false;
    }
  }
}
