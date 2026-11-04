// Shared helpers for the NetraNova production E2E run.
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

// Required: SUPER_EMAIL, SUPER_PW (a super admin) and PROD_DATABASE_URL (for removing what a run created).
for (const k of ['SUPER_EMAIL', 'SUPER_PW', 'PROD_DATABASE_URL']) {
  if (!process.env[k]) { console.error(`Set ${k} first (see README.md)`); process.exit(1); }
}

const DIR = __dirname;
const STATE = path.join(DIR, 'state.json');
const RESULTS = path.join(DIR, 'results.jsonl');
const SHOTS = path.join(DIR, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const SITE = 'https://netranova.netrasoft.co';
const API = 'https://api.netranova.netrasoft.co/api';
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function load() {
  return fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : {};
}
function save(s) {
  fs.writeFileSync(STATE, JSON.stringify(s, null, 2));
}

function record(area, name, ok, detail = '') {
  const line = { at: new Date().toISOString(), area, name, ok: !!ok, detail: String(detail).slice(0, 400) };
  fs.appendFileSync(RESULTS, JSON.stringify(line) + '\n');
  console.log(`${ok ? '✅' : '❌'} [${area}] ${name}${detail ? ' — ' + String(detail).slice(0, 200) : ''}`);
  return ok;
}

async function api(method, url, { token, body, expect } = {}) {
  const res = await fetch(API + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (expect && !expect.includes(res.status)) {
    throw new Error(`${method} ${url} -> ${res.status} ${text.slice(0, 200)}`);
  }
  return { status: res.status, data };
}

async function login(email, password) {
  const { data } = await api('POST', '/auth/login', { body: { email, password }, expect: [200, 201] });
  return data.accessToken;
}

async function browser() {
  return puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-first-run', '--no-default-browser-check'],
    defaultViewport: { width: 1440, height: 900 },
  });
}

/** New page that collects console errors and failed/5xx network responses. */
async function page(b, issues) {
  const p = await b.newPage();
  p.on('console', (m) => { if (m.type() === 'error') issues.push(`console: ${m.text()}`); });
  p.on('pageerror', (e) => issues.push(`pageerror: ${e.message}`));
  p.on('response', (r) => {
    const u = r.url();
    if ((u.startsWith(API) || u.startsWith(SITE)) && r.status() >= 400) issues.push(`${r.status()} ${r.request().method()} ${u.replace(API, '/api').replace(SITE, '')}`);
  });
  p.on('requestfailed', (r) => {
    const u = r.url();
    if (u.startsWith(API) || u.startsWith(SITE)) issues.push(`failed ${u}: ${r.failure()?.errorText}`);
  });
  return p;
}

async function shot(p, name) {
  const file = path.join(SHOTS, `${name}.png`);
  await p.screenshot({ path: file, fullPage: false });
  return file;
}

/** Log the browser in by seeding the same localStorage the app's AuthContext uses. */
async function seedSession(p, token) {
  const { data: me } = await api('GET', '/auth/me', { token, expect: [200] });
  await p.goto(SITE + '/public/about', { waitUntil: 'domcontentloaded' });
  await p.evaluate((t, u) => { localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); }, token, me);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickText(p, selector, text) {
  const handles = await p.$$(selector);
  for (const h of handles) {
    const t = await h.evaluate((el) => el.textContent?.trim() ?? '');
    if (t.includes(text)) { await h.click(); return true; }
  }
  return false;
}

module.exports = { SITE, API, load, save, record, api, login, browser, page, shot, seedSession, sleep, clickText, SHOTS };
