import { bootApp, fixtures, TestApp } from './helpers';

describe('Settings: cohort rules, instalments, emails, contact', () => {
  let t: TestApp;
  let f: ReturnType<typeof fixtures>;
  let ada: any;

  beforeAll(async () => { t = await bootApp(); f = fixtures(t); ada = await f.learner('ada'); });
  afterAll(() => t.close());

  it('uses the default seat count for new tracks', async () => {
    await f.sup.patch('/settings/cohort-rules', { defaultMaxLearners: 12 }).expect(200);
    const cohort = await f.cohort('Seats');
    expect((await f.program(cohort.id, 'Seats Track')).maxLearners).toBe(12);
  });

  it('closes checkout for finished cohorts and after the late-enrollment window', async () => {
    const done = await f.cohort('Done', { startDaysFromNow: -90, endDaysFromNow: -1, status: 'completed' });
    const p1 = await f.program(done.id, 'Old Track');
    const r1 = await f.as(ada.token).post('/payments/initialize', { programId: p1.id }).expect(400);
    expect(r1.body.message).toMatch(/closed/);

    await f.sup.patch('/settings/cohort-rules', { lateEnrollmentDays: 5 }).expect(200);
    const running = await f.cohort('Running', { startDaysFromNow: -30, endDaysFromNow: 60, status: 'active' });
    const p2 = await f.program(running.id, 'Running Track');
    const r2 = await f.as(ada.token).post('/payments/initialize', { programId: p2.id }).expect(400);
    expect(r2.body.message).toMatch(/started too long ago/);
    await f.sup.patch('/settings/cohort-rules', { lateEnrollmentDays: null }).expect(200);
  });

  it('can switch instalments off and clamps the first-payment share', async () => {
    const saved = (await f.sup.patch('/settings/payment-plan', { allowInstallments: false, firstInstallmentPercent: 99 }).expect(200)).body;
    expect(saved).toMatchObject({ allowInstallments: false, firstInstallmentPercent: 90 });
    const cohort = await f.cohort('Inst');
    const p = await f.program(cohort.id, 'Inst Track');
    const r = await f.as(ada.token).post('/payments/initialize', { programId: p.id, plan: 'installments' }).expect(400);
    expect(r.body.message).toMatch(/instalments/);
    await f.as(ada.token).patch('/settings/payment-plan', {}).expect(403);
  });

  it('lists every email and keeps security/payment emails on', async () => {
    const list = (await f.sup.get('/settings/email-templates').expect(200)).body;
    expect(list.length).toBe(14);
    await f.sup.patch(`/settings/email-templates/${encodeURIComponent('payment receipt')}`, { enabled: false }).expect(400);
    const after = (await f.sup.patch('/settings/email-templates/welcome', { enabled: false, note: 'Join our group' }).expect(200)).body;
    expect(after.find((x: any) => x.key === 'welcome')).toMatchObject({ enabled: false, note: 'Join our group' });
  });

  it('validates site details and protects the contact form', async () => {
    await f.sup.patch('/settings/site', { contactEmail: 'nope' }).expect(400);
    await f.sup.patch('/settings/site', { socials: { instagram: 'http://insecure.example' } }).expect(400);
    // No contact email yet → the form is off; bots filling the honeypot get a fake success
    await t.http().post('/api/settings/contact').send({ name: 'A', email: 'a@example.com', message: 'hi' }).expect(400);
    await t.http().post('/api/settings/contact').send({ name: 'Bot', email: 'b@example.com', message: 'x', website: 'spam' }).expect(200);
    const site = (await f.sup.patch('/settings/site', { contactEmail: 'hello@example.com', socials: { instagram: 'https://instagram.com/x' } }).expect(200)).body;
    expect(site.socials.instagram).toBe('https://instagram.com/x');
    expect((await t.http().get('/api/settings/site').expect(200)).body.acceptsMessages).toBe(true);
  });
});
