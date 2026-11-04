# Production checks

End-to-end checks that run against the **live** site (https://netranova.netrasoft.co) in a real
browser. Run them by hand after a deploy. They are not part of CI.

Each run tags everything it creates (`e2e<id>` in names and `delivered+e2e<id>-…@resend.dev`
emails, which Resend accepts without delivering) and deletes only those tagged rows at the end.
Never change a cleanup to delete by time: production holds real data.

## Run

```bash
cd e2e/production
npm install
export SUPER_EMAIL=…            # a super admin account
export SUPER_PW=…               # its password (don't put it in a file in this repo)
export PROD_DATABASE_URL=…      # Neon connection string, used only for cleanup
npm run all                     # or: node run-all.js certificates settings
```

Chrome must be installed (`CHROME_PATH` overrides the default macOS location).
Wait about 5 minutes after a frontend deploy: Cloudflare can serve the old pages until then.

| Check | What it covers |
|---|---|
| audit | Audit entries for staff, payments and settings actions; sign-ins |
| assignments | Assignments per track, capstone, resubmission, grading, bell items |
| certificates | Approved-graduation rule, uploads (Publitio when connected), revoke |
| settings | Cohort rules, instalment plan, notification templates (restores your settings) |
| contact | Site & Contact settings, contact form, spam limits (restores your details) |
| reminders | Instalment balance reminders |
