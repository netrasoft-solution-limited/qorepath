// Certificates from approved graduations + uploaded files, against production. Cleans up after itself.
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { SITE, API, record, api, login, browser, page, seedSession, sleep } = require('./lib');

const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
async function multipart(url, token, fields, file) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  if (file) form.append('file', new Blob([file.data], { type: file.type }), file.name);
  const res = await fetch(API + url, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
  return { status: res.status, data: await res.json().catch(() => null) };
}

(async () => {
  const run = `e2e${Date.now().toString(36)}`;
  const sup = await login(process.env.SUPER_EMAIL, process.env.SUPER_PW);
  const pw = 'E2eCert!2026x';
  const email = (tag) => `delivered+${run}-${tag}@resend.dev`;
  const pdfPath = path.join(__dirname, `cert-${run}.pdf`);
  fs.writeFileSync(pdfPath, PDF);

  try {
    const tutor = (await api('POST', '/users', { token: sup, body: { firstName: 'Tutor', lastName: `E2E-${run}`, email: email('tutor'), password: pw, role: 'instructor' } })).data;
    const start = new Date(Date.now() - 60 * 864e5).toISOString().slice(0, 10);
    const end = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    const cohort = (await api('POST', '/cohorts', { token: sup, body: { name: `E2E Cohort ${run}`, startDate: start, endDate: end, status: 'completed' } })).data;
    const prog = (await api('POST', '/programs', { token: sup, body: { track: 'Data Analytics', description: `E2E ${run}`, price: 1000, maxLearners: 5, cohortId: cohort.id, instructorId: tutor.id } })).data;
    const learners = [];
    for (const tag of ['ada', 'bayo']) {
      await api('POST', '/auth/register', { body: { firstName: tag === 'ada' ? 'Ada' : 'Bayo', lastName: `E2E-${run}`, email: email(tag), password: pw } });
      const u = (await api('GET', '/users', { token: sup })).data.find((x) => x.email === email(tag));
      const e = (await api('POST', '/enrollments', { token: sup, body: { learner: { id: u.id }, program: { id: prog.id }, status: 'approved' } })).data;
      learners.push({ ...u, enrollmentId: e.id });
    }
    const [ada, bayo] = learners;
    const tTutor = await login(tutor.email, pw);
    for (const l of learners) await api('POST', '/graduation/recommend', { token: tTutor, body: { enrollmentId: l.enrollmentId, recommendation: 'pass' } });
    const grads = (await api('GET', `/graduation/cohort/${cohort.id}`, { token: sup })).data;
    const gOf = (l) => grads.find((g) => g.enrollment.id === l.enrollmentId);

    // Rules
    const pending = await multipart('/certificates', sup, { graduationId: gOf(ada).id });
    record('cert', 'issuing for a pending graduation is refused', pending.status === 400, pending.data?.message);
    const oldStyle = await api('POST', '/certificates', { token: sup, body: { user: { id: ada.id }, cohort: { id: cohort.id } } });
    record('cert', 'the old "pick any learner + cohort" request is refused', oldStyle.status === 400, oldStyle.data?.message);
    for (const l of learners) await api('PATCH', `/graduation/${gOf(l).id}/status`, { token: sup, body: { status: 'approved' } });
    const bell = (await api('GET', '/notifications', { token: sup })).data.items;
    record('bell', 'admin is told certificates are waiting', bell.filter((i) => i.title === 'Certificate to issue' && i.detail.includes(run)).length === 2, '');
    const badType = await multipart('/certificates', sup, { graduationId: gOf(bayo).id }, { data: Buffer.from('hi'), type: 'text/plain', name: 'x.txt' });
    record('cert', 'a non-PDF/image file is refused', badType.status === 400, badType.data?.message);
    const big = await multipart('/certificates', sup, { graduationId: gOf(bayo).id }, { data: Buffer.alloc(5 * 1024 * 1024 + 10), type: 'application/pdf', name: 'big.pdf' });
    record('cert', 'a file over 5 MB is refused', big.status === 413, `${big.status}`);
    const bayoCert = await multipart('/certificates', sup, { graduationId: gOf(bayo).id });
    record('cert', 'issuing without a file works', bayoCert.status === 201 && !bayoCert.data.fileName && bayoCert.data.enrollment?.program?.track === 'Data Analytics', `${bayoCert.status}`);
    const twice = await multipart('/certificates', sup, { graduationId: gOf(bayo).id });
    record('cert', 'a second certificate for the same learner + track is refused', twice.status === 400, twice.data?.message);
    const unapprove = await api('PATCH', `/graduation/${gOf(bayo).id}/status`, { token: sup, body: { status: 'pending' } });
    record('cert', "graduation can't be un-approved while a certificate exists", unapprove.status === 400, unapprove.data?.message);

    // Admin page: issue Ada's with an uploaded PDF through the real form
    const b = await browser();
    let adaCert;
    try {
      const issues = [];
      const p = await page(b, issues);
      await seedSession(p, sup);
      await p.goto(`${SITE}/admin/certificates`, { waitUntil: 'networkidle2', timeout: 90000 });
      await sleep(1500);
      const rows = await p.$$('div.py-3');
      let row;
      for (const r of rows) if ((await r.evaluate((n) => n.innerText)).includes(`Ada E2E-${run}`)) row = r;
      record('pages', 'Ready to issue lists the approved learner', !!row, '');
      const input = await row.$('input[type=file]');
      await input.uploadFile(pdfPath);
      await (await row.$('button')).click();
      await p.waitForFunction((t) => document.body.innerText.includes('Issued NN-') && document.querySelector('table')?.innerText.includes(t), { timeout: 20000 }, path.basename(pdfPath));
      adaCert = (await api('GET', '/certificates', { token: sup })).data.find((c) => c.user?.id === ada.id);
      record('publitio', 'the uploaded PDF is stored on Publitio under a random name', /publit\.io\/file\/certificate-[0-9a-f]{16}\./.test(adaCert?.fileUrl ?? '') && !!adaCert?.fileStorageId, adaCert?.fileUrl);
      record('pages', 'issue with an uploaded PDF from the admin page', adaCert?.fileName === path.basename(pdfPath) && adaCert.fileSize === PDF.length, adaCert?.fileName);
      const text = await p.evaluate(() => document.body.innerText);
      record('pages', 'issued table shows track and the file', text.includes(adaCert.certificateNumber) && text.includes('Data Analytics') && text.includes(path.basename(pdfPath)), '');

      // Learner: sees and downloads the file
      const tAda = await login(ada.email, pw);
      const own = await fetch(`${API}/certificates/${adaCert.id}/file`, { headers: { Authorization: `Bearer ${tAda}` } });
      const bytes = Buffer.from(await own.arrayBuffer());
      record('cert', 'learner downloads their exact file', own.status === 200 && own.headers.get('content-type') === 'application/pdf' && bytes.equals(PDF), `${own.status}`);
      const tBayo = await login(bayo.email, pw);
      const other = await fetch(`${API}/certificates/${adaCert.id}/file`, { headers: { Authorization: `Bearer ${tBayo}` } });
      record('cert', "another learner can't download it", other.status === 403, `${other.status}`);
      const sneaky = await multipart(`/certificates/${adaCert.id}/file`, tAda, {}, { data: PDF, type: 'application/pdf', name: 'x.pdf' });
      record('cert', "learner can't upload or replace files", sneaky.status === 403, `${sneaky.status}`);
      await seedSession(p, tAda);
      await p.goto(`${SITE}/learner/certificate`, { waitUntil: 'networkidle2', timeout: 90000 });
      await sleep(1500);
      const ltext = await p.evaluate(() => document.body.innerText);
      record('pages', 'learner certificate page shows the track and a Download button', ltext.includes('Data Analytics') && ltext.includes('Download'), '');

      // Public verification
      const v = (await api('GET', `/certificates/verify/${adaCert.certificateNumber}`)).data;
      record('cert', 'public verify includes the track and the file', v.track === 'Data Analytics' && v.hasFile === true && !v.user.email, JSON.stringify(v));
      await p.goto(`${SITE}/public/verify/${adaCert.certificateNumber}`, { waitUntil: 'networkidle2', timeout: 90000 });
      await sleep(1500);
      const vtext = await p.evaluate(() => document.body.innerText);
      record('pages', 'verify page shows track and "View the certificate"', vtext.includes('Data Analytics') && vtext.includes('View the certificate'), '');
      const pub = await fetch(`${API}/certificates/verify/${adaCert.certificateNumber}/file`);
      record('cert', 'public file link serves the PDF', pub.status === 200 && pub.headers.get('content-type') === 'application/pdf', `${pub.status}`);
      record('pages', 'no console/network errors', issues.length === 0, issues.join(' | '));
    } finally {
      await b.close();
    }

    // Replace, remove, revoke
    const png = await multipart(`/certificates/${adaCert.id}/file`, sup, {}, { data: Buffer.from('\x89PNG\r\n'), type: 'image/png', name: 'ada.png' });
    record('cert', 'admin replaces the file with a PNG', png.data?.fileName === 'ada.png' && png.data?.fileType === 'image/png' && /publit\.io/.test(png.data?.fileUrl ?? '') && png.data.fileStorageId !== adaCert.fileStorageId, `${png.status}`);
    let oldGone;
    for (let i = 0; i < 12; i++) { oldGone = await fetch(`${adaCert.fileUrl}?t=${Date.now()}`); if (oldGone.status >= 400) break; await sleep(5000); }
    record('publitio', 'the replaced PDF is deleted from Publitio', oldGone.status >= 400, `${oldGone.status}`);

    // Profile photo
    const tAda2 = await login(ada.email, pw);
    const pngBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    const form = new FormData();
    form.append('file', new Blob([pngBytes], { type: 'image/png' }), 'me.png');
    const up = await fetch(`${API}/users/me/avatar`, { method: 'POST', headers: { Authorization: `Bearer ${tAda2}` }, body: form });
    const me = await up.json();
    const img = me.avatarUrl ? await fetch(me.avatarUrl) : null;
    record('publitio', 'learner uploads a profile photo; it loads from Publitio', up.status === 201 && /publit\.io/.test(me.avatarUrl ?? '') && img?.ok && /image/.test(img.headers.get('content-type') ?? ''), `${up.status} ${me.avatarUrl ?? me.message} ${img?.status} ${img?.headers.get('content-type')}`);
    const b2 = await browser();
    try {
      const issues2 = [];
      const p2 = await page(b2, issues2);
      await seedSession(p2, tAda2);
      await p2.goto(`${SITE}/learner/profile`, { waitUntil: 'networkidle2', timeout: 90000 });
      await sleep(1500);
      const shown = await p2.evaluate((u) => [...document.images].filter((i) => i.src.toLowerCase() === u.toLowerCase() && i.naturalWidth > 0).length, me.avatarUrl);
      record('pages', 'photo shows in the sidebar and on the profile page', shown >= 2, `${shown} image(s)`);
    } finally {
      await b2.close();
    }
    const del = await api('DELETE', '/users/me/avatar', { token: tAda2 });
    record('publitio', 'removing the photo clears it', del.status === 200 && !del.data.avatarUrl, `${del.status}`);
    await api('DELETE', `/certificates/${adaCert.id}`, { token: sup }); // also deletes Ada's file from Publitio
    const rm = await api('DELETE', `/certificates/${bayoCert.data.id}`, { token: sup });
    const gone = await api('GET', `/certificates/verify/${bayoCert.data.certificateNumber}`);
    const reset = await api('PATCH', `/graduation/${gOf(bayo).id}/status`, { token: sup, body: { status: 'pending' } });
    record('cert', 'revoking stops verification and frees the graduation', rm.status === 200 && gone.status === 404 && reset.status === 200, `${rm.status}/${gone.status}/${reset.status}`);
    const audit = (await api('GET', `/audit?search=${run}&limit=50`, { token: sup })).data;
    const actions = (audit.items ?? audit).map((a) => a.action);
    record('audit', 'issue, upload and revoke are in the audit log',
      ['CERTIFICATE_ISSUED', 'CERTIFICATE_FILE_UPLOADED', 'CERTIFICATE_REVOKED', 'GRADUATION_APPROVED'].every((a) => actions.includes(a)), [...new Set(actions)].join(', '));
  } finally {
    fs.rmSync(pdfPath, { force: true });
    // Remove everything tagged with this run
    const c = new Client({ connectionString: process.env.PROD_DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await c.connect();
    const like = `%${run}%`;
    await c.query('BEGIN');
    const users = `(SELECT id FROM users WHERE email LIKE $1)`;
    const cohorts = `(SELECT id FROM cohorts WHERE name LIKE $1)`;
    await c.query(`DELETE FROM certificates WHERE "userId" IN ${users}`, [like]);
    await c.query(`DELETE FROM graduation_recommendations WHERE "enrollmentId" IN (SELECT id FROM enrollments WHERE "learnerId" IN ${users})`, [like]);
    await c.query(`DELETE FROM enrollments WHERE "learnerId" IN ${users}`, [like]);
    await c.query(`DELETE FROM programs WHERE "cohortId" IN ${cohorts}`, [like]);
    await c.query(`DELETE FROM cohorts WHERE name LIKE $1`, [like]);
    await c.query(`DELETE FROM users WHERE email LIKE $1`, [like]);
    await c.query(`DELETE FROM audit_entries WHERE summary LIKE $1 OR "actorEmail" LIKE $1`, [like]);
    await c.query('COMMIT');
    const left = (await c.query(`SELECT (SELECT count(*) FROM users) u, (SELECT count(*) FROM cohorts) c, (SELECT count(*) FROM certificates) cert, (SELECT count(*) FROM audit_entries) audit`)).rows[0];
    console.log('cleanup done:', JSON.stringify(left));
    await c.end();
  }
})();
