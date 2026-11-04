// Runs every check in sequence and prints a pass/fail total.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const checks = ['audit', 'assignments', 'certificates', 'settings', 'contact', 'reminders'];
const only = process.argv.slice(2);
const results = path.join(__dirname, 'results.jsonl');
fs.rmSync(results, { force: true });
for (const c of only.length ? only : checks) {
  console.log(`\n── ${c} ──`);
  try {
    execFileSync(process.execPath, [path.join(__dirname, `${c}.js`)], { stdio: 'inherit', env: process.env });
  } catch {
    console.log(`(${c} exited with an error)`);
  }
}
const lines = fs.existsSync(results) ? fs.readFileSync(results, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
const failed = lines.filter((l) => !l.ok);
console.log(`\n${lines.length - failed.length}/${lines.length} checks passed`);
failed.forEach((f) => console.log(`  ❌ [${f.area}] ${f.name} — ${f.detail}`));
process.exit(failed.length ? 1 : 0);
