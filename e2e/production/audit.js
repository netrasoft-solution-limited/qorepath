// Real audit log: admin actions are recorded with actor, summary and changes.
const { SITE, record, api, login, browser, page, seedSession, sleep } = require('./lib');

(async () => {
  const run = `e2e${Date.now().toString(36)}`;
  const sup = await login(process.env.SUPER_EMAIL, process.env.SUPER_PW);
  const pw = 'E2eAudit!2026x';
  const mk = async (tag, role) => {
    const email = `delivered+${run}-${tag}@resend.dev`;
    const r = await api('POST', '/users', { token: sup, body: { firstName: tag, lastName: `E2E-${run}`, email, password: pw, role } });
    return { id: r.data.id, email };
  };
  const tutor = await mk('tutor', 'instructor');
  const staffAdmin = await mk('staffadmin', 'admin');

  // Actions to be audited
  await api('PATCH', `/users/${staffAdmin.id}`, { token: sup, body: { permissions: ['instructors', 'revenue'] } });
  await api('PATCH', `/users/${tutor.id}`, { token: sup, body: { isActive: false } });
  await api('PATCH', `/users/${tutor.id}`, { token: sup, body: { isActive: true } });
  await api('PATCH', `/users/${tutor.id}`, { token: sup, body: { firstName: 'tutor' } }); // no-op: must NOT be logged
  await api('POST', '/auth/login', { body: { email: tutor.email, password: 'wrong-password' } });
  await login(tutor.email, pw);
  const policy = (await api('GET', '/settings/refund-policy')).data;
  await api('PATCH', '/settings/refund-policy', { token: sup, body: { afterPercent: policy.afterPercent } });

  // Restricted admin: may not read the log, may not create an admin
  const st = await login(staffAdmin.email, pw);
  const denied = await api('GET', '/audit', { token: st });
  record('audit', 'admin without "audit_log" permission cannot read the log', denied.status === 403, `status ${denied.status}`);
  const mkAdmin = await api('POST', '/users', { token: st, body: { firstName: 'x', lastName: 'x', email: `delivered+${run}-sneaky@resend.dev`, password: pw, role: 'admin' } });
  record('audit', '"Teaching Staff"-only admin cannot create an admin account', mkAdmin.status === 403, `status ${mkAdmin.status} ${mkAdmin.data?.message ?? ''}`);

  await sleep(1500); // entries are written just after the response
  const log = (await api('GET', '/audit', { token: sup, query: undefined })).data;
  const mine = log.filter((e) => e.summary.includes(run) || [tutor.id, staffAdmin.id].includes(e.entityId));
  const find = (action) => mine.find((e) => e.action === action);
  const show = (e) => (e ? `${e.actorEmail ?? 'System'}: ${e.summary}` : 'missing');

  const created = mine.filter((e) => e.action === 'USER_CREATED');
  record('audit', 'account creation logged with actor', created.length === 2 && created.every((e) => e.actorEmail === process.env.SUPER_EMAIL), show(created[0]));
  const perm = find('PERMISSIONS_CHANGED');
  record('audit', 'permission change logged with before → after', !!perm?.changes?.permissions, show(perm) + ' ' + JSON.stringify(perm?.changes));
  record('audit', 'suspension logged', /Suspended/.test(find('USER_SUSPENDED')?.summary ?? ''), show(find('USER_SUSPENDED')));
  record('audit', 'reactivation logged', /Reactivated/.test(find('USER_REACTIVATED')?.summary ?? ''), show(find('USER_REACTIVATED')));
  record('audit', 'an edit that changed nothing is not logged', !find('USER_UPDATED'), show(find('USER_UPDATED')));
  record('audit', 'failed staff sign-in logged', /wrong password/.test(find('LOGIN_FAILED')?.summary ?? ''), show(find('LOGIN_FAILED')));
  const signin = mine.filter((e) => e.action === 'LOGIN');
  record('audit', 'staff sign-in logged with IP', signin.length >= 2 && signin.every((e) => e.ip), signin.map((e) => `${e.actorEmail} ${e.ip}`).join(' | '));
  const settings = log.find((e) => e.action === 'SETTINGS_CHANGED');
  record('audit', 'refund-policy change logged', !!settings && /afterPercent/.test(settings.summary), show(settings));
  record('audit', 'refused actions are not logged', !mine.some((e) => e.summary.includes('sneaky')), '');
  const leaked = log.filter((e) => /sk_(live|test)_|re_[A-Za-z0-9]{8,}|password"|\$2[aby]\$/.test(JSON.stringify(e)));
  record('audit', 'no keys or password hashes anywhere in the log', leaked.length === 0, leaked.map(show).join(' | '));

  const search = (await api('GET', `/audit?search=${run}-tutor`, { token: sup })).data;
  record('audit', 'server-side search works', search.length > 0 && search.every((e) => JSON.stringify(e).toLowerCase().includes(`${run}-tutor`)), `${search.length} results`);
  const byAction = (await api('GET', '/audit?action=LOGIN_FAILED', { token: sup })).data;
  record('audit', 'action filter works', byAction.length > 0 && byAction.every((e) => e.action === 'LOGIN_FAILED'), `${byAction.length} results`);

  // Page renders
  const b = await browser();
  try {
    const issues = [];
    const p = await page(b, issues);
    await seedSession(p, sup);
    await p.goto(`${SITE}/admin/audit`, { waitUntil: 'networkidle2', timeout: 90000 });
    await sleep(2000);
    const text = await p.evaluate(() => document.body.innerText);
    record('audit-page', 'page shows real entries', text.includes('PERMISSIONS CHANGED') && text.includes('Suspended'), text.slice(0, 200).replace(/\n/g, ' '));
    record('audit-page', 'no console/network errors', issues.length === 0, issues.join(' | '));
  } finally {
    await b.close();
  }

  // Cleanup (deletes are themselves logged)
  for (const u of [tutor, staffAdmin]) await api('DELETE', `/users/${u.id}`, { token: sup });
  await sleep(1500);
  const del = (await api('GET', '/audit?action=USER_DELETED', { token: sup })).data.filter((e) => e.summary.includes(run));
  record('audit', 'account deletion logged with the deleted name', del.length === 2, show(del[0]));
  console.log('RUN', run);
})();
