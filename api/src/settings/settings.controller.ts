import { Controller, Get, Patch, Post, Body, Param, UseGuards, Request, HttpCode, BadRequestException, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService, RefundPolicy, CohortRules, PaymentPlan, EmailSetting, SiteInfo } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RequirePermission } from '../auth/permissions';
import { UserRole } from '../users/user.entity';
import { Audit } from '../audit/audit.decorator';
import { MailService } from '../mail/mail.service';
import { EMAIL_CATALOG, emailKind } from '../mail/email-catalog';
import { withNote, contactMessageEmail } from '../mail/mail.templates';
import { clientIp } from '../audit/audit.interceptor';

// Logs the values actually saved (out-of-range input is clamped), for the fields that were sent.
const SITE_LABELS: Record<string, string> = {
  contactEmail: 'contact email', phone: 'phone', whatsapp: 'WhatsApp', address: 'address', hours: 'opening hours',
  socials: 'social links', termsText: 'Terms of Service', privacyText: 'Privacy Policy',
};

// Contact form limits: per visitor (IP) and for the whole site, to keep spam off the email quota.
const PER_IP = { max: 3, windowMs: 10 * 60 * 1000 };
const PER_DAY = 50;
const recent = new Map<string, number[]>();
let today = { day: '', count: 0 };

const changes = (body: any, saved?: any) =>
  Object.keys(body ?? {}).map((k) => `${k} = ${JSON.stringify(saved && k in saved ? saved[k] : body[k])}`).join(', ');

@Controller('settings')
export class SettingsController {
  constructor(private settings: SettingsService, private mail: MailService, private config: ConfigService) {}

  // Public: the pricing page shows learners the refund terms before they pay.
  @Get('refund-policy')
  getRefundPolicy() {
    return this.settings.getRefundPolicy();
  }

  // Public: checkout shows whether instalments are offered and how the price is split.
  @Get('enrollment-rules')
  async getEnrollmentRules() {
    const [cohortRules, paymentPlan] = await Promise.all([this.settings.getCohortRules(), this.settings.getPaymentPlan()]);
    return { cohortRules, paymentPlan };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('settings')
  @Audit({ action: 'SETTINGS_CHANGED', entity: 'Setting', summary: ({ body, result }) => `Changed refund policy: ${changes(body, result)}` })
  @Patch('refund-policy')
  setRefundPolicy(@Body() body: Partial<RefundPolicy>) {
    return this.settings.setRefundPolicy(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('settings')
  @Audit({ action: 'SETTINGS_CHANGED', entity: 'Setting', summary: ({ body, result }) => `Changed cohort rules: ${changes(body, result)}` })
  @Patch('cohort-rules')
  setCohortRules(@Body() body: Partial<CohortRules>) {
    return this.settings.setCohortRules(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('settings')
  @Audit({ action: 'SETTINGS_CHANGED', entity: 'Setting', summary: ({ body, result }) => `Changed instalment plan: ${changes(body, result)}` })
  @Patch('payment-plan')
  setPaymentPlan(@Body() body: Partial<PaymentPlan>) {
    return this.settings.setPaymentPlan(body);
  }

  // ── Notification templates ───────────────────────────────────────────────────

  private async templates() {
    const saved = await this.settings.getEmailSettings();
    return EMAIL_CATALOG.map(({ sample, ...k }) => ({
      ...k,
      locked: !!k.locked,
      enabled: k.locked ? true : saved[k.key]?.enabled ?? true,
      note: saved[k.key]?.note ?? '',
      subject: sample(this.appUrl).subject,
    }));
  }

  private get appUrl() {
    return (this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173').replace(/\/$/, '');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('settings')
  @Get('email-templates')
  getEmailTemplates() {
    return this.templates();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('settings')
  @Audit({
    action: 'EMAIL_TEMPLATE_CHANGED', entity: 'Setting',
    summary: ({ params, body }) => {
      const name = emailKind(params.key)?.name ?? params.key;
      const parts = [
        typeof body?.enabled === 'boolean' && (body.enabled ? 'switched on' : 'switched off'),
        typeof body?.note === 'string' && (body.note.trim() ? 'updated its note' : 'removed its note'),
      ].filter(Boolean);
      return `"${name}" email: ${parts.join(', ') || 'saved'}`;
    },
  })
  @Patch('email-templates/:key')
  async setEmailTemplate(@Param('key') key: string, @Body() body: Partial<EmailSetting>) {
    const kind = emailKind(key);
    if (!kind) throw new NotFoundException('Unknown email');
    if (kind.locked && body?.enabled === false) throw new BadRequestException(`The "${kind.name}" email can't be switched off`);
    await this.settings.setEmailSetting(key, body ?? {}, !!kind.locked);
    return this.templates();
  }

  /** Sends the email with sample data (and the note being edited) to the signed-in admin. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('settings')
  @Post('email-templates/:key/preview')
  @HttpCode(200)
  async previewEmailTemplate(@Param('key') key: string, @Body('note') note: string | undefined, @Request() req: any) {
    const kind = emailKind(key);
    if (!kind) throw new NotFoundException('Unknown email');
    const saved = (await this.settings.getEmailSettings())[key];
    const content = withNote(kind.sample(this.appUrl), note ?? saved?.note);
    const result = await this.mail.sendOne({ to: req.user.email, subject: `[Preview] ${content.subject}`, html: content.html });
    if (!result.ok) throw new BadRequestException(result.error ?? 'The preview could not be sent');
    return { sent: true, to: req.user.email };
  }

  // ── Site & contact ───────────────────────────────────────────────────────────

  // Public: the Contact, Terms and Privacy pages and the footer read this.
  @Get('site')
  async getSite() {
    const info = await this.settings.getSiteInfo();
    return { ...info, acceptsMessages: !!info.contactEmail };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('settings')
  @Audit({
    action: 'SETTINGS_CHANGED', entity: 'Setting',
    summary: ({ body }) => `Updated site & contact details: ${Object.keys(body ?? {}).map((k) => SITE_LABELS[k] ?? k).join(', ')}`,
  })
  @Patch('site')
  setSite(@Body() body: Partial<SiteInfo>) {
    return this.settings.setSiteInfo(body ?? {});
  }

  /** Public contact form → emails the contact address, with Reply-To set to the visitor. */
  @Post('contact')
  @HttpCode(200)
  async contact(@Body() body: any, @Request() req: any) {
    // Honeypot: real visitors never fill the hidden "website" field. Pretend it worked.
    if (body?.website) return { sent: true };
    const name = String(body?.name ?? '').trim().slice(0, 100);
    const email = String(body?.email ?? '').trim().slice(0, 200);
    const phone = String(body?.phone ?? '').trim().slice(0, 40);
    const topic = String(body?.topic ?? '').trim().slice(0, 60);
    const message = String(body?.message ?? '').trim().slice(0, 5000);
    if (!name || !message) throw new BadRequestException('Please enter your name and a message');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException('Please enter a valid email address so we can reply');

    const { contactEmail } = await this.settings.getSiteInfo();
    if (!contactEmail) throw new BadRequestException("The contact form isn't set up yet. Please try again later.");

    const ip = clientIp(req) ?? 'unknown';
    const now = Date.now();
    const mine = (recent.get(ip) ?? []).filter((t) => now - t < PER_IP.windowMs);
    const day = new Date().toISOString().slice(0, 10);
    if (today.day !== day) today = { day, count: 0 };
    if (mine.length >= PER_IP.max || today.count >= PER_DAY) {
      throw new HttpException('Too many messages — please wait a few minutes and try again.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const content = contactMessageEmail({ name, email, phone, topic, message });
    const result = await this.mail.sendOne({ to: contactEmail, replyTo: email, ...content });
    if (!result.ok) throw new BadRequestException("Your message couldn't be sent right now. Please try again later.");
    if (recent.size > 5000) recent.clear();
    recent.set(ip, [...mine, now]);
    today.count++;
    return { sent: true };
  }
}
