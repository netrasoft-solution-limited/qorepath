// Assignments per track + capstone flag, against production. Cleans up after itself.
const fs = require('fs');
const { Client } = require('pg');
const { SITE, record, api, login, browser, page, seedSession, sleep } = require('./lib');

(async () => {
  const run = `e2e${Date.now().toString(36)}`;
  const sup = await login(process.env.SUPER_EMAIL, process.env.SUPER_PW);
  const pw = 'E2eTrack!2026x';
  const email = (tag) => `delivered+${run}-${tag}@resend.dev`;
  const staff = async (tag, role) =>
    (await api('POST', '/users', { token: sup, body: { firstName: tag, lastName: `E2E-${run}`, email: email(tag), password: pw, role } })).data;
  const learner = async (tag) => {
    await api('POST', '/auth/register', { body: { firstName: tag, lastName: `E2E-${run}`, email: email(tag), password: pw } });
    return (await api('GET', '/users', { token: sup })).data.find((u) => u.email === email(tag));
  };

  try {
    const fe = await staff('fetutor', 'instructor');
    const be = await staff('betutor', 'instructor');
    const start = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
    const end = new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);
    const cohort = (await api('POST', '/cohorts', { token: sup, body: { name: `E2E Cohort ${run}`, startDate: start, endDate: end, status: 'active' } })).data;
    const prog = async (track, instructorId) =>
      (await api('POST', '/programs', { token: sup, body: { track, description: `E2E ${run}`, price: 1000, maxLearners: 5, cohortId: cohort.id, instructorId } })).data;
    const pFE = await prog('Frontend Engineering', fe.id);
    const pBE = await prog('Backend Engineering', be.id);
    const lFE = await learner('felearner');
    const lBE = await learner('belearner');
    for (const [l, p] of [[lFE, pFE], [lBE, pBE]]) {
      await api('POST', '/enrollments', { token: sup, body: { learner: { id: l.id }, program: { id: p.id }, status: 'approved' } });
    }
    const tFE = await login(fe.email, pw), tBE = await login(be.email, pw);
    const tlFE = await login(lFE.email, pw), tlBE = await login(lBE.email, pw);
    const due = new Date(Date.now() + 864e5).toISOString(); // tomorrow → also a "due soon" bell item

    // Creating
    const noTrack = await api('POST', '/assignments', { token: tFE, body: { title: 'x', description: 'x', dueDate: due } });
    record('assign', 'creating without a track is refused', noTrack.status === 400, `${noTrack.status} ${noTrack.data?.message}`);
    const wrongTrack = await api('POST', '/assignments', { token: tFE, body: { title: 'x', description: 'x', dueDate: due, program: { id: pBE.id } } });
    record('assign', "instructor can't create for another track in the same cohort", wrongTrack.status === 403, `${wrongTrack.status}`);
    const a1 = (await api('POST', '/assignments', { token: tFE, body: { title: `FE Week 1 ${run}`, description: 'Build a page', dueDate: due, maxScore: 50, program: { id: pFE.id } } })).data;
    const cap = await api('POST', '/assignments', { token: tFE, body: { title: `FE Final ${run}`, description: 'Ship it', dueDate: due, maxScore: 100, isCapstone: true, program: { id: pFE.id } } });
    record('assign', 'instructor creates a capstone for their track', cap.status === 201 && cap.data.isCapstone === true, `${cap.status}`);
    const cap2 = await api('POST', '/assignments', { token: tFE, body: { title: 'second', description: 'x', dueDate: due, isCapstone: true, program: { id: pFE.id } } });
    record('assign', 'a second capstone in the same track is refused', cap2.status === 400, cap2.data?.message);
    const b1 = (await api('POST', '/assignments', { token: tBE, body: { title: `BE Week 1 ${run}`, description: 'Build an API', dueDate: due, program: { id: pBE.id } } })).data;

    // Seeing
    const seenFE = (await api('GET', `/assignments/program/${pFE.id}`, { token: tlFE })).data.map((a) => a.id);
    record('assign', 'frontend learner sees only frontend assignments', seenFE.includes(a1.id) && seenFE.includes(cap.data.id) && !seenFE.includes(b1.id), `${seenFE.length} items`);
    const peek = await api('GET', `/assignments/program/${pBE.id}`, { token: tlFE });
    record('assign', "frontend learner can't list backend's assignments", peek.status === 403, `${peek.status}`);
    const cohortList = await api('GET', `/assignments/cohort/${cohort.id}`, { token: tlFE });
    record('assign', 'learners can no longer list the whole cohort', cohortList.status === 403, `${cohortList.status}`);

    // Submitting
    const crossSubmit = await api('POST', `/assignments/${b1.id}/submit`, { token: tlFE, body: { submissionUrl: 'https://example.com/x' } });
    record('assign', "learner can't submit to another track's assignment", crossSubmit.status === 403, `${crossSubmit.status}`);
    const s1 = (await api('POST', `/assignments/${a1.id}/submit`, { token: tlFE, body: { submissionUrl: 'https://example.com/v1' } })).data;
    const s2 = (await api('POST', `/assignments/${a1.id}/submit`, { token: tlFE, body: { submissionUrl: 'https://example.com/v2' } })).data;
    const subs = (await api('GET', `/assignments/${a1.id}/submissions`, { token: tFE })).data;
    record('assign', 'resubmitting replaces the submission (no duplicates)', s1.id === s2.id && subs.length === 1 && subs[0].submissionUrl.endsWith('/v2'), `${subs.length} submission(s)`);

    // Grading
    const otherGrades = await api('PATCH', `/assignments/submissions/${s1.id}/grade`, { token: tBE, body: { score: 10, feedback: 'x' } });
    record('assign', "backend instructor can't grade frontend work", otherGrades.status === 403, `${otherGrades.status}`);
    const tooHigh = await api('PATCH', `/assignments/submissions/${s1.id}/grade`, { token: tFE, body: { score: 80, feedback: 'x' } });
    record('assign', 'score above the max is refused', tooHigh.status === 400, tooHigh.data?.message);
    // Bell before grading: the frontend instructor has something to grade, the backend one doesn't
    const bellFE = (await api('GET', '/notifications', { token: tFE })).data.items;
    const bellBE = (await api('GET', '/notifications', { token: tBE })).data.items;
    record('bell', 'frontend instructor is told about the submission', bellFE.some((i) => i.title === 'Submission to grade'), `${bellFE.length} items`);
    record('bell', "backend instructor isn't told about another track's submission", !bellBE.some((i) => i.title === 'Submission to grade'), bellBE.map((i) => i.title).join(', '));
    const graded = await api('PATCH', `/assignments/submissions/${s1.id}/grade`, { token: tFE, body: { score: 45, feedback: 'Nice work' } });
    record('assign', 'instructor grades their own track', graded.status === 200 && Number(graded.data.score) === 45, `${graded.status}`);
    const afterGrade = await api('POST', `/assignments/${a1.id}/submit`, { token: tlFE, body: { submissionUrl: 'https://example.com/v3' } });
    record('assign', 'a graded submission can no longer be changed', afterGrade.status === 400, afterGrade.data?.message);

    // Capstone toggles
    const unmark = await api('PATCH', `/assignments/${cap.data.id}`, { token: tFE, body: { isCapstone: false } });
    const mark = await api('PATCH', `/assignments/${a1.id}`, { token: tFE, body: { isCapstone: true } });
    record('assign', 'capstone can be moved to another assignment', unmark.data?.isCapstone === false && mark.data?.isCapstone === true, `${unmark.status}/${mark.status}`);
    await api('PATCH', `/assignments/${a1.id}`, { token: tFE, body: { isCapstone: false } });
    await api('PATCH', `/assignments/${cap.data.id}`, { token: tFE, body: { isCapstone: true } });
    const delWithWork = await api('DELETE', `/assignments/${a1.id}`, { token: tFE });
    record('assign', "an assignment with submissions can't be deleted", delWithWork.status === 400, delWithWork.data?.message);

    // Learner bell
    const bellL = (await api('GET', '/notifications', { token: tlBE })).data.items;
    record('bell', 'backend learner sees "new assignment" + "due soon" for their track only',
      bellL.some((i) => i.title === 'New assignment' && i.detail.includes('BE Week 1')) &&
      bellL.some((i) => i.title === 'Assignment due soon') &&
      !bellL.some((i) => i.detail.includes('FE ')), bellL.map((i) => `${i.title}: ${i.detail}`).join(' | '));

    // Pages
    const b = await browser();
    try {
      const issues = [];
      const p = await page(b, issues);
      await seedSession(p, tlFE);
      await p.goto(`${SITE}/learner/assignments`, { waitUntil: 'networkidle2', timeout: 90000 });
      await sleep(1500);
      let text = await p.evaluate(() => document.body.innerText);
      record('pages', 'learner assignments page: own track + capstone badge, not the other track',
        text.includes(`FE Week 1 ${run}`) && text.includes('CAPSTONE') && !text.includes(`BE Week 1 ${run}`), '');
      await p.goto(`${SITE}/learner/capstone`, { waitUntil: 'networkidle2', timeout: 90000 });
      await sleep(1500);
      text = await p.evaluate(() => document.body.innerText);
      record('pages', 'capstone page shows the flagged assignment', text.includes(`FE Final ${run}`), '');
      await p.goto(`${SITE}/learner/progress`, { waitUntil: 'networkidle2', timeout: 90000 });
      await sleep(1500);
      text = await p.evaluate(() => document.body.innerText);
      record('pages', 'progress: 1/1 submitted, average 90% (45 of 50)', /1\/1 submitted/.test(text) && /Avg 90%/.test(text), (text.match(/\d+\/\d+ submitted[^\n]*/) || [''])[0]);
      await seedSession(p, tFE);
      await p.goto(`${SITE}/instructor/assignments`, { waitUntil: 'networkidle2', timeout: 90000 });
      await sleep(1500);
      text = await p.evaluate(() => document.body.innerText);
      record('pages', 'instructor page lists their track with the capstone marked', text.includes(`FE Final ${run}`) && text.includes('Capstone') && !text.includes(`BE Week 1 ${run}`), '');
      record('pages', 'no console/network errors', issues.length === 0, issues.join(' | '));
    } finally {
      await b.close();
    }
  } finally {
    // Remove everything tagged with this run
    const c = new Client({ connectionString: process.env.PROD_DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await c.connect();
    const like = `%${run}%`;
    await c.query('BEGIN');
    const users = `(SELECT id FROM users WHERE email LIKE $1)`;
    const cohorts = `(SELECT id FROM cohorts WHERE name LIKE $1)`;
    await c.query(`DELETE FROM submissions WHERE "learnerId" IN ${users}`, [like]);
    await c.query(`DELETE FROM assignments WHERE "cohortId" IN ${cohorts}`, [like]);
    await c.query(`DELETE FROM enrollments WHERE "learnerId" IN ${users}`, [like]);
    await c.query(`DELETE FROM programs WHERE "cohortId" IN ${cohorts}`, [like]);
    await c.query(`DELETE FROM cohorts WHERE name LIKE $1`, [like]);
    await c.query(`DELETE FROM users WHERE email LIKE $1`, [like]);
    await c.query(`DELETE FROM audit_entries WHERE summary LIKE $1 OR "actorEmail" LIKE $1`, [like]);
    await c.query('COMMIT');
    const left = (await c.query(`SELECT (SELECT count(*) FROM users) u, (SELECT count(*) FROM cohorts) c, (SELECT count(*) FROM assignments) a`)).rows[0];
    console.log('cleanup done:', JSON.stringify(left));
    await c.end();
  }
})();
