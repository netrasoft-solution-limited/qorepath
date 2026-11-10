import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './setting.entity';

export interface RefundPolicy {
  // Refund 100% if the learner withdraws before the cohort starts.
  fullRefundBeforeStart: boolean;
  // Days after cohort start during which a partial refund applies.
  graceDays: number;
  // Percent refunded within the grace window.
  gracePercent: number;
  // Percent refunded after the grace window.
  afterPercent: number;
}

export interface CohortRules {
  // Seats given to a new track when none is entered.
  defaultMaxLearners: number;
  // A learner must finish their current program before paying for another.
  oneProgramAtATime: boolean;
  // Days after a cohort starts that learners can still enroll; null = until the cohort ends.
  lateEnrollmentDays: number | null;
}

export interface PaymentPlan {
  allowInstallments: boolean;
  // Share of the price paid at checkout; the rest becomes a balance.
  firstInstallmentPercent: number;
  // Email a reminder about an unpaid balance every N days after the first payment, at most maxReminders times.
  reminderEveryDays: number;
  maxReminders: number;
}

export interface EmailSetting { enabled: boolean; note: string }
export type EmailSettings = Record<string, EmailSetting>;

export const SOCIALS = ['instagram', 'x', 'linkedin', 'facebook', 'youtube', 'tiktok'] as const;
export interface SiteInfo {
  contactEmail: string; // where contact-form messages go, and shown on the Contact page
  contactName: string; // the person visitors speak to, shown with the phone number
  phone: string;
  whatsapp: string;
  address: string;
  hours: string;
  socials: Partial<Record<(typeof SOCIALS)[number], string>>;
  termsText: string;
  privacyText: string;
}
export const EMPTY_SITE_INFO: SiteInfo = { contactEmail: '', contactName: '', phone: '', whatsapp: '', address: '', hours: '', socials: {}, termsText: '', privacyText: '' };
const SITE_INFO_KEY = 'site_info';
const MAX_LEGAL = 50_000;

const REFUND_POLICY_KEY = 'refund_policy';
const COHORT_RULES_KEY = 'cohort_rules';
const PAYMENT_PLAN_KEY = 'payment_plan';
const EMAIL_SETTINGS_KEY = 'email_settings';

export const DEFAULT_COHORT_RULES: CohortRules = { defaultMaxLearners: 30, oneProgramAtATime: true, lateEnrollmentDays: null };
export const DEFAULT_PAYMENT_PLAN: PaymentPlan = { allowInstallments: true, firstInstallmentPercent: 50, reminderEveryDays: 7, maxReminders: 4 };

const DEFAULT_REFUND_POLICY: RefundPolicy = {
  fullRefundBeforeStart: true,
  graceDays: 7,
  gracePercent: 50,
  afterPercent: 0,
};

@Injectable()
export class SettingsService {
  constructor(@InjectRepository(Setting) private repo: Repository<Setting>) {}

  async get<T>(key: string, fallback: T): Promise<T> {
    const row = await this.repo.findOneBy({ key });
    if (!row) return fallback;
    try {
      return JSON.parse(row.value) as T;
    } catch {
      return fallback;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.repo.save({ key, value: JSON.stringify(value) });
  }

  getRefundPolicy(): Promise<RefundPolicy> {
    return this.get<RefundPolicy>(REFUND_POLICY_KEY, DEFAULT_REFUND_POLICY);
  }

  async setRefundPolicy(patch: Partial<RefundPolicy>): Promise<RefundPolicy> {
    const current = await this.getRefundPolicy();
    const next: RefundPolicy = {
      fullRefundBeforeStart: patch.fullRefundBeforeStart ?? current.fullRefundBeforeStart,
      graceDays: clampNum(patch.graceDays, current.graceDays, 0, 365),
      gracePercent: clampNum(patch.gracePercent, current.gracePercent, 0, 100),
      afterPercent: clampNum(patch.afterPercent, current.afterPercent, 0, 100),
    };
    await this.set(REFUND_POLICY_KEY, next);
    return next;
  }

  async getCohortRules(): Promise<CohortRules> {
    return { ...DEFAULT_COHORT_RULES, ...(await this.get<Partial<CohortRules>>(COHORT_RULES_KEY, {})) };
  }

  async setCohortRules(patch: Partial<CohortRules>): Promise<CohortRules> {
    const current = await this.getCohortRules();
    const late = patch.lateEnrollmentDays === undefined ? current.lateEnrollmentDays
      : patch.lateEnrollmentDays === null || (patch.lateEnrollmentDays as any) === '' ? null
      : clampNum(patch.lateEnrollmentDays, 0, 0, 365);
    const next: CohortRules = {
      defaultMaxLearners: Math.round(clampNum(patch.defaultMaxLearners, current.defaultMaxLearners, 1, 1000)),
      oneProgramAtATime: typeof patch.oneProgramAtATime === 'boolean' ? patch.oneProgramAtATime : current.oneProgramAtATime,
      lateEnrollmentDays: late === null ? null : Math.round(late),
    };
    await this.set(COHORT_RULES_KEY, next);
    return next;
  }

  async getPaymentPlan(): Promise<PaymentPlan> {
    return { ...DEFAULT_PAYMENT_PLAN, ...(await this.get<Partial<PaymentPlan>>(PAYMENT_PLAN_KEY, {})) };
  }

  async setPaymentPlan(patch: Partial<PaymentPlan>): Promise<PaymentPlan> {
    const current = await this.getPaymentPlan();
    const next: PaymentPlan = {
      allowInstallments: typeof patch.allowInstallments === 'boolean' ? patch.allowInstallments : current.allowInstallments,
      firstInstallmentPercent: Math.round(clampNum(patch.firstInstallmentPercent, current.firstInstallmentPercent, 10, 90)),
      reminderEveryDays: Math.round(clampNum(patch.reminderEveryDays, current.reminderEveryDays, 1, 60)),
      maxReminders: Math.round(clampNum(patch.maxReminders, current.maxReminders, 0, 20)),
    };
    await this.set(PAYMENT_PLAN_KEY, next);
    return next;
  }

  async getSiteInfo(): Promise<SiteInfo> {
    const saved = await this.get<Partial<SiteInfo>>(SITE_INFO_KEY, {});
    return { ...EMPTY_SITE_INFO, ...saved, socials: { ...(saved.socials ?? {}) } };
  }

  async setSiteInfo(patch: Partial<SiteInfo>): Promise<SiteInfo> {
    const next = await this.getSiteInfo();
    const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined);
    for (const [k, max] of [['contactName', 120], ['phone', 40], ['whatsapp', 40], ['address', 300], ['hours', 120], ['termsText', MAX_LEGAL], ['privacyText', MAX_LEGAL]] as const) {
      const v = text(patch[k], max);
      if (v !== undefined) next[k] = v;
    }
    const email = text(patch.contactEmail, 200);
    if (email !== undefined) {
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException('Contact email must be a valid email address');
      next.contactEmail = email;
    }
    if (patch.socials && typeof patch.socials === 'object') {
      for (const k of SOCIALS) {
        const v = text((patch.socials as any)[k], 300);
        if (v === undefined) continue;
        if (v && !/^https:\/\/[^\s]+$/.test(v)) throw new BadRequestException(`The ${k === 'x' ? 'X' : k} link must start with https://`);
        if (v) next.socials[k] = v; else delete next.socials[k];
      }
    }
    await this.set(SITE_INFO_KEY, next);
    return next;
  }

  /** Saved per-email settings; emails with no entry are on with no note. */
  getEmailSettings(): Promise<EmailSettings> {
    return this.get<EmailSettings>(EMAIL_SETTINGS_KEY, {});
  }

  async setEmailSetting(key: string, patch: Partial<EmailSetting>, locked: boolean): Promise<EmailSettings> {
    const all = await this.getEmailSettings();
    const current = all[key] ?? { enabled: true, note: '' };
    const note = typeof patch.note === 'string' ? patch.note.trim().slice(0, MAX_EMAIL_NOTE) : current.note;
    const enabled = locked ? true : typeof patch.enabled === 'boolean' ? patch.enabled : current.enabled;
    all[key] = { enabled, note };
    await this.set(EMAIL_SETTINGS_KEY, all);
    return all;
  }
}

export const MAX_EMAIL_NOTE = 1000;

function clampNum(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
