import { bootApp, fixtures, TestApp } from './helpers';

describe('Assignments per track and capstone', () => {
  let t: TestApp;
  let f: ReturnType<typeof fixtures>;
  let fe: any, be: any, feLearner: any, beLearner: any, pFE: any, pBE: any;
  const due = () => new Date(Date.now() + 864e5).toISOString();

  beforeAll(async () => {
    t = await bootApp();
    f = fixtures(t);
    fe = await f.staff('fetutor', 'instructor');
    be = await f.staff('betutor', 'instructor');
    const cohort = await f.cohort('Cohort A');
    pFE = await f.program(cohort.id, 'Frontend', { instructorId: fe.id });
    pBE = await f.program(cohort.id, 'Backend', { instructorId: be.id });
    feLearner = await f.learner('felearner');
    beLearner = await f.learner('belearner');
    await f.enroll(feLearner.id, pFE.id);
    await f.enroll(beLearner.id, pBE.id);
  });
  afterAll(() => t.close());

  it('only lets instructors post to their own track', async () => {
    await f.as(fe.token).post('/assignments', { title: 'x', description: 'x', dueDate: due() }).expect(400);
    await f.as(fe.token).post('/assignments', { title: 'x', description: 'x', dueDate: due(), program: { id: pBE.id } }).expect(403);
  });

  it('keeps one capstone per track and scopes what learners see', async () => {
    const a1 = (await f.as(fe.token).post('/assignments', { title: 'Week 1', description: 'x', dueDate: due(), maxScore: 50, program: { id: pFE.id } }).expect(201)).body;
    const cap = (await f.as(fe.token).post('/assignments', { title: 'Final', description: 'x', dueDate: due(), isCapstone: true, program: { id: pFE.id } }).expect(201)).body;
    expect(cap.isCapstone).toBe(true);
    await f.as(fe.token).post('/assignments', { title: 'Another', description: 'x', dueDate: due(), isCapstone: true, program: { id: pFE.id } }).expect(400);
    const seen = (await f.as(feLearner.token).get(`/assignments/program/${pFE.id}`).expect(200)).body.map((a: any) => a.id);
    expect(seen).toEqual(expect.arrayContaining([a1.id, cap.id]));
    await f.as(feLearner.token).get(`/assignments/program/${pBE.id}`).expect(403);
  });

  it('replaces a resubmission until graded and validates the score', async () => {
    const a = (await f.as(fe.token).post('/assignments', { title: 'Week 2', description: 'x', dueDate: due(), maxScore: 50, program: { id: pFE.id } })).body;
    await f.as(beLearner.token).post(`/assignments/${a.id}/submit`, { submissionUrl: 'https://example.com/x' }).expect(403);
    const s1 = (await f.as(feLearner.token).post(`/assignments/${a.id}/submit`, { submissionUrl: 'https://example.com/v1' })).body;
    const s2 = (await f.as(feLearner.token).post(`/assignments/${a.id}/submit`, { submissionUrl: 'https://example.com/v2' })).body;
    expect(s2.id).toBe(s1.id);
    await f.as(be.token).patch(`/assignments/submissions/${s1.id}/grade`, { score: 10 }).expect(403);
    await f.as(fe.token).patch(`/assignments/submissions/${s1.id}/grade`, { score: 80 }).expect(400);
    await f.as(fe.token).patch(`/assignments/submissions/${s1.id}/grade`, { score: 45, feedback: 'Good' }).expect(200);
    await f.as(feLearner.token).post(`/assignments/${a.id}/submit`, { submissionUrl: 'https://example.com/v3' }).expect(400);
    await f.as(fe.token).delete(`/assignments/${a.id}`).expect(400);
  });
});
