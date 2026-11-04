import { bootApp, fixtures, TestApp } from './helpers';

describe('Mark paid, cohort edits and learner materials', () => {
  let t: TestApp;
  let f: ReturnType<typeof fixtures>;
  let tutor: any, ada: any, cohort: any, prog: any;

  beforeAll(async () => {
    t = await bootApp();
    f = fixtures(t);
    tutor = await f.staff('tutor', 'instructor');
    cohort = await f.cohort('Gap Cohort');
    prog = await f.program(cohort.id, 'Cloud', { instructorId: tutor.id });
    ada = await f.learner('ada');
  });
  afterAll(() => t.close());

  it('enrolls the learner when an admin marks a payment paid', async () => {
    const pay = (await f.sup.post('/payments', {
      user: { id: ada.id }, program: { id: prog.id }, cohort: { id: cohort.id }, amount: 1000, status: 'pending',
    }).expect(201)).body;
    await f.sup.patch(`/payments/${pay.id}/status`, { status: 'nonsense' }).expect(400);

    const paid = (await f.sup.patch(`/payments/${pay.id}/status`, { status: 'paid' }).expect(200)).body;
    expect(paid.status).toBe('paid');
    expect(paid.method).toBe('bank_transfer');
    await f.sup.patch(`/payments/${pay.id}/status`, { status: 'paid' }).expect(200);

    const mine = (await f.as(ada.token).get('/enrollments/my').expect(200)).body;
    expect(mine).toHaveLength(1);
    expect(mine[0].status).toBe('approved');
    expect(mine[0].program.id).toBe(prog.id);
  });

  it('edits only the cohort fields, with valid dates', async () => {
    const edited = (await f.sup.patch(`/cohorts/${cohort.id}`, {
      name: 'Gap Cohort (Jan)', startDate: '2027-01-10', endDate: '2027-04-10', programs: [],
    }).expect(200)).body;
    expect(edited.name).toBe('Gap Cohort (Jan)');
    expect(String(edited.startDate).slice(0, 10)).toBe('2027-01-10');
    expect(edited.programs).toHaveLength(1);

    await f.sup.patch(`/cohorts/${cohort.id}`, { endDate: '2027-01-01' }).expect(400);
    await f.sup.patch(`/cohorts/${cohort.id}`, { startDate: 'soon' }).expect(400);
    await f.sup.patch(`/cohorts/${cohort.id}`, { status: 'paused' }).expect(400);
    await f.sup.patch(`/cohorts/${cohort.id}`, { name: '  ' }).expect(400);
  });

  it('shows materials to enrolled learners only, and accepts only web links', async () => {
    await f.as(tutor.token).post('/materials', { title: 'Bad', url: 'javascript:alert(1)', programId: prog.id }).expect(400);
    await f.as(tutor.token).post('/materials', { title: 'Slides', url: 'https://example.com/slides', type: 'pdf', week: 2, programId: prog.id }).expect(201);

    const list = (await f.as(ada.token).get(`/materials/program/${prog.id}`).expect(200)).body;
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ title: 'Slides', week: 2, uploadedBy: { firstName: 'tutor' } });
    expect(list[0].uploadedBy.email).toBeUndefined();

    const bayo = await f.learner('bayo');
    await f.as(bayo.token).get(`/materials/program/${prog.id}`).expect(403);
  });
});
