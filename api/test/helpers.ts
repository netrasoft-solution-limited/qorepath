import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Client } from 'pg';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User, UserRole } from '../src/users/user.entity';

export const PASSWORD = 'Test-Password-2026!';

/** Empties the test database so every test file starts from a fresh, fully migrated schema. */
async function resetDatabase() {
  const c = new Client({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: 'postgres',
  });
  await c.connect();
  const exists = await c.query('SELECT 1 FROM pg_database WHERE datname = $1', [process.env.DB_NAME]);
  if (!exists.rowCount) await c.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
  await c.end();
  const db = new Client({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });
  await db.connect();
  await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await db.end();
}

export interface TestApp {
  app: INestApplication;
  ds: DataSource;
  http: () => ReturnType<typeof request>;
  superToken: string;
  close: () => Promise<void>;
}

/** Boots the real API (same prefix and validation as main.ts) on a fresh database, with one super admin. */
export async function bootApp(): Promise<TestApp> {
  await resetDatabase();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication({ rawBody: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  const ds = app.get(DataSource);
  await ds.getRepository(User).save({
    firstName: 'Super', lastName: 'Admin', email: 'super@example.com',
    password: await bcrypt.hash(PASSWORD, 10), role: UserRole.ADMIN, isSuperAdmin: true,
  });
  const http = () => request(app.getHttpServer());
  const superToken = await login(http, 'super@example.com');
  return { app, ds, http, superToken, close: () => app.close() };
}

export async function login(http: TestApp['http'], email: string, password = PASSWORD): Promise<string> {
  const res = await http().post('/api/auth/login').send({ email, password });
  if (!res.body.accessToken) throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.accessToken;
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

/** Small fixtures built through the real API, the way an admin would. */
export function fixtures(t: TestApp) {
  const as = (token: string) => ({
    get: (url: string) => t.http().get(`/api${url}`).set(bearer(token)),
    post: (url: string, body?: any) => t.http().post(`/api${url}`).set(bearer(token)).send(body),
    patch: (url: string, body?: any) => t.http().patch(`/api${url}`).set(bearer(token)).send(body),
    delete: (url: string) => t.http().delete(`/api${url}`).set(bearer(token)),
  });
  const sup = as(t.superToken);

  return {
    as,
    sup,
    async staff(tag: string, role: 'instructor' | 'assistant' | 'admin', permissions?: string[]) {
      const user = (await sup.post('/users', { firstName: tag, lastName: 'Test', email: `${tag}@example.com`, password: PASSWORD, role })).body;
      if (permissions) await sup.patch(`/users/${user.id}`, { permissions });
      return { ...user, token: await login(t.http, `${tag}@example.com`) };
    },
    async learner(tag: string) {
      await t.http().post('/api/auth/register').send({ firstName: tag, lastName: 'Test', email: `${tag}@example.com`, password: PASSWORD });
      const token = await login(t.http, `${tag}@example.com`);
      const me = (await as(token).get('/auth/me')).body;
      return { ...me, token };
    },
    async cohort(name: string, opts: { startDaysFromNow?: number; endDaysFromNow?: number; status?: string } = {}) {
      const day = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
      return (await sup.post('/cohorts', {
        name, startDate: day(opts.startDaysFromNow ?? 7), endDate: day(opts.endDaysFromNow ?? 90), status: opts.status ?? 'upcoming',
      })).body;
    },
    async program(cohortId: string, track: string, extra: Record<string, unknown> = {}) {
      return (await sup.post('/programs', { track, description: track, price: 1000, cohortId, ...extra })).body;
    },
    async enroll(learnerId: string, programId: string) {
      return (await sup.post('/enrollments', { learner: { id: learnerId }, program: { id: programId }, status: 'approved' })).body;
    },
  };
}
