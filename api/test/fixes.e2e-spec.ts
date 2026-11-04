import { bootApp, fixtures, TestApp } from './helpers';

describe('Manual enrollment, attendance and recommendations', () => {
  let t: TestApp;
  let f: ReturnType<typeof fixtures>;
  let tutor: any, ada: any, prog: any;

  beforeAll(async () => {
    t = await bootApp();
    f = fixtures(t);
    tutor = await f.staff('tutor', 'instructor');
    const cohort = await f.cohort('Fix Cohort');
    prog = await f.program(cohort.id, 'Cloud', { instructorId: tutor.id, maxLearners: 1 });
    ada = await f.learner('ada');
  });
  afterAll(() => t.close());

  it('enrolls a learner by email, once, within the seat limit', async () => {
    await f.sup.post('/enrollments', { learnerEmail: 'nobody@example.com', program: { id: prog.id } }).expect(400);
    await f.sup.post('/enrollments', { learnerEmail: 'tutor@example.com', program: { id: prog.id } }).expect(400);
    const e = (await f.sup.post('/enrollments', { learnerEmail: 'ADA@example.com', program: { id: prog.id }, notes: 'Paid by transfer' }).expect(201)).body;
    expect(e.status).toBe('approved');
    await f.sup.post('/enrollments', { learnerEmail: 'ada@example.com', program: { id: prog.id } }).expect(400);
    const bayo = await f.learner('bayo');
    const full = await f.sup.post('/enrollments', { learner: { id: bayo.id }, program: { id: prog.id } }).expect(400);
    expect(full.body.message).toMatch(/full/);
  });

  it('updates attendance instead of duplicating it', async () => {
    const s = (await f.as(tutor.token).post('/sessions', { title: 'Class 1', scheduledAt: new Date().toISOString(), durationMinutes: 60, program: { id: prog.id } }).expect(201)).body;
    await f.as(tutor.token).post(`/sessions/${s.id}/attendance`, { learner: { id: ada.id }, status: 'absent' }).expect(201);
    await f.as(tutor.token).post(`/sessions/${s.id}/attendance`, { learner: { id: ada.id }, status: 'present' }).expect(201);
    const rows = (await f.as(tutor.token).get(`/sessions/${s.id}/attendance`).expect(200)).body;
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('present');
  });

  it('requires a note for Conditional or Fail recommendations', async () => {
    const [e] = (await f.sup.get('/enrollments')).body;
    await f.as(tutor.token).post('/graduation/recommend', { enrollmentId: e.id, recommendation: 'fail' }).expect(400);
    await f.as(tutor.token).post('/graduation/recommend', { enrollmentId: e.id, recommendation: 'conditional', notes: 'Resubmit capstone' }).expect(201);
  });
});
