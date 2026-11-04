import { bootApp, fixtures, TestApp } from './helpers';
import { InstalmentRemindersService } from '../src/payments/instalment-reminders.service';

describe('Instalment balance reminders', () => {
  let t: TestApp;
  let reminders: InstalmentRemindersService;
  let learnerId: string;

  const plan = async (ref: string, firstPaid: boolean, daysAgo: number) => {
    const insert = `INSERT INTO payments("userId", amount, status, "planReference", "installmentNumber", "totalInstallments", "createdAt", "updatedAt")
                    VALUES ($1, 500, $2, $3, $4, 2, now() - make_interval(days => $5), now() - make_interval(days => $5))`;
    await t.ds.query(insert, [learnerId, firstPaid ? 'paid' : 'pending', ref, 1, daysAgo]);
    await t.ds.query(insert, [learnerId, 'pending', ref, 2, daysAgo]);
  };
  const sentFor = async (ref: string) =>
    (await t.ds.query(`SELECT "remindersSent" FROM payments WHERE "planReference" = $1 AND "installmentNumber" = 2`, [ref]))[0].remindersSent;

  beforeAll(async () => {
    t = await bootApp();
    reminders = t.app.get(InstalmentRemindersService);
    learnerId = (await fixtures(t).learner('ada')).id;
    await plan('DUE', true, 8);
    await plan('RECENT', true, 2);
    await plan('UNPAID-FIRST', false, 9);
  });
  afterAll(() => t.close());

  it('reminds only balances whose first instalment was paid long enough ago, once', async () => {
    expect(await reminders.run()).toEqual({ sent: 1 });
    expect(await sentFor('DUE')).toBe(1);
    expect(await sentFor('RECENT')).toBe(0);
    expect(await sentFor('UNPAID-FIRST')).toBe(0);
    expect(await reminders.run()).toEqual({ sent: 0 });
  });

  it('reminds again after the interval, up to the limit, and stops once paid', async () => {
    await t.ds.query(`UPDATE payments SET "lastReminderAt" = now() - interval '8 days' WHERE "planReference" = 'DUE' AND "installmentNumber" = 2`);
    expect(await reminders.run()).toEqual({ sent: 1 });
    await t.ds.query(`UPDATE payments SET "lastReminderAt" = now() - interval '8 days', "remindersSent" = 4 WHERE "planReference" = 'DUE' AND "installmentNumber" = 2`);
    expect(await reminders.run()).toEqual({ sent: 0 });
    await t.ds.query(`UPDATE payments SET "remindersSent" = 1, status = 'paid' WHERE "planReference" = 'DUE' AND "installmentNumber" = 2`);
    expect(await reminders.run()).toEqual({ sent: 0 });
  });
});
