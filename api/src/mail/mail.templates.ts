// HTML email templates. Inline styles only — most email clients ignore <style> blocks.
// Every value that came from a user (names, titles, announcement bodies…) goes through esc().

export interface EmailContent {
  subject: string;
  html: string;
}

const BRAND = '#1B4332';
const ACCENT = '#2D6A4F';

export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function naira(amount: unknown): string {
  const n = Number(amount ?? 0);
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function lagosDateTime(value: unknown): string {
  const d = new Date(value as any);
  if (isNaN(+d)) return '';
  return `${d.toLocaleString('en-GB', { timeZone: 'Africa/Lagos', dateStyle: 'full', timeStyle: 'short' })} (WAT)`;
}

export function lagosDate(value: unknown): string {
  const d = new Date(value as any);
  if (isNaN(+d)) return '';
  return d.toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos', day: 'numeric', month: 'long', year: 'numeric' });
}

/** Multi-line plain text (e.g. an announcement body) → escaped HTML paragraphs. */
export function paragraphs(text: unknown): string {
  return esc(text)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function button(label: string, url: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 8px"><tr><td style="border-radius:10px;background:${BRAND}">
<a href="${esc(url)}" style="display:inline-block;padding:12px 22px;color:#ffffff;font-weight:600;font-size:14px;text-decoration:none;border-radius:10px">${esc(label)}</a>
</td></tr></table>`;
}

function details(rows: [string, string][]): string {
  const body = rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#6b7280;font-size:13px;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;font-size:14px;color:#1A1A2E;font-weight:600">${v}</td></tr>`,
    )
    .join('');
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:16px 0;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;padding:8px 0;width:100%">${body}</table>`;
}

function layout(opts: { heading: string; body: string; cta?: { label: string; url: string }; footnote?: string }): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;color:#1A1A2E">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:${BRAND};padding:20px 28px;color:#ffffff;font-size:18px;font-weight:800;letter-spacing:.2px">QorePath</td></tr>
<tr><td style="padding:28px;font-size:15px;line-height:1.6">
<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:${BRAND}">${esc(opts.heading)}</h1>
${opts.body}
${opts.cta ? button(opts.cta.label, opts.cta.url) : ''}
${opts.footnote ? `<p style="margin:20px 0 0;font-size:12px;color:#6b7280">${opts.footnote}</p>` : ''}
</td></tr>
<tr><td style="padding:16px 28px;background:#f9fafb;color:#9ca3af;font-size:12px">You're receiving this because you have a QorePath account.</td></tr>
</table></td></tr></table></body></html>`;
}

const hi = (name?: string) => `<p style="margin:0 0 14px">Hi ${esc(name || 'there')},</p>`;

// ── Account ──────────────────────────────────────────────────────────────────

export function welcomeEmail(p: { firstName?: string; appUrl: string }): EmailContent {
  return {
    subject: 'Welcome to QorePath',
    html: layout({
      heading: 'Welcome to QorePath 🎉',
      body: `${hi(p.firstName)}<p style="margin:0 0 14px">Your account is ready. Browse the open programs, pick a track, and join live, expert-led sessions with your cohort.</p>`,
      cta: { label: 'Browse programs', url: `${p.appUrl}/public/courses` },
    }),
  };
}

export function passwordResetEmail(p: { firstName?: string; link: string }): EmailContent {
  return {
    subject: 'Reset your QorePath password',
    html: layout({
      heading: 'Reset your password',
      body: `${hi(p.firstName)}<p style="margin:0 0 14px">We received a request to reset your password. Click the button below to choose a new one. The link expires in 1 hour.</p>`,
      cta: { label: 'Reset password', url: p.link },
      footnote: "If you didn't ask for this, you can ignore this email — your password won't change.",
    }),
  };
}

export function staffAccountEmail(p: { firstName?: string; role: string; email: string; link: string }): EmailContent {
  const role = p.role === 'assistant' ? 'teaching assistant' : p.role;
  return {
    subject: 'Your QorePath account has been created',
    html: layout({
      heading: 'Your QorePath account is ready',
      body: `${hi(p.firstName)}<p style="margin:0 0 14px">An administrator has created a QorePath <b>${esc(role)}</b> account for you.</p>${details([['Login email', esc(p.email)]])}<p style="margin:0 0 14px">Set your own password to sign in. This link expires in 72 hours.</p>`,
      cta: { label: 'Set your password', url: p.link },
    }),
  };
}

// ── Payments & enrollment ────────────────────────────────────────────────────

export function paymentReceiptEmail(p: {
  firstName?: string;
  amount: unknown;
  reference: string;
  track: string;
  cohort?: string;
  startDate?: unknown;
  installment?: { number: number; total: number };
  balance?: unknown;
  appUrl: string;
}): EmailContent {
  const isFirstInstallment = p.installment && p.installment.number < p.installment.total;
  const balanceNote =
    isFirstInstallment && Number(p.balance) > 0
      ? `<p style="margin:0 0 14px">Your remaining balance of <b>${naira(p.balance)}</b> can be paid any time from your Payments page.</p>`
      : '';
  return {
    subject: `Payment received — you're enrolled in ${p.track}`,
    html: layout({
      heading: "Payment received — you're in!",
      body: `${hi(p.firstName)}<p style="margin:0 0 14px">Thank you. Your payment was successful and your enrollment is confirmed.</p>${details([
        ['Program', esc(p.track)],
        ['Cohort', esc(p.cohort)],
        ['Starts', p.startDate ? esc(lagosDate(p.startDate)) : ''],
        ['Amount paid', esc(naira(p.amount))],
        ['Payment', p.installment ? esc(`Installment ${p.installment.number} of ${p.installment.total}`) : 'Full payment'],
        ['Reference', esc(p.reference)],
      ])}${balanceNote}`,
      cta: { label: 'Go to my programs', url: `${p.appUrl}/learner/programs` },
      footnote: 'Keep this email as your receipt.',
    }),
  };
}

export function enrollmentStatusEmail(p: {
  firstName?: string;
  approved: boolean;
  track: string;
  cohort?: string;
  appUrl: string;
}): EmailContent {
  return p.approved
    ? {
        subject: `You're enrolled in ${p.track}`,
        html: layout({
          heading: 'Enrollment confirmed',
          body: `${hi(p.firstName)}<p style="margin:0 0 14px">Your enrollment in <b>${esc(p.track)}</b>${p.cohort ? ` (${esc(p.cohort)})` : ''} has been approved. You now have access to its sessions, assignments and materials.</p>`,
          cta: { label: 'Go to my programs', url: `${p.appUrl}/learner/programs` },
        }),
      }
    : {
        subject: `Update on your ${p.track} enrollment`,
        html: layout({
          heading: 'Enrollment not approved',
          body: `${hi(p.firstName)}<p style="margin:0 0 14px">Your enrollment in <b>${esc(p.track)}</b>${p.cohort ? ` (${esc(p.cohort)})` : ''} was not approved. If you think this is a mistake, please reply to this email or contact the QorePath team.</p>`,
        }),
      };
}

export function withdrawalReceivedEmail(p: {
  firstName?: string;
  track: string;
  amountPaid: unknown;
  suggestedRefund: unknown;
}): EmailContent {
  return {
    subject: `We received your withdrawal from ${p.track}`,
    html: layout({
      heading: 'Withdrawal received',
      body: `${hi(p.firstName)}<p style="margin:0 0 14px">You've been withdrawn from <b>${esc(p.track)}</b>. Any refund is reviewed by our team, and we'll email you once a decision is made.</p>${details([
        ['Amount paid', esc(naira(p.amountPaid))],
        ['Estimated refund', esc(naira(p.suggestedRefund))],
      ])}`,
      footnote: 'The estimate follows our refund policy; the final amount is confirmed by an administrator.',
    }),
  };
}

export function withdrawalResolvedEmail(p: {
  firstName?: string;
  track: string;
  approved: boolean;
  refund: unknown;
  note?: string;
}): EmailContent {
  const refunded = p.approved && Number(p.refund) > 0;
  return {
    subject: refunded ? `Your refund of ${naira(p.refund)} has been approved` : `Update on your ${p.track} withdrawal`,
    html: layout({
      heading: refunded ? 'Refund approved' : 'Withdrawal reviewed',
      body: `${hi(p.firstName)}${
        refunded
          ? `<p style="margin:0 0 14px">Your refund of <b>${esc(naira(p.refund))}</b> for <b>${esc(p.track)}</b> has been approved and sent back to the card or account you paid with. It usually shows up within 5–10 working days, depending on your bank.</p>`
          : `<p style="margin:0 0 14px">Your withdrawal from <b>${esc(p.track)}</b> has been reviewed. No refund applies in this case.</p>`
      }${p.note ? `<p style="margin:0 0 6px;color:#6b7280;font-size:13px">Note from the team:</p>${paragraphs(p.note)}` : ''}`,
    }),
  };
}

// ── Learning activity ────────────────────────────────────────────────────────

export function announcementEmail(p: {
  firstName?: string;
  title: string;
  body: string;
  author?: string;
  appUrl: string;
}): EmailContent {
  return {
    subject: `📣 ${p.title}`,
    html: layout({
      heading: p.title,
      body: `${hi(p.firstName)}${paragraphs(p.body)}${p.author ? `<p style="margin:0;color:#6b7280;font-size:13px">— ${esc(p.author)}</p>` : ''}`,
      cta: { label: 'Open QorePath', url: `${p.appUrl}/learner/dashboard` },
    }),
  };
}

export function sessionScheduledEmail(p: {
  firstName?: string;
  title: string;
  description?: string;
  track: string;
  scheduledAt: unknown;
  durationMinutes?: number;
  appUrl: string;
}): EmailContent {
  return {
    subject: `New session: ${p.title} — ${lagosDate(p.scheduledAt)}`,
    html: layout({
      heading: 'New live session scheduled',
      body: `${hi(p.firstName)}<p style="margin:0 0 14px">A new live session has been scheduled for <b>${esc(p.track)}</b>.</p>${details([
        ['Session', esc(p.title)],
        ['When', esc(lagosDateTime(p.scheduledAt))],
        ['Duration', p.durationMinutes ? esc(`${p.durationMinutes} minutes`) : ''],
      ])}${p.description ? paragraphs(p.description) : ''}`,
      cta: { label: 'View my sessions', url: `${p.appUrl}/learner/sessions` },
    }),
  };
}

export function submissionGradedEmail(p: {
  firstName?: string;
  assignment: string;
  score: unknown;
  maxScore?: number;
  feedback?: string;
  appUrl: string;
}): EmailContent {
  return {
    subject: `Graded: ${p.assignment}`,
    html: layout({
      heading: 'Your assignment has been graded',
      body: `${hi(p.firstName)}${details([
        ['Assignment', esc(p.assignment)],
        ['Score', esc(`${Number(p.score)}${p.maxScore ? ` / ${p.maxScore}` : ''}`)],
      ])}${p.feedback ? `<p style="margin:0 0 6px;color:#6b7280;font-size:13px">Feedback:</p>${paragraphs(p.feedback)}` : ''}`,
      cta: { label: 'View assignments', url: `${p.appUrl}/learner/assignments` },
    }),
  };
}

export function certificateIssuedEmail(p: {
  firstName?: string;
  cohort?: string;
  certificateNumber: string;
  issuedDate: unknown;
  appUrl: string;
}): EmailContent {
  const verifyUrl = `${p.appUrl}/public/verify/${encodeURIComponent(p.certificateNumber)}`;
  return {
    subject: 'Your QorePath certificate is ready 🎓',
    html: layout({
      heading: 'Congratulations — your certificate is ready!',
      body: `${hi(p.firstName)}<p style="margin:0 0 14px">Your certificate has been issued. Anyone, including employers, can verify it using the certificate number below.</p>${details([
        ['Cohort', esc(p.cohort)],
        ['Certificate no.', esc(p.certificateNumber)],
        ['Issued', esc(lagosDate(p.issuedDate))],
        ['Verify at', `<a href="${esc(verifyUrl)}" style="color:${ACCENT}">${esc(verifyUrl)}</a>`],
      ])}`,
      cta: { label: 'View my certificate', url: `${p.appUrl}/learner/certificate` },
    }),
  };
}

export function graduationDecisionEmail(p: {
  firstName?: string;
  track: string;
  status: 'approved' | 'held' | 'rejected';
  appUrl: string;
}): EmailContent {
  const copy = {
    approved: {
      subject: `You've graduated from ${p.track} 🎓`,
      heading: 'Congratulations, graduate!',
      text: `Your graduation from <b>${esc(p.track)}</b> has been approved. Your certificate will be issued shortly — we'll email you when it's ready.`,
    },
    held: {
      subject: `Your ${p.track} graduation is on hold`,
      heading: 'Graduation on hold',
      text: `Your graduation from <b>${esc(p.track)}</b> is on hold while a few outstanding items are completed. Your instructor or the QorePath team will be in touch about next steps.`,
    },
    rejected: {
      subject: `Update on your ${p.track} graduation`,
      heading: 'Graduation update',
      text: `Unfortunately your graduation from <b>${esc(p.track)}</b> was not approved this time. Please reach out to your instructor or the QorePath team to discuss your options.`,
    },
  }[p.status];
  return {
    subject: copy.subject,
    html: layout({
      heading: copy.heading,
      body: `${hi(p.firstName)}<p style="margin:0 0 14px">${copy.text}</p>`,
      cta: { label: 'View my progress', url: `${p.appUrl}/learner/progress` },
    }),
  };
}

// ── New cohort alerts ────────────────────────────────────────────────────────

export function programOpenEmail(p: {
  firstName?: string;
  track: string;
  cohort?: string;
  startDate?: unknown;
  price?: unknown;
  description?: string;
  appUrl: string;
}): EmailContent {
  return {
    subject: `Now enrolling: ${p.track}${p.cohort ? ` — ${p.cohort}` : ''}`,
    html: layout({
      heading: `Now enrolling: ${p.track}`,
      body: `${hi(p.firstName)}<p style="margin:0 0 14px">A new program is open for enrollment on QorePath. Seats are limited.</p>${details([
        ['Program', esc(p.track)],
        ['Cohort', esc(p.cohort)],
        ['Starts', p.startDate ? esc(lagosDate(p.startDate)) : ''],
        ['Price', Number(p.price) > 0 ? esc(naira(p.price)) : ''],
      ])}${p.description ? paragraphs(p.description) : ''}`,
      cta: { label: 'See programs', url: `${p.appUrl}/public/courses` },
    }),
  };
}
