import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { IntegrationsService } from '../integrations/integrations.service';

export type UploadedFileLike = { originalname: string; mimetype: string; size: number; buffer: Buffer };
export interface StoredFile { url: string; id: string }

/**
 * Files and images go to Publitio when it's set up in Settings → Integrations.
 * `upload` returns null when it isn't, so callers can fall back (e.g. keep the bytes in the database).
 * Everything uploaded is public: certificates are verifiable by anyone and photos are shown in the portal.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private integrations: IntegrationsService) {}

  async enabled() {
    const c = await this.integrations.publitio();
    return !!c.apiKey && !!c.apiSecret;
  }

  async upload(file: UploadedFileLike, title: string): Promise<StoredFile | null> {
    const c = await this.integrations.publitio();
    if (!c.apiKey || !c.apiSecret) return null;
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), file.originalname);
    form.append('title', title);
    form.append('privacy', '1');
    form.append('option_download', '1');
    let body: any;
    try {
      const res = await fetch(`https://api.publit.io/v1/files/create?${IntegrationsService.publitioAuth(c.apiKey, c.apiSecret)}`, { method: 'POST', body: form });
      body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) throw new Error(body?.error?.message ?? body?.message ?? `HTTP ${res.status}`);
    } catch (err: any) {
      this.logger.error(`Publitio upload failed: ${err.message}`);
      throw new BadRequestException(`The file couldn't be uploaded to Publitio (${err.message}). Try again, or check the keys in Settings → Integrations.`);
    }
    return { url: body.url_preview, id: body.id };
  }

  /** Best effort: a file left behind on Publitio is harmless, so failures are only logged. */
  async remove(id?: string | null) {
    if (!id) return;
    try {
      const c = await this.integrations.publitio();
      if (!c.apiKey) return;
      const res = await fetch(`https://api.publit.io/v1/files/delete/${encodeURIComponent(id)}?${IntegrationsService.publitioAuth(c.apiKey, c.apiSecret)}`, { method: 'DELETE' });
      const body: any = await res.json().catch(() => null);
      if (!res.ok || !body?.success) this.logger.warn(`Publitio delete of ${id} failed: ${res.status} ${JSON.stringify(body)}`);
      else this.logger.log(`Deleted ${id} from Publitio`);
    } catch (err: any) {
      this.logger.warn(`Publitio delete of ${id} failed: ${err.message}`);
    }
  }
}
