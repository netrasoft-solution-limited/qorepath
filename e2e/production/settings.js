// Cohort Rules / instalment plan / Notification Templates, against production.
// Real rules are only re-saved with their current values; the one email toggled is restored.
const fs = require('fs');
const { Client } = require('pg');
const { SITE, record, api, login, browser, page, seedSession, sleep } = require('./lib');

(async () => {
  const run = `e2e${Date.now().toString(36)}`;
  const sup = await login(process.env.SUPER_EMAIL, process.env.SUPER_PW);
  const pw = 'E2eRules!2026x';
  const email = (tag) => `delivered+${run}-${tag}@resend.dev`;
  const before = (await api('GET', '/settings/enrollment-rules')).data;
  const tplBefore = (await api('GET', '/settings/email-templates', { token: sup })).data;
  try {
    record('rules', 'public rules endpoint', before.cohortRules && before.paymentPlan, JSON.stringify(before));
    // Re-save current values (no behaviour change)
    const r1 = await api('PATCH', '/settings/cohort-rules', { token: sup, body: before.cohortRules });
    const r2 = await api('PATCH', '/settings/payment-plan', { token: sup, body: before.paymentPlan });
    record('rules', 'admin saves cohort rules and the instalment plan', r1.status === 200 && r2.status === 200 && JSON.stringify(r1.data) === JSON.stringify(before.cohortRules), `${r1.status}/${r2.status}`);

    // Settings-only admin + a learner
    const admin = (await api('POST', '/users', { token: sup, body: { firstName: 'Rules', lastName: `E2E-${run}`, email: email('admin'), password: pw, role: 'admin' } })).data;
    await api('PATCH', `/users/${admin.id}`, { token: sup, body: { permissions: ['settings'] } });
    const tAdmin = await login(admin.email, pw);
    await api('POST', '/auth/register', { body: { firstName: 'Late', lastName: `E2E-${run}`, email: email('learner'), password: pw } });
    const tL = await login(email('learner'), pw);
    const deny = await api('PATCH', '/settings/cohort-rules', { token: tL, body: {} });
    record('rules', "learners can't change rules", deny.status === 403, `${deny.status}`);

    // Finished cohorts are always closed
    const past = (d) => new Date(Date.now() - d * 864e5).toISOString().slice(0, 10);
    const cohort = (await api('POST', '/cohorts', { token: sup, body: { name: `E2E Cohort ${run}`, startDate: past(90), endDate: past(10), status: 'completed' } })).data;
    const prog = (await api('POST', '/programs', { token: sup, body: { track: 'Data Analytics', description: `E2E ${run}`, price: 1000, cohortId: cohort.id } })).data;
    record('rules', 'a new track without a seat limit gets the default', prog.maxLearners === before.cohortRules.defaultMaxLearners, `${prog.maxLearners}`);
    const closed = await api('POST', '/payments/initialize', { token: tL, body: { programId: prog.id } });
    record('rules', "checkout is refused for a finished cohort", closed.status === 400 && /closed/.test(closed.data?.message), closed.data?.message);

    // Templates
    const list = (await api('GET', '/settings/email-templates', { token: tAdmin })).data;
    record('templates', 'all 14 emails listed for a settings admin', list.length === 14 && list.filter((t) => t.locked).length === 4, `${list.length}`);
    const lock = await api('PATCH', `/settings/email-templates/${encodeURIComponent('payment receipt')}`, { token: tAdmin, body: { enabled: false } });
    record('templates', "payment receipt can't be switched off", lock.status === 400, lock.data?.message);
    const off = await api('PATCH', `/settings/email-templates/${encodeURIComponent('withdrawal received')}`, { token: tAdmin, body: { enabled: false } });
    const offOk = off.data?.find?.((t) => t.key === 'withdrawal received')?.enabled === false;
    const orig = tplBefore.find((t) => t.key === 'withdrawal received');
    await api('PATCH', `/settings/email-templates/${encodeURIComponent('withdrawal received')}`, { token: sup, body: { enabled: orig.enabled, note: orig.note } });
    record('templates', 'an email can be switched off (and back)', offOk, '');
    const prev = await api('POST', '/settings/email-templates/welcome/preview', { token: tAdmin, body: { note: `Preview note ${run}` } });
    record('templates', 'preview with a note is sent to the admin', prev.status === 200 && prev.data?.to === admin.email, JSON.stringify(prev.data));

    // Pages
    const b = await browser();
    try {
      const issues = [];
      const p = await page(b, issues);
      await seedSession(p, tAdmin);
      await p.goto(`${SITE}/admin/settings`, { waitUntil: 'networkidle2', timeout: 90000 });
      await sleep(1000);
      const clickTab = async (label) => {
        await p.evaluate((l) => [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === l)?.click(), label);
        await sleep(1500);
        return p.evaluate(() => document.body.innerText);
      };
      let text = await clickTab('Cohort Rules');
      record('pages', 'Cohort Rules tab', text.includes('Default seats per track') && text.includes('Late enrollment') && !text.includes('will be added here'), '');
      text = await clickTab('Payment Rules');
      record('pages', 'Payment Rules shows the instalment settings', text.includes('Offer two instalments'), '');
      text = await clickTab('Notification Templates');
      record('pages', 'Notification Templates lists emails with locks', text.includes('Payment receipt') && text.includes('Always on') && text.includes('Certificate issued'), '');
      await p.goto(`${SITE}/public/tracks`, { waitUntil: 'networkidle2', timeout: 90000 });
      await sleep(1500);
      text = await p.evaluate(() => document.body.innerText);
      record('pages', 'pricing page matches the instalment setting', before.paymentPlan.allowInstallments ? text.includes('Two instalments') : !text.includes('Two instalments'), '');
      record('pages', 'no console/network errors', issues.length === 0, issues.join(' | '));
    } finally {
      await b.close();
    }
    const audit = (await api('GET', `/audit?search=${encodeURIComponent('email')}&limit=20`, { token: sup })).data;
    record('audit', 'template change is in the audit log', (audit.items ?? audit).some((a) => a.action === 'EMAIL_TEMPLATE_CHANGED' && a.actorEmail === admin.email), '');
  } finally {
    const after = (await api('GET', '/settings/enrollment-rules')).data;
    console.log('rules unchanged:', JSON.stringify(after) === JSON.stringify(before));
    const tplAfter = (await api('GET', '/settings/email-templates', { token: sup })).data;
    console.log('templates unchanged:', JSON.stringify(tplAfter) === JSON.stringify(tplBefore));
    const c = new Client({ connectionString: process.env.PROD_DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await c.connect();
    const like = `%${run}%`;
    await c.query('BEGIN');
    await c.query(`DELETE FROM programs WHERE "cohortId" IN (SELECT id FROM cohorts WHERE name LIKE $1)`, [like]);
    await c.query(`DELETE FROM cohorts WHERE name LIKE $1`, [like]);
    await c.query(`DELETE FROM users WHERE email LIKE $1`, [like]);
    await c.query(`DELETE FROM audit_entries WHERE summary LIKE $1 OR "actorEmail" LIKE $1`, [like]);
    await c.query('COMMIT');
    const left = (await c.query(`SELECT (SELECT count(*) FROM users) u, (SELECT count(*) FROM cohorts) c`)).rows[0];
    console.log('cleanup done:', JSON.stringify(left));
    await c.end();
  }
})();
