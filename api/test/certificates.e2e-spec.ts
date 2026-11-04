import { bootApp, fixtures, TestApp, bearer } from './helpers';

const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');

describe('Certificates from approved graduations', () => {
  let t: TestApp;
  let f: ReturnType<typeof fixtures>;
  let ada: any, bayo: any, gradAda: any;

  beforeAll(async () => {
    t = await bootApp();
    f = fixtures(t);
    const tutor = await f.staff('tutor', 'instructor');
    const cohort = await f.cohort('Cohort G', { startDaysFromNow: -60, endDaysFromNow: -1, status: 'completed' });
    const prog = await f.program(cohort.id, 'Data Analytics', { instructorId: tutor.id });
    ada = await f.learner('ada');
    bayo = await f.learner('bayo');
    const e = await f.enroll(ada.id, prog.id);
    await f.as(tutor.token).post('/graduation/recommend', { enrollmentId: e.id, recommendation: 'pass' }).expect(201);
    gradAda = (await f.sup.get(`/graduation/cohort/${cohort.id}`)).body[0];
  });
  afterAll(() => t.close());

  const issue = (graduationId: string, file?: { data: Buffer; type: string; name: string }) => {
    const req = t.http().post('/api/certificates').set(bearer(t.superToken)).field('graduationId', graduationId);
    return file ? req.attach('file', file.data, { filename: file.name, contentType: file.type }) : req;
  };

  it('refuses a certificate until the graduation is approved', async () => {
    await issue(gradAda.id).expect(400);
    await f.sup.patch(`/graduation/${gradAda.id}/status`, { status: 'approved' }).expect(200);
  });

  it('rejects files of the wrong type', async () => {
    await issue(gradAda.id, { data: Buffer.from('hi'), type: 'text/plain', name: 'x.txt' }).expect(400);
  });

  it('issues once, with the file kept in the database when Publitio is not set up', async () => {
    const cert = (await issue(gradAda.id, { data: PDF, type: 'application/pdf', name: 'ada.pdf' }).expect(201)).body;
    expect(cert.fileName).toBe('ada.pdf');
    expect(cert.fileUrl).toBeNull();
    expect(cert.fileData).toBeUndefined();
    await issue(gradAda.id).expect(400); // one per learner + track

    const own = await t.http().get(`/api/certificates/${cert.id}/file`).set(bearer(ada.token)).buffer(true).expect(200);
    expect(Buffer.compare(own.body, PDF)).toBe(0);
    await t.http().get(`/api/certificates/${cert.id}/file`).set(bearer(bayo.token)).expect(403);

    const v = (await t.http().get(`/api/certificates/verify/${cert.certificateNumber}`).expect(200)).body;
    expect(v).toMatchObject({ track: 'Data Analytics', hasFile: true });
    expect(v.user.email).toBeUndefined();
  });

  it("won't un-approve a graduation until its certificate is revoked", async () => {
    await f.sup.patch(`/graduation/${gradAda.id}/status`, { status: 'pending' }).expect(400);
    const [cert] = (await f.sup.get('/certificates')).body;
    await f.sup.delete(`/certificates/${cert.id}`).expect(200);
    await t.http().get(`/api/certificates/verify/${cert.certificateNumber}`).expect(404);
    await f.sup.patch(`/graduation/${gradAda.id}/status`, { status: 'pending' }).expect(200);
  });
});
