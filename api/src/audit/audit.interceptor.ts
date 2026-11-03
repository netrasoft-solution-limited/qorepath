import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { from, Observable } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { AUDIT_KEY, AuditContext, AuditOptions } from './audit.decorator';
import { AuditService } from './audit.service';

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

// Writes an audit entry after any @Audit()-decorated handler succeeds. Failed or
// refused requests are not logged; the entry is written without delaying the response.
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private reflector: Reflector, private audit: AuditService, private dataSource: DataSource) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const opts = this.reflector.get<AuditOptions>(AUDIT_KEY, context.getHandler());
    if (!opts) return next.handle();

    const req = context.switchToHttp().getRequest();
    const id: string | undefined = req.params?.id;
    const load = (rowId = id) =>
      opts.load && rowId
        ? this.dataSource.getRepository(opts.load as any).findOne({ where: { id: rowId } }).catch(() => null)
        : Promise.resolve(null);

    return from(load()).pipe(
      mergeMap((before) =>
        next.handle().pipe(
          tap((result) => {
            this.write(opts, req, before, result, load).catch((err) =>
              this.logger.error(`Audit ${opts.action} failed`, err as Error),
            );
          }),
        ),
      ),
    );
  }

  private async write(opts: AuditOptions, req: any, before: any, result: any, load: (rowId?: string) => Promise<any>) {
    // Re-read the row afterwards: handlers may return an UpdateResult, or a freshly
    // created row without its relations (e.g. a certificate without the learner's name).
    const rowId = req.params?.id ?? result?.id;
    const after = opts.load && rowId ? await load(rowId) : null;
    const ctx: AuditContext = { params: req.params ?? {}, body: req.body ?? {}, result, before, after, user: req.user };
    if (opts.when && !opts.when(ctx)) return;

    let changes: Record<string, [unknown, unknown]> | null = null;
    if (opts.track && before && after) {
      changes = {};
      for (const f of opts.track) {
        if (!same(before[f], after[f])) changes[f] = [before[f] ?? null, after[f] ?? null];
      }
      if (opts.skipIfUnchanged && !Object.keys(changes).length) return;
    }

    let summary: string;
    try {
      summary = opts.summary(ctx);
    } catch {
      summary = `${opts.action} ${opts.entity}`;
    }
    let action = opts.action;
    try {
      action = opts.actionFor?.(ctx) ?? opts.action;
    } catch {}
    await this.audit.record({
      actor: req.user,
      action,
      entity: opts.entity,
      entityId: req.params?.id ?? result?.id ?? null,
      summary,
      changes,
      ip: clientIp(req),
    });
  }
}

/** Render sits behind Cloudflare, which sets the real client address in its own headers. */
export function clientIp(req: any): string | null {
  const h = req.headers ?? {};
  const fwd = h['x-forwarded-for'];
  const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim();
  return h['cf-connecting-ip'] || h['true-client-ip'] || first || req.ip || null;
}
