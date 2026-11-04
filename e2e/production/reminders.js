const fs = require('fs');
const { Client } = require('pg');
const { record, api, login } = require('./lib');
(async () => {
  const run = `e2e${Date.now().toString(36)}`;
  const sup = await login(process.env.SUPER_EMAIL, process.env.SUPER_PW);
  const c = new Client({ connectionString: process.env.PROD_DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  try {
    await api('POST', '/auth/register', { body: { firstName: 'Bal', lastName: `E2E-${run}`, email: `delivered+${run}-bal@resend.dev`, password: 'E2eBal!2026x' } });
    const u = (await c.query('SELECT id FROM users WHERE email LIKE $1', [`%${run}%`])).rows[0];
    const ins = `INSERT INTO payments("userId",amount,status,"planReference","installmentNumber","totalInstallments",notes,"createdAt","updatedAt") VALUES ($1,500,$2,$3,$4,2,$5,now()-interval '8 days',now()-interval '8 days')`;
    await c.query(ins, [u.id, 'paid', `PLAN-${run}`, 1, `E2E ${run}`]);
    await c.query(ins, [u.id, 'pending', `PLAN-${run}`, 2, `E2E ${run}`]);
    const r1 = await api('POST', '/payments/reminders/run', { token: sup });
    const r2 = await api('POST', '/payments/reminders/run', { token: sup });
    const row = (await c.query(`SELECT "remindersSent", "lastReminderAt" FROM payments WHERE "planReference" = $1 AND "installmentNumber" = 2`, [`PLAN-${run}`])).rows[0];
    record('reminders', 'a due balance gets exactly one reminder', r1.data?.sent === 1 && r2.data?.sent === 0 && row.remindersSent === 1 && !!row.lastReminderAt, `${JSON.stringify(r1.data)} then ${JSON.stringify(r2.data)}`);
    const tpl = (await api('GET', '/settings/email-templates', { token: sup })).data.find((t) => t.key === 'instalment reminder');
    record('reminders', 'reminder email appears in Notification Templates', !!tpl && tpl.enabled, tpl?.subject);
    const plan = (await api('GET', '/settings/enrollment-rules')).data.paymentPlan;
    record('reminders', 'default schedule is every 7 days, up to 4 times', plan.reminderEveryDays === 7 && plan.maxReminders === 4, JSON.stringify(plan));
  } finally {
    await c.query('BEGIN');
    await c.query(`DELETE FROM payments WHERE "planReference" = $1`, [`PLAN-${run}`]);
    await c.query(`DELETE FROM users WHERE email LIKE $1`, [`%${run}%`]);
    await c.query('COMMIT');
    await c.end();
    console.log('cleanup done');
  }
})();
