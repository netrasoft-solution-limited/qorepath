import { bootApp, fixtures, TestApp, login } from './helpers';

describe('Access control and audit log', () => {
  let t: TestApp;
  let f: ReturnType<typeof fixtures>;
  beforeAll(async () => { t = await bootApp(); f = fixtures(t); });
  afterAll(() => t.close());

  it('signs up a learner and keeps them out of admin areas', async () => {
    const ada = await f.learner('ada');
    expect(ada.role).toBe('learner');
    await f.as(ada.token).get('/users').expect(403);
    await f.as(ada.token).get('/audit').expect(403);
    await f.as(ada.token).get('/integrations').expect(403);
  });

  it('rejects a wrong password and unauthenticated requests', async () => {
    await t.http().post('/api/auth/login').send({ email: 'super@example.com', password: 'wrong-password' }).expect(401);
    await t.http().get('/api/users').expect(401);
  });

  it('enforces per-admin permissions on the server', async () => {
    const limited = await f.staff('limited', 'admin', ['enrollments']);
    await f.as(limited.token).get('/payments').expect(403);
    await f.as(limited.token).get('/certificates').expect(403);
    await f.as(limited.token).get('/integrations').expect(403); // super admins only
    await f.as(limited.token).get('/enrollments').expect(200);
  });

  it("doesn't let an admin without the users permission create other admins", async () => {
    const instructorsOnly = await f.staff('hr', 'admin', ['instructors']);
    await f.as(instructorsOnly.token)
      .post('/users', { firstName: 'X', lastName: 'Y', email: 'x@example.com', password: 'Test-Password-2026!', role: 'admin' })
      .expect(403);
    await f.as(instructorsOnly.token)
      .post('/users', { firstName: 'Tutor', lastName: 'Y', email: 'tutor@example.com', password: 'Test-Password-2026!', role: 'instructor' })
      .expect(201);
  });

  it('records admin actions and staff sign-ins in the audit log', async () => {
    const cohort = await f.cohort('Audit Cohort');
    await f.sup.patch(`/cohorts/${cohort.id}`, { name: 'Audit Cohort Renamed' }).expect(200);
    await login(t.http, 'tutor@example.com');
    const entries = (await f.sup.get('/audit?limit=50').expect(200)).body as any[];
    const actions = entries.map((e) => e.action);
    expect(actions).toEqual(expect.arrayContaining(['COHORT_CREATED', 'USER_CREATED', 'LOGIN']));
    const failed = await t.http().post('/api/auth/login').send({ email: 'tutor@example.com', password: 'nope-nope-1' });
    expect(failed.status).toBe(401);
    const again = (await f.sup.get('/audit?action=LOGIN_FAILED').expect(200)).body as any[];
    expect(again.length).toBeGreaterThan(0);
  });
});
