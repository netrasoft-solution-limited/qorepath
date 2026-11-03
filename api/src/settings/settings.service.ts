import { Injectable } from '@nestjs/common';
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

const REFUND_POLICY_KEY = 'refund_policy';

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
}

function clampNum(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
