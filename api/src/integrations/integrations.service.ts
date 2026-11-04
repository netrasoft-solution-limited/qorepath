import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Setting } from '../settings/setting.entity';

export interface PaystackKeys { secretKey: string; publicKey: string; source: 'dashboard' | 'server' }
export interface ResendConfig { apiKey: string; mailFrom: string; source: 'dashboard' | 'server' }
export interface PublitioConfig { apiKey: string; apiSecret: string; source: 'dashboard' | 'server' }
export type Provider = 'paystack' | 'resend' | 'publitio';

const PAYSTACK_KEY = 'integration.paystack';
const RESEND_KEY = 'integration.resend';
const PUBLITIO_KEY = 'integration.publitio';
const KEYS: Record<Provider, string> = { paystack: PAYSTACK_KEY, resend: RESEND_KEY, publitio: PUBLITIO_KEY };
const CACHE_MS = 60 * 1000;

interface Stored<T> { data: T; updatedAt: string; updatedBy: string }

const mask = (v?: string) => (v ? `${v.slice(0, 8)}…${v.slice(-4)}` : '');
const domainOf = (from: string) => (from.match(/@([^>\s]+)>?\s*$/)?.[1] ?? '').toLowerCase();

/**
 * Third-party credentials (Paystack, Resend, Publitio) that a super admin can manage from
 * the dashboard. Stored encrypted (AES-256-GCM) in the settings table; secrets are
 * never returned to the browser. Server env vars are the fallback.
 */
@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);
  private cache = new Map<string, { at: number; value: any }>();

  constructor(
    @InjectRepository(Setting) private repo: Repository<Setting>,
    private config: ConfigService,
  ) {}

  // ── Encryption ──────────────────────────────────────────────────────────────

  private get cipherKey(): Buffer {
    const secret = this.config.get<string>('CONFIG_ENCRYPTION_KEY') || this.config.getOrThrow<string>('JWT_SECRET');
    return crypto.createHash('sha256').update(secret).digest();
  }

  private encrypt(plain: string): string {
    const iv = crypto.randomBytes(12);
    const c = crypto.createCipheriv('aes-256-gcm', this.cipherKey, iv);
    const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
    return Buffer.concat([iv, c.getAuthTag(), enc]).toString('base64');
  }

  private decrypt(blob: string): string {
    const raw = Buffer.from(blob, 'base64');
    const d = crypto.createDecipheriv('aes-256-gcm', this.cipherKey, raw.subarray(0, 12));
    d.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString('utf8');
  }

  private async read<T>(key: string): Promise<Stored<T> | null> {
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
    const row = await this.repo.findOneBy({ key });
    let value: Stored<T> | null = null;
    if (row) {
      try {
        value = JSON.parse(this.decrypt(row.value));
      } catch {
        // Wrong/rotated encryption key: fall back to server env rather than break checkout.
        this.logger.error(`Could not decrypt ${key}; using server environment values instead`);
      }
    }
    this.cache.set(key, { at: Date.now(), value });
    return value;
  }

  private async write<T>(key: string, data: T, by: string) {
    const stored: Stored<T> = { data, updatedAt: new Date().toISOString(), updatedBy: by };
    await this.repo.save({ key, value: this.encrypt(JSON.stringify(stored)) });
    this.cache.delete(key);
  }

  async clear(provider: Provider) {
    const key = KEYS[provider];
    await this.repo.delete({ key });
    this.cache.delete(key);
  }

  // ── Current values (used by PaystackService / MailService) ─────────────────

  async paystack(): Promise<PaystackKeys> {
    const s = await this.read<{ secretKey: string; publicKey: string }>(PAYSTACK_KEY);
    if (s?.data.secretKey) return { ...s.data, source: 'dashboard' };
    return {
      secretKey: this.config.get<string>('PAYSTACK_SECRET_KEY') ?? '',
      publicKey: this.config.get<string>('PAYSTACK_PUBLIC_KEY') ?? '',
      source: 'server',
    };
  }

  async resend(): Promise<ResendConfig> {
    const s = await this.read<{ apiKey: string; mailFrom: string }>(RESEND_KEY);
    if (s?.data.apiKey) return { ...s.data, source: 'dashboard' };
    return {
      apiKey: this.config.get<string>('RESEND_API_KEY') ?? '',
      mailFrom: this.config.get<string>('MAIL_FROM') ?? '',
      source: 'server',
    };
  }

  async publitio(): Promise<PublitioConfig> {
    const s = await this.read<{ apiKey: string; apiSecret: string }>(PUBLITIO_KEY);
    if (s?.data.apiKey) return { ...s.data, source: 'dashboard' };
    return {
      apiKey: this.config.get<string>('PUBLITIO_API_KEY') ?? '',
      apiSecret: this.config.get<string>('PUBLITIO_API_SECRET') ?? '',
      source: 'server',
    };
  }

  /** Publitio's request signature: sha1(timestamp + nonce + secret), sent as query params. */
  static publitioAuth(apiKey: string, apiSecret: string) {
    const api_timestamp = Math.floor(Date.now() / 1000).toString();
    const api_nonce = crypto.randomInt(10_000_000, 100_000_000).toString();
    const api_signature = crypto.createHash('sha1').update(api_timestamp + api_nonce + apiSecret).digest('hex');
    return new URLSearchParams({ api_key: apiKey, api_timestamp, api_nonce, api_signature });
  }

  /** Masked overview for the admin screen — never includes a full secret. */
  async status() {
    const [p, r, f, ps, rs, fs] = await Promise.all([
      this.paystack(),
      this.resend(),
      this.publitio(),
      this.read<any>(PAYSTACK_KEY),
      this.read<any>(RESEND_KEY),
      this.read<any>(PUBLITIO_KEY),
    ]);
    return {
      paystack: {
        configured: !!p.secretKey,
        mode: p.secretKey.startsWith('sk_live_') ? 'live' : p.secretKey.startsWith('sk_test_') ? 'test' : 'unknown',
        secretKey: mask(p.secretKey),
        publicKey: p.publicKey,
        source: p.source,
        updatedAt: p.source === 'dashboard' ? ps?.updatedAt : null,
        updatedBy: p.source === 'dashboard' ? ps?.updatedBy : null,
      },
      resend: {
        configured: !!r.apiKey && !!r.mailFrom,
        apiKey: mask(r.apiKey),
        mailFrom: r.mailFrom,
        source: r.source,
        updatedAt: r.source === 'dashboard' ? rs?.updatedAt : null,
        updatedBy: r.source === 'dashboard' ? rs?.updatedBy : null,
      },
      publitio: {
        configured: !!f.apiKey && !!f.apiSecret,
        apiKey: mask(f.apiKey),
        source: f.source,
        updatedAt: f.source === 'dashboard' ? fs?.updatedAt : null,
        updatedBy: f.source === 'dashboard' ? fs?.updatedBy : null,
      },
    };
  }

  // ── Saving (validated against the provider first) ──────────────────────────

  async savePaystack(input: { secretKey?: string; publicKey?: string }, by: string) {
    const secretKey = input.secretKey?.trim() ?? '';
    const publicKey = input.publicKey?.trim() ?? '';
    const mode = /^sk_(test|live)_/.exec(secretKey)?.[1];
    if (!mode) throw new BadRequestException('Secret key must start with sk_test_ or sk_live_');
    if (!publicKey.startsWith(`pk_${mode}_`)) {
      throw new BadRequestException(`Public key must start with pk_${mode}_ to match the ${mode} secret key`);
    }
    let res: Response;
    try {
      res = await fetch('https://api.paystack.co/balance', { headers: { Authorization: `Bearer ${secretKey}` } });
    } catch {
      throw new BadRequestException('Could not reach Paystack to check the key. Try again in a moment.');
    }
    if (res.status === 401) throw new BadRequestException('Paystack rejected this secret key. Copy it again from Settings → API Keys & Webhooks.');
    if (!res.ok) throw new BadRequestException(`Paystack returned ${res.status} while checking the key`);
    await this.write(PAYSTACK_KEY, { secretKey, publicKey }, by);
    this.logger.log(`Paystack keys updated by ${by} (${mode} mode)`);
    return this.status();
  }

  async saveResend(input: { apiKey?: string; mailFrom?: string }, by: string) {
    const current = await this.resend();
    const apiKey = input.apiKey?.trim() || current.apiKey;
    const mailFrom = input.mailFrom?.trim() || current.mailFrom;
    if (!apiKey.startsWith('re_')) throw new BadRequestException('Resend API key must start with re_');
    const domain = domainOf(mailFrom);
    if (!domain) throw new BadRequestException('Sender must be an email address, e.g. NetraNova <noreply@yourdomain.com>');

    let res: Response;
    try {
      res = await fetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${apiKey}` } });
    } catch {
      throw new BadRequestException('Could not reach Resend to check the key. Try again in a moment.');
    }
    if (res.status === 401 || res.status === 403) throw new BadRequestException('Resend rejected this API key.');
    if (!res.ok) throw new BadRequestException(`Resend returned ${res.status} while checking the key`);
    const domains: { name: string; status: string }[] = ((await res.json()) as any)?.data ?? [];
    const match = domains.find((d) => d.name.toLowerCase() === domain);
    if (!match) {
      const list = domains.map((d) => d.name).join(', ') || 'none';
      throw new BadRequestException(`${domain} is not a domain in this Resend account (verified domains: ${list})`);
    }
    if (match.status !== 'verified') throw new BadRequestException(`${domain} is not verified in Resend yet (status: ${match.status})`);

    await this.write(RESEND_KEY, { apiKey, mailFrom }, by);
    this.logger.log(`Resend settings updated by ${by} (sender ${mailFrom})`);
    return this.status();
  }

  async savePublitio(input: { apiKey?: string; apiSecret?: string }, by: string) {
    const apiKey = input.apiKey?.trim() ?? '';
    const apiSecret = input.apiSecret?.trim() ?? '';
    if (!apiKey || !apiSecret) throw new BadRequestException('Enter both the Publitio API key and API secret');
    let res: Response;
    try {
      res = await fetch(`https://api.publit.io/v1/files/list?limit=1&${IntegrationsService.publitioAuth(apiKey, apiSecret)}`);
    } catch {
      throw new BadRequestException('Could not reach Publitio to check the keys. Try again in a moment.');
    }
    const body: any = await res.json().catch(() => null);
    if (!res.ok || body?.success === false) {
      throw new BadRequestException(
        res.status === 401 || res.status === 403 || body?.code === 401
          ? 'Publitio rejected these keys. Copy the API key and secret again from Publitio → Settings → API.'
          : `Publitio returned ${body?.error?.message ?? body?.message ?? res.status} while checking the keys`,
      );
    }
    await this.write(PUBLITIO_KEY, { apiKey, apiSecret }, by);
    this.logger.log(`Publitio keys updated by ${by}`);
    return this.status();
  }
}
