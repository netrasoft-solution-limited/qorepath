// Contact page + Site & Contact settings, against production. Site details are restored afterwards.
// The contact email is set to a resend.dev test address for under a minute to exercise the form.
const { SITE, record, api, login, browser, page, sleep } = require('./lib');

(async () => {
  const run = `e2e${Date.now().toString(36)}`;
  const sup = await login(process.env.SUPER_EMAIL, process.env.SUPER_PW);
  const before = (await api('GET', '/settings/site')).data;
  const { acceptsMessages, ...original } = before;
  try {
    record('site', 'public site info endpoint', 'socials' in before && 'acceptsMessages' in before, JSON.stringify({ contact: before.contactEmail, socials: Object.keys(before.socials) }));
    const badEmail = await api('PATCH', '/settings/site', { token: sup, body: { contactEmail: 'not-an-email' } });
    const badLink = await api('PATCH', '/settings/site', { token: sup, body: { socials: { instagram: 'javascript:alert(1)' } } });
    record('site', 'invalid email and non-https links are refused', badEmail.status === 400 && badLink.status === 400, `${badEmail.data?.message} / ${badLink.data?.message}`);
    const anon = await api('PATCH', '/settings/site', { body: {} });
    record('site', "can't be changed without signing in", anon.status === 401, `${anon.status}`);

    const honeypot = await api('POST', '/settings/contact', { body: { name: 'Bot', email: 'bot@example.com', message: 'spam', website: 'http://spam' } });
    record('contact', 'bots filling the hidden field get a fake success', honeypot.status === 200, `${honeypot.status}`);
    const invalid = await api('POST', '/settings/contact', { body: { name: 'A', email: 'nope', message: 'hi' } });
    record('contact', 'invalid email is refused', invalid.status === 400, invalid.data?.message);

    // Temporarily turn the form on
    const testInbox = `delivered+${run}-contact@resend.dev`;
    const set = await api('PATCH', '/settings/site', {
      token: sup,
      body: { ...original, contactEmail: testInbox, phone: original.phone || '+234 800 000 0000', socials: { ...original.socials, instagram: original.socials.instagram || 'https://instagram.com/netranova' } },
    });
    record('site', 'admin saves contact details', set.status === 200 && set.data.contactEmail === testInbox, `${set.status}`);

    const b = await browser();
    try {
      const issues = [];
      const p = await page(b, issues);
      await p.goto(`${SITE}/public/contact`, { waitUntil: 'networkidle2', timeout: 90000 });
      await sleep(1500);
      const text = await p.evaluate(() => document.body.innerText);
      record('pages', 'contact page shows the details and the form', text.includes(testInbox) && text.includes('Send a message'), '');
      const footerIcons = await p.$$eval('footer a[aria-label="Instagram"]', (a) => a.length);
      record('pages', 'footer shows the social link', footerIcons === 1, `${footerIcons}`);
      await p.type('input[placeholder="Your name"]', `Visitor ${run}`);
      await p.type('input[placeholder="Email address"]', `delivered+${run}-visitor@resend.dev`);
      await p.type('textarea[placeholder="How can we help?"]', 'When does the next cohort start?');
      await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.innerText.includes('Send message'))?.click());
      await p.waitForFunction(() => document.body.innerText.includes('Message sent') || document.body.innerText.includes("couldn't"), { timeout: 20000 });
      record('pages', 'visitor sends a message from the page', (await p.evaluate(() => document.body.innerText)).includes('Message sent'), '');
      await p.goto(`${SITE}/register`, { waitUntil: 'networkidle2', timeout: 90000 });
      await sleep(1000);
      const reg = await p.evaluate(() => document.body.innerText);
      record('pages', 'sign-up hides the terms line until legal pages are published', original.termsText || original.privacyText ? reg.includes('Terms of Service') || reg.includes('Privacy Policy') : !reg.includes('Terms of Service'), '');
      await p.goto(`${SITE}/public/terms`, { waitUntil: 'networkidle2', timeout: 90000 });
      await sleep(1000);
      const terms = await p.evaluate(() => document.body.innerText);
      record('pages', 'terms page', original.termsText ? terms.includes(original.termsText.slice(0, 20)) : terms.includes("hasn't been published yet"), '');
      record('pages', 'no console/network errors', issues.length === 0, issues.join(' | '));
    } finally {
      await b.close();
    }
    // Rate limit: the page sent 1; two more allowed, the fourth refused
    const send = () => api('POST', '/settings/contact', { body: { name: `Visitor ${run}`, email: `delivered+${run}-visitor@resend.dev`, message: 'again' } });
    const s2 = await send(), s3 = await send(), s4 = await send();
    record('contact', 'more than 3 messages in 10 minutes from one visitor is refused', s2.status === 200 && s3.status === 200 && s4.status === 429, `${s2.status}/${s3.status}/${s4.status}`);
  } finally {
    const restore = await api('PATCH', '/settings/site', { token: sup, body: { ...original, socials: Object.fromEntries(['instagram', 'x', 'linkedin', 'facebook', 'youtube', 'tiktok'].map((k) => [k, original.socials[k] ?? ''])) } });
    const after = (await api('GET', '/settings/site')).data;
    console.log('site details restored:', restore.status, JSON.stringify(after) === JSON.stringify(before));
  }
})();
