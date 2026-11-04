import {
  Compass, LayoutDashboard, Settings, GraduationCap, UserRound, Globe, LifeBuoy, type LucideIcon,
} from 'lucide-react';

// The Platform Guide (Admin → Guide). Plain data: each section has a menu reference and scenarios.
// Keep it in step with the app — button names are written exactly as they appear on screen.

export type Step = string | { text: string; link?: { to: string; label: string } };

export interface Scenario {
  id: string;
  title: string;
  who: string;
  when: string;
  steps: Step[];
  // Screenshots in /public/guide, taken from a demo copy of the platform (made-up people).
  shots?: [file: string, caption: string][];
  auto?: string[];
  tips?: string[];
}

export interface GuideSection {
  id: string;
  title: string;
  icon: LucideIcon;
  intro: string;
  menuTitle?: string;
  menu: { name: string; path?: string; desc: string }[];
  scenarios: Scenario[];
}

const go = (to: string, label: string) => ({ to, label });

export const GUIDE: GuideSection[] = [
  // ── Start here ────────────────────────────────────────────────────────────
  {
    id: 'start',
    title: 'Start here',
    icon: Compass,
    intro:
      'NetraNova has four places people use: the public website, the Learner portal, the Instructor portal (instructors and teaching assistants) and this Admin portal. Everyone signs in at the same login page and lands in their own portal automatically.',
    menuTitle: 'Who uses what',
    menu: [
      { name: 'Public website', desc: 'Anyone. Home, tracks and pricing, course pages, certificate verification, contact, terms and privacy.' },
      { name: 'Learner portal', desc: 'People who sign up on the website. They pay, join live classes, submit work, track progress and get their certificate.' },
      { name: 'Instructor portal', desc: 'Instructors and teaching assistants (TAs). They schedule and teach classes, take attendance, set and grade assignments and recommend learners for graduation. TAs can do everything an instructor can, for the tracks they are on.' },
      { name: 'Admin portal', desc: 'Your team. Cohorts, enrollments, payments, refunds, graduation, certificates, reports, settings and user accounts. Each admin can be limited to certain areas.' },
      { name: 'Super admin', desc: 'Admins with the crown. They can do everything, including payment and email keys (Settings → Integrations), making other super admins and this Guide.' },
      { name: 'The bell', desc: 'Top of every portal. A live to-do list built from what is happening: enrollments to review, withdrawals, certificates to issue, work to grade, classes starting soon, balances due. Items disappear when the underlying task is done.' },
    ],
    scenarios: [
      {
        id: 'journey',
        title: 'The whole journey, start to finish',
        who: 'Everyone',
        when: 'Read this first',
        shots: [['public-home-tracks', 'The homepage lists every track open for enrollment'], ['admin-dashboard', 'The admin dashboard'], ['admin-bell', 'The bell: your live to-do list']],
        steps: [
          { text: 'An admin creates a cohort (e.g. "Cohort 2"), adds tracks to it with a price and seat limit, and assigns an instructor.', link: go('/admin/cohorts', 'Cohorts') },
          'The cohort appears on the public homepage and pricing page as soon as its status is Upcoming or Active.',
          'A visitor signs up, picks a track and pays with Paystack — in full or in two instalments. Paying enrolls them automatically; no admin step is needed.',
          'The instructor schedules live classes. Learners get an email for each and join from their portal; joining marks them present.',
          'The instructor posts assignments and a capstone, and grades submissions. Learners are emailed their grades.',
          'At the end, the instructor recommends each learner (Pass, Conditional or Fail). An admin approves the graduation, then issues the certificate.',
          'The learner gets an email, downloads the certificate and shares a link anyone (e.g. an employer) can use to verify it.',
        ],
        auto: [
          'Emails go out at each step (welcome, receipt, class scheduled, graded, graduation decision, certificate). See Settings → Notification Templates.',
          'Everything an admin changes is recorded in the Audit Log.',
        ],
      },
      {
        id: 'first-load',
        title: 'The site is slow the first time I open it',
        who: 'Anyone',
        when: 'After a quiet period',
        steps: [
          'The API runs on a free server that sleeps after about 15 minutes with no visitors. The first request wakes it, which takes up to a minute; after that it is fast.',
          'Pages show grey placeholders and retry while it wakes. If something looks empty, wait a moment and refresh.',
        ],
        tips: [
          'Upgrading the API server to Render Starter (about $7/month) removes the sleep. Until then, background jobs (payment re-checks, instalment reminders) only run while the server is awake.',
        ],
      },
    ],
  },

  // ── Admin portal ──────────────────────────────────────────────────────────
  {
    id: 'admin',
    title: 'Admin portal',
    icon: LayoutDashboard,
    intro:
      'Day-to-day running of the academy. Each menu item can be switched on or off per admin from Users (gear icon); super admins see everything.',
    menu: [
      { name: 'Dashboard', path: '/admin/dashboard', desc: 'Counts at a glance: active cohorts, enrolled learners, pending enrollments, at-risk learners and revenue. Click a card to open its page.' },
      { name: 'Cohorts', path: '/admin/cohorts', desc: 'Create cohorts, add tracks with price and seats, assign the instructor and TAs, edit the public course page, and change cohort status.' },
      { name: 'Enrollments', path: '/admin/enrollments', desc: 'Everyone enrolled in a track. Approve or reject pending ones, reinstate withdrawn ones, or enroll a learner by hand.' },
      { name: 'Payments', path: '/admin/payments', desc: 'Every transaction. Re-check unconfirmed payments with Paystack and refund a payment.' },
      { name: 'Withdrawals', path: '/admin/withdrawals', desc: 'Learners who left a track. Decide the refund (a suggested amount is filled in from your refund policy).' },
      { name: 'At-Risk', path: '/admin/at-risk', desc: 'Learners attending less than 70% of their classes, with a quick email button.' },
      { name: 'Instructors', path: '/admin/instructors', desc: 'Teaching staff list. Add instructors and TAs and deactivate them. (Assign them to tracks in Cohorts.)' },
      { name: 'Graduation', path: '/admin/graduation', desc: "Instructors' recommendations per cohort. Approve, hold or reject; approved learners can then get a certificate." },
      { name: 'Certificates', path: '/admin/certificates', desc: 'Issue certificates to approved graduates, attach your own certificate file, revoke one.' },
      { name: 'Revenue', path: '/admin/revenue', desc: 'Totals, monthly revenue chart, full vs instalment split, and a CSV of all payments.' },
      { name: 'Reports', path: '/admin/reports', desc: 'Download CSVs (open in Excel): enrollments, revenue, at-risk learners and certificates, by date range.' },
      { name: 'Settings', path: '/admin/settings', desc: 'Prices, cohort rules, payment and refund rules, email templates, site & contact details and (super admin) integrations. See the Settings tab of this guide.' },
      { name: 'Users', path: '/admin/users', desc: 'All accounts. Create accounts, change roles, limit what an admin can see, suspend and reactivate, make super admins.' },
      { name: 'Audit Log', path: '/admin/audit', desc: 'Read-only history of who did what and when, with before → after values.' },
    ],
    scenarios: [
      {
        id: 'launch-cohort',
        title: 'We are launching a new cohort',
        who: 'Admin with Cohorts',
        when: 'Before you start selling seats',
        shots: [['admin-new-cohort', 'Cohorts → New Cohort'], ['admin-cohorts', 'A cohort expanded: tracks, price, seats, instructor and TAs'], ['admin-course-page', 'Course Page editor: what visitors read']],
        steps: [
          { text: 'Open Cohorts and click New Cohort. Enter a name (e.g. "Cohort 2 — Jan 2027"), the start date and end date, then Create Cohort.', link: go('/admin/cohorts', 'Cohorts') },
          'Click the cohort to expand it, then Add Program. Choose the track, set the Price (₦) and Max Learners (seats), optionally pick the instructor, then Add Program. Repeat for each track.',
          'On each track row, use + Add TA to add teaching assistants. The instructor dropdown can be changed any time.',
          'Click Course Page on a track to fill in what visitors read: description, duration, format, schedule, learning outcomes and the week-by-week curriculum. Save Content.',
          'Leave the cohort status as Upcoming. It now shows on the homepage and pricing page and learners can pay.',
        ],
        auto: [
          'Adding a track emails all learners "Now enrolling: <track>" (switch this off in Notification Templates if you prefer).',
          'Price and seat changes save as soon as you click out of the field.',
        ],
        tips: [
          'The cohort name and dates cannot be edited on screen after creation — double-check them before you click Create Cohort.',
          'Deleting a cohort also deletes its tracks. It will fail if learners have already enrolled or paid.',
        ],
      },
      {
        id: 'cohort-status',
        title: 'The cohort has started (or finished)',
        who: 'Admin with Cohorts',
        when: 'On the start date and the end date',
        shots: [['admin-cohorts', 'The status dropdown on each cohort']],
        steps: [
          { text: 'Open Cohorts and change the status dropdown: Upcoming → Active when classes begin, Active → Completed when it ends. Use Cancelled if it will not run.', link: go('/admin/cohorts', 'Cohorts') },
          'Status does not change by itself, so set a reminder for both dates.',
        ],
        auto: [
          'Completed and cancelled cohorts disappear from the homepage and checkout closes for them.',
          'Learners can keep joining an Active cohort unless you set a late-enrollment limit (Settings → Cohort Rules).',
          'The Graduation queue lists Active and Completed cohorts.',
        ],
      },
      {
        id: 'paid-not-enrolled',
        title: '"I paid but I\'m not enrolled"',
        who: 'Admin with Payments',
        when: 'A learner contacts you after paying',
        shots: [['admin-payments', 'Payments: Re-check pending (top right), Refund and Mark paid per row']],
        steps: [
          { text: 'Open Payments and search for the learner. A Paid payment means they are enrolled — ask them to sign out and back in.', link: go('/admin/payments', 'Payments') },
          'If it shows Pending, click Re-check pending. NetraNova asks Paystack directly; confirmed payments become Paid and the learner is enrolled and sent a receipt.',
          'If it is still pending, Paystack has not received the money yet (bank transfers can take a few minutes). Check again later, or look the reference up in your Paystack dashboard.',
        ],
        auto: [
          'Pending payments are re-checked with Paystack automatically every 10 minutes while the server is awake, and when the learner opens their dashboard.',
          'Abandoned checkouts older than an hour are closed automatically.',
        ],
        tips: [
          '"Mark paid" only changes the status label. It does not enroll the learner or send a receipt — for money received outside Paystack, use Enrollments → Enroll a learner instead.',
        ],
      },
      {
        id: 'manual-enroll',
        title: 'A learner paid by bank transfer, or has a scholarship',
        who: 'Admin with Enrollments',
        when: 'Money (or no money) arrived outside Paystack',
        shots: [['admin-enroll-learner', 'Enrollments → Enroll a learner']],
        steps: [
          'Ask the learner to create a free account on the website first.',
          { text: 'Open Enrollments → Enroll a learner. Enter their email, pick the track, add a note (e.g. "Paid by transfer, ref 1234"), then Enroll learner.', link: go('/admin/enrollments', 'Enrollments') },
        ],
        auto: ['They are enrolled immediately and get the "You\'re enrolled" email. The action is in the Audit Log.'],
        tips: [
          'No payment is recorded, so this money will not appear in Revenue or reports — keep your own record of offline payments.',
          'The track\'s seat limit still applies; raise Max Learners first if it is full.',
        ],
      },
      {
        id: 'pending-enrollment',
        title: 'There are enrollments waiting for review',
        who: 'Admin with Enrollments',
        when: 'The bell says "Enrollment awaiting review"',
        shots: [['admin-enrollments', 'Pending rows have ✓ approve and ✗ reject']],
        steps: [
          { text: 'Open Enrollments, filter by Pending, and click ✓ to approve or ✗ to reject. Both apply immediately.', link: go('/admin/enrollments', 'Enrollments') },
        ],
        auto: ['The learner is emailed the decision.'],
        tips: ['Paying online approves enrollments automatically, so pending ones are rare.'],
      },
      {
        id: 'withdrawal',
        title: 'A learner wants to leave and get a refund',
        who: 'Admin with Payments',
        when: 'The bell says "Withdrawal needs review"',
        shots: [['admin-withdrawals', 'Withdrawals: suggested refund, Approve & refund or Deny refund']],
        steps: [
          'The learner withdraws themselves from Programs in their portal. They lose access straight away and any unpaid instalment is cancelled.',
          { text: 'Open Withdrawals. You see what they paid, how far into the cohort they were, and a suggested refund from your refund policy.', link: go('/admin/withdrawals', 'Withdrawals') },
          'Adjust the refund amount if needed (never more than they paid), then Approve & refund — or Deny refund if the policy gives nothing.',
        ],
        auto: [
          'Approving sends the refund through Paystack to the card or account they paid with.',
          'The learner is emailed the decision. Both outcomes are in the Audit Log.',
        ],
        tips: [
          'Change the refund rules in Settings → Payment Rules → Refund Policy.',
          'If they change their mind, Enrollments → Reinstate gives them access back (a refunded payment is not restored).',
        ],
      },
      {
        id: 'refund-payment',
        title: 'Refund one payment without a withdrawal',
        who: 'Admin with Payments',
        when: 'E.g. someone was charged twice',
        shots: [['admin-payments', 'Refund is on each paid payment']],
        steps: [
          { text: 'Open Payments, find the Paid payment and click Refund. Confirm.', link: go('/admin/payments', 'Payments') },
        ],
        auto: ['Paystack refunds the full amount of that payment. The learner keeps their enrollment.'],
        tips: ['For a learner leaving the course, use Withdrawals instead — it handles access and partial refunds.'],
      },
      {
        id: 'at-risk',
        title: 'A learner is falling behind',
        who: 'Admin with At-Risk',
        when: 'The dashboard shows at-risk learners',
        shots: [['admin-at-risk', 'At-Risk learners with attendance rate']],
        steps: [
          { text: 'Open At-Risk. Learners below 70% attendance are listed with how many classes they attended.', link: go('/admin/at-risk', 'At-Risk') },
          'Click Send Email to write to them from your own email app, or share the list with their instructor.',
        ],
        tips: ['"Mark Resolved" only hides the card until you reload the page; it is not saved.'],
      },
      {
        id: 'new-instructor',
        title: 'We hired a new instructor or TA',
        who: 'Admin with Teaching Staff',
        when: 'Before their first class',
        shots: [['admin-instructors', 'Teaching Staff with their assigned tracks']],
        steps: [
          { text: 'Open Instructors, choose the Instructors or Technical Assistants tab, click Add, fill in their details and a temporary password, then Create.', link: go('/admin/instructors', 'Instructors') },
          { text: 'Open Cohorts, expand the cohort, and pick them in the track\'s Instructor dropdown (or + Add TA).', link: go('/admin/cohorts', 'Cohorts') },
        ],
        auto: ['They receive an email with a link to set their own password (valid 72 hours) and land in the Instructor portal when they sign in.'],
        tips: ['If the link expires, they can use "Forgot password?" on the login page.'],
      },
      {
        id: 'graduation',
        title: 'Graduation day: approving graduates and issuing certificates',
        who: 'Admin with Graduation and Certificates',
        when: 'End of the cohort',
        shots: [['admin-graduation', 'Graduation queue: recommendations, Approve / Hold / Reject'], ['admin-certificates', 'Certificates: Ready to issue, attach a file, Issue certificate']],
        steps: [
          'Instructors submit a recommendation for each learner (Pass, Conditional or Fail) from their Graduation page.',
          { text: 'Open Graduation and pick the cohort. Approve, Hold (for Conditional) or Reject each learner. "Bulk Approve Passing" approves every Pass at once.', link: go('/admin/graduation', 'Graduation') },
          { text: 'Approved learners show "Issue certificate". It opens Certificates with the learner highlighted under "Ready to issue".', link: go('/admin/certificates', 'Certificates') },
          'Optionally attach your designed certificate (PDF, PNG or JPG, up to 5 MB), then click Issue certificate.',
        ],
        auto: [
          'Each decision emails the learner. Issuing emails them that their certificate is ready, with a unique number (NN-…).',
          'Files are stored on Publitio when it is connected (Settings → Integrations).',
        ],
        tips: [
          'A certificate can only be issued for an approved graduation, once per learner per track.',
          'To change an approved graduation after a certificate exists, revoke the certificate first.',
        ],
      },
      {
        id: 'certificate-fix',
        title: 'A certificate has a mistake, or must be withdrawn',
        who: 'Admin with Certificates',
        when: 'Wrong file, or issued in error',
        shots: [['admin-certificates', 'Replace, Remove file, view (eye) and revoke (bin)']],
        steps: [
          { text: 'Open Certificates. To change only the file, use Replace (or Remove file). The certificate number stays valid.', link: go('/admin/certificates', 'Certificates') },
          'To cancel it entirely, click the bin icon (Revoke). It stops verifying immediately and disappears from the learner\'s portal. You can then issue a new one.',
        ],
        tips: ['Use the eye icon to see exactly what an employer sees on the public verification page.'],
      },
      {
        id: 'limited-admin',
        title: 'Give a colleague admin access to only some areas',
        who: 'Admin with User Management',
        when: 'E.g. a finance person who should only see payments',
        shots: [['admin-permissions', 'Gear icon → choose the areas this admin can use']],
        steps: [
          { text: 'Open Users → Add User, choose the Admin role and create the account.', link: go('/admin/users', 'Users') },
          'Click the gear icon on their row, tick only the areas they need (e.g. Payments, Revenue, Reports), then Save.',
        ],
        auto: ['Their menu only shows those areas, and the server refuses anything else even if they type the address.'],
        tips: [
          'Changing someone\'s role resets their permissions to that role\'s defaults.',
          'An admin who only has "Teaching Staff" can create instructor and TA accounts, but not other admins.',
        ],
      },
      {
        id: 'suspend',
        title: 'Someone has left, or an account must be blocked',
        who: 'Admin with User Management',
        when: 'Staff leaving, suspicious account',
        shots: [['admin-users', 'Users: role, status and actions per account']],
        steps: [
          { text: 'Open Users, find them and click the suspend icon. Reactivate the same way.', link: go('/admin/users', 'Users') },
        ],
        auto: ['Suspended people cannot sign in ("Your account has been suspended. Contact an administrator."). Their history is kept — accounts are never deleted.'],
        tips: ['For teaching staff, also remove them from their tracks in Cohorts so learners see the right instructor.'],
      },
      {
        id: 'super-admin',
        title: 'Make (or remove) another super admin',
        who: 'Super admin',
        when: 'Adding a co-owner',
        shots: [['admin-users', 'The crown icon grants super admin']],
        steps: [
          { text: 'Open Users and click the crown icon on an admin account to grant or remove super admin.', link: go('/admin/users', 'Users') },
        ],
        tips: ['You cannot remove your own super admin access, so there is always at least one.', 'Super admins can change payment keys — give it only to people you fully trust.'],
      },
      {
        id: 'who-changed',
        title: '"Who changed this?"',
        who: 'Admin with Audit Log',
        when: 'A price, refund, role or key changed unexpectedly',
        shots: [['admin-audit', 'Audit Log: who, what and when; click a row for details']],
        steps: [
          { text: 'Open Audit Log. Search for a name, email or word (e.g. "price", "refund"), or filter by action.', link: go('/admin/audit', 'Audit Log') },
          'Click a row to see the old and new values, and the IP address it came from.',
        ],
        auto: ['Staff and admin sign-ins (and failed attempts) are logged too. Automatic actions show as "System".'],
      },
      {
        id: 'finance-export',
        title: 'Month-end: export the numbers',
        who: 'Admin with Revenue or Reports',
        when: 'Accounting, board updates',
        shots: [['admin-revenue', 'Revenue dashboard and Export CSV'], ['admin-reports', 'Reports with date ranges']],
        steps: [
          { text: 'Revenue shows totals and the monthly chart; Export CSV downloads every payment.', link: go('/admin/revenue', 'Revenue') },
          { text: 'Reports lets you pick a date range for the enrollment, revenue and certificate reports, plus the current at-risk list. Files open in Excel or Google Sheets.', link: go('/admin/reports', 'Reports') },
        ],
        tips: ['Learners enrolled by hand have no payment record, so they are not in revenue figures.'],
      },
    ],
  },

  // ── Settings & integrations ───────────────────────────────────────────────
  {
    id: 'settings',
    title: 'Settings & Integrations',
    icon: Settings,
    intro: 'Rules that apply across the whole platform. Every change here is recorded in the Audit Log.',
    menuTitle: 'Settings tabs',
    menu: [
      { name: 'Program Pricing', path: '/admin/settings', desc: 'Every track\'s price and seat limit in one table. Save Changes.' },
      { name: 'Cohort Rules', path: '/admin/settings', desc: 'Default seats for new tracks, "one program at a time", and how late learners can join a running cohort.' },
      { name: 'Payment Rules', path: '/admin/settings', desc: 'Refund policy (used for suggested refunds) and instalments: on/off, first-payment %, and balance reminder emails.' },
      { name: 'Notification Templates', path: '/admin/settings', desc: 'All 14 emails the platform sends. Switch one off, add a note to it, or send yourself a preview.' },
      { name: 'Site & Contact', path: '/admin/settings', desc: 'Contact email, phone, WhatsApp, address, hours, social links and your Terms and Privacy text for the public site.' },
      { name: 'Integrations', path: '/admin/settings', desc: 'Super admins only. Paystack keys (payments), Resend (email sending) and Publitio (files and photos).' },
    ],
    scenarios: [
      {
        id: 'price-change',
        title: 'Change a track\'s price or number of seats',
        who: 'Admin with Settings (or Cohorts)',
        when: 'Before or during enrollment',
        shots: [['settings-pricing', 'Settings → Program Pricing']],
        steps: [{ text: 'Settings → Program Pricing: edit the Price or Max Learners, then Save Changes. (You can also edit them on the track row in Cohorts.)', link: go('/admin/settings', 'Settings') }],
        tips: ['New prices apply to new checkouts only. Existing payments and balances keep their amounts.'],
      },
      {
        id: 'refund-policy',
        title: 'Change the refund policy',
        who: 'Admin with Settings',
        when: 'Business decision',
        shots: [['settings-payment-rules', 'Settings → Payment Rules → Refund Policy']],
        steps: [
          { text: 'Settings → Payment Rules → Refund Policy. Choose whether learners get 100% back before the cohort starts, the grace window (days after start), the refund % within it and the % after it. Save Policy.', link: go('/admin/settings', 'Settings') },
        ],
        auto: ['The pricing page shows the policy to visitors, and Withdrawals uses it for the suggested refund. You can still change the amount on each request.'],
      },
      {
        id: 'instalments',
        title: 'Change or switch off instalments',
        who: 'Admin with Settings',
        when: 'Business decision',
        shots: [['settings-instalments', 'Instalments: on/off, first payment %, reminders']],
        steps: [
          { text: 'Settings → Payment Rules → Instalments. Untick "Offer two instalments" to only allow full payment, or change the first payment % (10–90).', link: go('/admin/settings', 'Settings') },
          'Set the balance reminders: "Every N days, up to M times". 0 turns reminders off.',
          'Save Instalments.',
        ],
        auto: [
          'Checkout, the homepage and the pricing page update immediately.',
          'Learners with an unpaid balance are emailed every N days after their first payment until they pay. The check runs about a minute after the server wakes up and then hourly.',
        ],
        tips: ['Balances that already exist keep their amounts.'],
      },
      {
        id: 'late-enrollment',
        title: 'Stop people joining a cohort too late',
        who: 'Admin with Settings',
        when: 'Before a cohort starts',
        shots: [['settings-cohort-rules', 'Settings → Cohort Rules']],
        steps: [{ text: 'Settings → Cohort Rules → Late enrollment: enter the number of days after the start date that learners can still pay (0 = up to the start day). Leave it blank for no limit. Save Rules.', link: go('/admin/settings', 'Settings') }],
        auto: ['Finished and cancelled cohorts are always closed, whatever this says.'],
        tips: ['You can still enroll someone by hand from Enrollments.'],
      },
      {
        id: 'email-note',
        title: 'Add our WhatsApp group link to the welcome email',
        who: 'Admin with Settings',
        when: 'Any time',
        shots: [['settings-templates', 'Notification Templates: switch, note, preview']],
        steps: [
          { text: 'Settings → Notification Templates. Click the email (e.g. "Enrollment approved / declined" or "Payment receipt").', link: go('/admin/settings', 'Settings') },
          'Type the note in "Extra note" — it appears in a highlighted box in that email.',
          'Click Send me a preview to see it in your inbox, then Save note.',
        ],
        tips: [
          'Use the On/Off switch to stop an email entirely (e.g. "New track open for enrollment").',
          'Password reset, staff account, payment receipt and refund decision emails are always on.',
        ],
      },
      {
        id: 'contact-details',
        title: 'Publish our contact details, socials and legal pages',
        who: 'Admin with Settings',
        when: 'Before launch',
        shots: [['settings-site', 'Settings → Site & Contact'], ['public-contact', 'What visitors see on the Contact page']],
        steps: [
          { text: 'Settings → Site & Contact. Fill in the contact email (messages from the website\'s contact form go here), phone, WhatsApp, address and hours.', link: go('/admin/settings', 'Settings') },
          'Paste your social media links (each must start with https://).',
          'Paste your Terms of Service and Privacy Policy, with a blank line between paragraphs.',
          'Save Details.',
        ],
        auto: [
          'The Contact page, footer icons and the /public/terms and /public/privacy pages update immediately.',
          'The sign-up page links to Terms and Privacy once they are published.',
        ],
        tips: ['Without a contact email, the contact form is hidden. Reply to a contact-form email to answer the visitor directly.'],
      },
      {
        id: 'paystack-live',
        title: 'Go live with real payments',
        who: 'Super admin',
        when: 'When Paystack activates your business',
        shots: [['settings-integrations', 'Settings → Integrations (super admins only)']],
        steps: [
          'In your Paystack dashboard: Settings → API Keys & Webhooks. Copy the live secret key (sk_live_…) and public key (pk_live_…).',
          { text: 'Settings → Integrations → Paystack. Paste both and click Save keys. Confirm "Switch payments to LIVE?".', link: go('/admin/settings', 'Settings') },
        ],
        auto: ['The keys are checked with Paystack before saving and stored encrypted; only the start and end of the key are ever shown again.'],
        tips: ['From that moment every checkout charges real money and refunds return real money. Payments made with test keys can no longer be verified.'],
      },
      {
        id: 'resend',
        title: 'Emails are not arriving, or change the sender address',
        who: 'Super admin',
        when: 'Setting up email',
        shots: [['settings-integrations', 'Email (Resend) is the second card']],
        steps: [
          { text: 'Settings → Integrations → Email (Resend). The sender must be on a domain verified in your Resend account. Save email settings.', link: go('/admin/settings', 'Settings') },
          'Use Send test email to check it works.',
          'Check Notification Templates that the email is switched on, and ask the person to look in spam.',
        ],
        tips: ['Resend\'s free plan sends about 100 emails a day. Announcements go to every learner in a cohort, so upgrade Resend as you grow.'],
      },
      {
        id: 'publitio',
        title: 'Turn on file and photo storage',
        who: 'Super admin',
        when: 'Once',
        shots: [['settings-integrations', 'Files & images (Publitio) is further down this tab']],
        steps: [{ text: 'Settings → Integrations → Files & images (Publitio). Paste the API key and secret from Publitio → Settings → API, then Save keys.', link: go('/admin/settings', 'Settings') }],
        auto: ['Certificate files and profile photos are then stored on Publitio. Without it, certificate files are kept in the database and profile photos are turned off.'],
        tips: ['Files on Publitio are public links (fine for certificates and photos, not for private documents).'],
      },
    ],
  },

  // ── Instructor portal ─────────────────────────────────────────────────────
  {
    id: 'teaching',
    title: 'Instructor portal',
    icon: GraduationCap,
    intro:
      'Used by instructors and teaching assistants (TAs) for the tracks they are assigned to in Cohorts. Instructors and TAs have the same tools. Pages open on the track in the running cohort; someone on several tracks (e.g. Cohort 1 and Cohort 2) gets a track switcher at the top right. Share this tab with new teaching staff.',
    menu: [
      { name: 'Dashboard', desc: 'Their tracks, session counts and next session.' },
      { name: 'Sessions', desc: 'Schedule live classes, launch the classroom, mark a class complete, open recordings.' },
      { name: 'Calendar', desc: 'The same classes on a month calendar.' },
      { name: 'Attendance', desc: 'Mark Present, Excused or Absent for a class. (Learners who join live are marked present automatically.)' },
      { name: 'Assignments', desc: 'Post assignments and the capstone for a track, see submissions, grade with feedback.' },
      { name: 'Learner Roster', desc: 'Learners in their track with contact details.' },
      { name: 'Announcements', desc: 'Post updates to everyone in the cohort.' },
      { name: 'Materials', desc: 'A week-by-week list of links (Google Drive, YouTube, docs).' },
      { name: 'Graduation', desc: 'Recommend each learner Pass, Conditional or Fail at the end.' },
    ],
    scenarios: [
      {
        id: 'instructor-first-day',
        title: 'Getting a new instructor started',
        who: 'Instructor or TA',
        when: 'First sign-in',
        shots: [['inst-dashboard', 'The instructor dashboard'], ['inst-calendar', 'Their classes on the calendar'], ['inst-roster', 'Learner Roster']],
        steps: [
          'They open the "Your NetraNova account has been created" email and click the link to set a password (valid 72 hours).',
          'They sign in and land on the Instructor portal dashboard, which lists the tracks they are assigned to.',
          'If the dashboard says "You haven\'t been assigned to any programs yet", an admin needs to pick them on the track in Cohorts.',
        ],
      },
      {
        id: 'teach-live',
        title: 'Schedule and teach a live class',
        who: 'Instructor or TA',
        when: 'Every class',
        shots: [['inst-schedule', 'Sessions → Schedule Session'], ['classroom', 'The classroom before joining: Start Classroom'], ['inst-sessions', 'Completed classes show their recording']],
        steps: [
          'Sessions → Schedule Session. Enter the title, date & time and duration, then Create Session.',
          'At class time click Launch Classroom, then Start Classroom. The class runs in the browser (8x8); no app is needed.',
          'Start the recording from the meeting\'s menu as soon as class begins — the website promises learners every class is recorded.',
          'When finished, click End Session. This marks the class complete.',
        ],
        auto: [
          'Every learner in the track is emailed when a class is scheduled, and sees it in their portal and bell.',
          'Learners who join are marked present automatically.',
          'The recording is attached to the session by itself once 8x8 finishes processing it; learners then see Watch Recording.',
        ],
        tips: [
          'If a recording does not appear, paste its link in "Recording URL (manual override)" on the ended session and click Save Recording.',
          'Scheduled classes cannot be edited or deleted on screen yet — check the date and time before creating.',
        ],
      },
      {
        id: 'take-attendance',
        title: 'Correct or record attendance',
        who: 'Instructor or TA',
        when: 'After class',
        shots: [['inst-attendance', 'Attendance: Present / Excused / Absent, then Save Attendance']],
        steps: [
          'Attendance → select the session. Click Present, Excused or Absent for each learner.',
          'Click Save Attendance. Anyone left unmarked is saved as Absent; saving again updates the marks.',
        ],
        auto: ['Attendance feeds the learner\'s Progress page and the admin At-Risk list (below 70% = at risk; Excused counts as attended).'],
      },
      {
        id: 'assignments',
        title: 'Set an assignment, then grade it',
        who: 'Instructor or TA',
        when: 'Weekly',
        shots: [['inst-assignments', 'Assignments with submissions and grades']],
        steps: [
          'Assignments → New Assignment. Choose the track (if they teach more than one), add the title, due date, description and maximum score, then Create.',
          'For the final project tick "This is the capstone project" (one per track).',
          'Click an assignment to see submissions. Click Grade, enter the score and feedback, then Save. Re-grade if needed.',
        ],
        auto: [
          'Learners see new assignments in their portal and bell; the bell also shows "Assignment due soon" two days before the due date.',
          'Grading emails the learner their score and feedback. A graded submission can no longer be changed by the learner.',
        ],
        tips: ['An assignment can only be deleted before anyone submits. Late submissions are accepted.'],
      },
      {
        id: 'announce',
        title: 'Tell the class something',
        who: 'Instructor or TA',
        when: 'Changes, reminders',
        shots: [['inst-announcements', 'Announcements']],
        steps: ['Announcements → write a title and message → Post Announcement.'],
        auto: ['It is emailed to every learner in the cohort (all tracks), and shows on their dashboard and bell.'],
        tips: ['Announcements reach the whole cohort, not just one track.'],
      },
      {
        id: 'materials',
        title: 'Share slides and resources',
        who: 'Instructor or TA',
        when: 'Weekly',
        shots: [['inst-materials', 'Materials by week']],
        steps: ['Materials → Add Material. Paste a link (e.g. Google Drive — set sharing to "Anyone with the link"), choose the type and week, then Add Material.'],
        tips: ['Materials are links, not uploads. Learners do not have a Materials page yet, so also share important links in an announcement or the assignment description.'],
      },
      {
        id: 'recommend',
        title: 'End of cohort: recommend learners for graduation',
        who: 'Instructor or TA',
        when: 'Last week',
        shots: [['inst-graduation', 'Graduation: Pass, Conditional or Fail with notes']],
        steps: [
          'Graduation → for each learner choose Pass, Conditional or Fail, add notes, then Submit Recommendation. It can be changed until an admin decides.',
        ],
        auto: ['The admin sees it in the Graduation queue and the bell. Learners are only emailed once the admin decides.'],
        tips: ['A note is required for Conditional and Fail, explaining what the learner must do.'],
      },
    ],
  },

  // ── Learner portal ────────────────────────────────────────────────────────
  {
    id: 'learner',
    title: 'Learner portal',
    icon: UserRound,
    intro: 'What learners see after signing up. Use this when a learner asks "how do I…?".',
    menu: [
      { name: 'Dashboard', desc: 'Next class with a Join button, latest announcements, and if not enrolled yet, open tracks to pay for.' },
      { name: 'Programs', desc: 'All cohorts and tracks. Enroll (pay), and Withdraw from their track.' },
      { name: 'Sessions / Calendar', desc: 'Their live classes: Join Classroom, and Watch Recording afterwards.' },
      { name: 'Assignments', desc: 'Their track\'s assignments: submit a link, see score and feedback.' },
      { name: 'Capstone', desc: 'The final project brief and submission (GitHub link and optional live demo).' },
      { name: 'Progress', desc: 'Attendance, assignment completion and a graduation checklist.' },
      { name: 'Payments', desc: 'Their payments, and Pay balance for an outstanding instalment.' },
      { name: 'Certificate', desc: 'Their certificates: Download (if a file was attached) and Share (copies the verification link).' },
      { name: 'Profile', desc: 'Name, phone and profile photo.' },
    ],
    scenarios: [
      {
        id: 'learner-enroll',
        title: 'How a learner signs up and pays',
        who: 'Learner',
        when: 'Enrolling',
        shots: [['public-register', 'Sign-up page'], ['learner-checkout', 'Checkout: pay in full or in instalments']],
        steps: [
          'On the website they open a track and click Enroll now (or Create Free Account on the sign-up page).',
          'After signing up, checkout opens: Pay in full, or 2 installments (pay part now, the rest later). They pay with Paystack — card, bank transfer or USSD.',
          'When Paystack confirms, they see "Payment Successful!" and are enrolled.',
        ],
        auto: ['Welcome and receipt emails are sent. The receipt shows any remaining balance.'],
        tips: [
          'Checkout refuses: a full track, a closed cohort, a second program while one is still running (if "One program at a time" is on), and instalments when they are switched off.',
        ],
      },
      {
        id: 'learner-balance',
        title: 'Paying the second instalment',
        who: 'Learner',
        when: 'Any time before the end',
        shots: [['learner-payments', 'Payments: Pay balance on the open instalment']],
        steps: ['Payments → Pay balance → Pay with Paystack.'],
        auto: ['The bell shows "Instalment balance due" and reminder emails are sent on the schedule in Settings → Payment Rules until it is paid.'],
      },
      {
        id: 'learner-class',
        title: 'Joining a live class, or catching up',
        who: 'Learner',
        when: 'Class time',
        shots: [['learner-dashboard', 'Learner dashboard with the next class'], ['learner-sessions', 'Sessions: Join Classroom / Watch Recording']],
        steps: [
          'Dashboard (Next Session) or Sessions → Join Classroom → Join Classroom. It opens in the browser; allow the camera and microphone.',
          'Missed it? Sessions → Watch Recording on the completed class.',
        ],
        auto: ['Joining marks them present. They get an email when a class is scheduled and a bell reminder 48 hours before.'],
        tips: ['Only learners with an approved enrollment in that track can enter. If they cannot, check Enrollments and Payments.'],
      },
      {
        id: 'learner-submit',
        title: 'Submitting work',
        who: 'Learner',
        when: 'Weekly and at the end',
        shots: [['learner-assignments', 'Assignments with scores and feedback'], ['learner-capstone', 'The capstone page']],
        steps: [
          'Assignments → Submit → paste the link (GitHub, Google Drive…) → Submit. They can Update submission until it is graded.',
          'Capstone → fill in the project title, description, GitHub repository and optional live demo → Submit Capstone.',
        ],
        auto: ['They are emailed when the work is graded, with the score and feedback.'],
      },
      {
        id: 'learner-progress',
        title: '"Am I on track to graduate?"',
        who: 'Learner',
        when: 'Any time',
        shots: [['learner-progress', 'Progress and the graduation checklist']],
        steps: ['Progress shows attendance (aim for 70%+), assignments submitted (aim for 80%+), capstone, payments and the instructor\'s recommendation.'],
        tips: ['The checklist is guidance. The final decision is the instructor\'s recommendation plus your approval in Graduation.'],
      },
      {
        id: 'learner-withdraw',
        title: 'A learner wants to withdraw',
        who: 'Learner',
        when: 'Leaving the course',
        shots: [['learner-programs', 'Programs: Withdraw is on their current track']],
        steps: ['Programs → Withdraw on their track → confirm.'],
        auto: ['They lose access straight away and get an email with the suggested refund. You decide the refund in Withdrawals.'],
      },
      {
        id: 'learner-certificate',
        title: 'Getting and sharing the certificate',
        who: 'Learner',
        when: 'After graduation',
        shots: [['learner-certificate', 'Certificate: Download and Share']],
        steps: ['Certificate → Download (if you attached a file) and Share, which copies a verification link they can put on LinkedIn or send to employers.'],
        auto: ['They get an email and a bell notification when it is issued.'],
      },
      {
        id: 'learner-account',
        title: 'Profile photo, name or forgotten password',
        who: 'Learner',
        when: 'Any time',
        shots: [['learner-profile', 'Profile: click the photo to change it']],
        steps: [
          'Profile → click the photo to upload one (JPG, PNG or WebP, up to 2 MB), edit name or phone → Save Changes. The email address cannot be changed.',
          'Forgot password: on the login page click "Forgot password?" and follow the emailed link (valid 1 hour).',
        ],
      },
    ],
  },

  // ── Public site ───────────────────────────────────────────────────────────
  {
    id: 'public',
    title: 'Public website',
    icon: Globe,
    intro: 'What visitors see before they sign in. Most of it updates itself from your cohorts and settings.',
    menuTitle: 'Pages',
    menu: [
      { name: 'Home', desc: 'Hero, how it works, features, the tracks open for enrollment (from your Upcoming/Active cohorts), FAQ.' },
      { name: 'About', desc: 'Who NetraNova is and what every cohort includes.' },
      { name: 'Tracks', desc: 'All tracks with a comparison table; each opens a course page with tuition, dates, seats left, outcomes and curriculum.' },
      { name: 'Pricing', desc: 'Full vs instalment prices, open cohorts with seats left, and your refund policy.' },
      { name: 'Verify', desc: 'Anyone can enter a certificate number to confirm it is genuine.' },
      { name: 'Contact', desc: 'Your details from Settings → Site & Contact and a message form.' },
      { name: 'Terms / Privacy', desc: 'The text you paste into Settings → Site & Contact.' },
    ],
    scenarios: [
      {
        id: 'homepage-tracks',
        title: 'What decides which tracks the homepage shows?',
        who: 'Admin',
        when: 'Planning a launch',
        shots: [['public-home-tracks', 'Homepage tracks'], ['public-pricing', 'Pricing page'], ['public-track', "A track's course page"]],
        steps: [
          'The "Enrolling now" cards list every track in a cohort marked Upcoming or Active, soonest first, with its price and the instalment amount.',
          'If no cohort is Upcoming or Active, three sample tracks are shown with "dates announced soon".',
          { text: 'To change what appears, change the cohort status, track price or the Course Page in Cohorts.', link: go('/admin/cohorts', 'Cohorts') },
        ],
        tips: ['After a website update, Cloudflare can show the old version for up to 5 minutes.'],
      },
      {
        id: 'employer-verify',
        title: 'An employer wants to check a certificate',
        who: 'Anyone',
        when: 'Hiring',
        shots: [['public-verify', 'A verified certificate']],
        steps: ['They open the link the learner shared, or go to Verify and type the number (e.g. NN-1793701087721-9QGEC).'],
        auto: ['A valid certificate shows "Verified", the holder\'s name, track, cohort and date, and "View the certificate" if a file was attached. No contact details are shown. Revoked numbers show as not found.'],
      },
      {
        id: 'visitor-contact',
        title: 'A visitor sends a message',
        who: 'Visitor',
        when: 'Questions before buying',
        shots: [['public-contact', 'Contact page']],
        steps: ['Contact → fill in the form → Send message.'],
        auto: ['It is emailed to your contact address; just reply to answer them. Each visitor can send up to 3 messages in 10 minutes (50 a day for the whole site) to stop spam.'],
      },
    ],
  },

  // ── Troubleshooting ───────────────────────────────────────────────────────
  {
    id: 'help',
    title: 'Troubleshooting',
    icon: LifeBuoy,
    intro: 'Quick answers to the questions that come up most.',
    menu: [],
    scenarios: [
      {
        id: 'cant-join-class',
        title: 'A learner can\'t get into a class',
        who: 'Admin',
        when: 'Class time',
        steps: [
          { text: 'Check Enrollments: they need an Approved enrollment in that track.', link: go('/admin/enrollments', 'Enrollments') },
          'If they paid but are not approved, see "I paid but I\'m not enrolled".',
          'Ask them to use Chrome or Edge, allow camera and microphone, and refresh.',
        ],
      },
      {
        id: 'no-email',
        title: 'Someone did not receive an email',
        who: 'Admin',
        when: 'Any time',
        steps: [
          'Ask them to check spam and promotions.',
          { text: 'Check the email is switched on in Settings → Notification Templates.', link: go('/admin/settings', 'Settings') },
          'Super admin: Settings → Integrations → Send test email. If that fails, the Resend key or sender needs fixing.',
        ],
      },
      {
        id: 'old-page',
        title: 'I changed something but the website looks the same',
        who: 'Admin',
        when: 'After a change',
        steps: [
          'Data changes (prices, cohorts, settings) show immediately — refresh the page.',
          'After a website update by your developer, Cloudflare can serve the old page for up to 5 minutes.',
        ],
      },
      {
        id: 'staff-locked',
        title: 'A staff member can\'t sign in or can\'t see a menu',
        who: 'Admin with User Management',
        when: 'Access problems',
        steps: [
          { text: 'Users: check they are Active (not suspended) and have the right role.', link: go('/admin/users', 'Users') },
          'For a missing menu item, click the gear icon and tick that area.',
          'Forgotten password: "Forgot password?" on the login page.',
        ],
      },
    ],
  },
];
