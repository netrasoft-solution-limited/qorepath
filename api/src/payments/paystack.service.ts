import { Injectable, BadGatewayException, Logger } from '@nestjs/common';
import { IntegrationsService } from '../integrations/integrations.service';
import * as crypto from 'crypto';

const PAYSTACK_BASE = 'https://api.paystack.co';

export interface InitializeResult {
  reference: string;
  accessCode: string;
  authorizationUrl: string;
}

export interface VerifyResult {
  status: string; // 'success' | 'failed' | 'abandoned' | ...
  reference: string;
  amount: number; // in kobo
  currency: string;
  metadata: Record<string, any> | null;
  paidAt: string | null;
}

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);

  // Keys come from IntegrationsService (dashboard-managed, else server env) on every call,
  // so a super admin's change takes effect without a redeploy.
  constructor(private integrations: IntegrationsService) {}

  private async secretKey(): Promise<string> {
    const { secretKey } = await this.integrations.paystack();
    if (!secretKey) throw new BadGatewayException('Payments are not configured yet');
    return secretKey;
  }

  async getPublicKey(): Promise<string> {
    return (await this.integrations.paystack()).publicKey;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const secretKey = await this.secretKey();
    let res: Response;
    try {
      res = await fetch(`${PAYSTACK_BASE}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
          ...(init?.headers ?? {}),
        },
      });
    } catch (err) {
      this.logger.error(`Paystack request to ${path} failed`, err as Error);
      throw new BadGatewayException('Could not reach payment provider');
    }

    const body = (await res.json().catch(() => null)) as
      | { status: boolean; message: string; data: T }
      | null;

    if (!res.ok || !body?.status) {
      this.logger.error(`Paystack ${path} -> ${res.status}: ${body?.message}`);
      throw new BadGatewayException(body?.message ?? 'Payment provider error');
    }
    return body.data;
  }

  /** Amount must already be in the smallest currency unit (kobo for NGN). */
  async initialize(params: {
    email: string;
    amount: number; // kobo
    reference: string;
    metadata: Record<string, any>;
    callbackUrl?: string;
  }): Promise<InitializeResult> {
    const data = await this.request<{
      reference: string;
      access_code: string;
      authorization_url: string;
    }>('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify({
        email: params.email,
        amount: params.amount,
        reference: params.reference,
        metadata: params.metadata,
        callback_url: params.callbackUrl,
      }),
    });

    return {
      reference: data.reference,
      accessCode: data.access_code,
      authorizationUrl: data.authorization_url,
    };
  }

  async verify(reference: string): Promise<VerifyResult> {
    const data = await this.request<{
      status: string;
      reference: string;
      amount: number;
      currency: string;
      metadata: Record<string, any> | null;
      paid_at: string | null;
    }>(`/transaction/verify/${encodeURIComponent(reference)}`);

    return {
      status: data.status,
      reference: data.reference,
      amount: data.amount,
      currency: data.currency,
      metadata: data.metadata,
      paidAt: data.paid_at,
    };
  }

  /**
   * Refunds a transaction by reference. Omit amount for a full refund;
   * pass kobo for a partial refund.
   */
  async refund(reference: string, amountKobo?: number): Promise<{ status: string }> {
    const data = await this.request<{ status: string }>('/refund', {
      method: 'POST',
      body: JSON.stringify({
        transaction: reference,
        ...(amountKobo != null ? { amount: amountKobo } : {}),
      }),
    });
    return { status: data.status };
  }

  /** Validates the x-paystack-signature header against the raw request body. */
  async verifySignature(rawBody: Buffer | string, signature?: string): Promise<boolean> {
    if (!signature) return false;
    const { secretKey } = await this.integrations.paystack();
    if (!secretKey) return false;
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(rawBody)
      .digest('hex');
    // timing-safe compare
    const a = Buffer.from(hash);
    const b = Buffer.from(signature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
}
