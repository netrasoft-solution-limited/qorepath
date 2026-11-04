import { generateKeyPairSync } from 'crypto';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// Runs before every test file. The API reads api/.env (production database, real Resend key…),
// so blank everything external and point the app at a throwaway local/CI database only.
const host = process.env.TEST_DB_HOST ?? 'localhost';
if (!['localhost', '127.0.0.1', 'postgres'].includes(host)) {
  throw new Error(`Refusing to run tests against ${host}: TEST_DB_HOST must be a local or CI database`);
}

Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: '',
  DB_HOST: host,
  DB_PORT: process.env.TEST_DB_PORT ?? '5432',
  DB_USERNAME: process.env.TEST_DB_USER ?? 'postgres',
  DB_PASSWORD: process.env.TEST_DB_PASSWORD ?? 'postgres',
  DB_NAME: process.env.TEST_DB_NAME ?? 'netranova_test',
  DB_SSL: 'false',
  JWT_SECRET: 'test-jwt-secret',
  CONFIG_ENCRYPTION_KEY: 'test-encryption-key',
  FRONTEND_URL: 'http://localhost:5173',
  RESEND_API_KEY: '',
  MAIL_FROM: '',
  PAYSTACK_SECRET_KEY: '',
  PAYSTACK_PUBLIC_KEY: '',
  PUBLITIO_API_KEY: '',
  PUBLITIO_API_SECRET: '',
  JAAS_WEBHOOK_SECRET: 'test-webhook-secret',
  DISABLE_REMINDERS: 'true',
  JAAS_APP_ID: 'vpaas-magic-cookie-test',
  JAAS_KID: 'vpaas-magic-cookie-test/kid',
  JAAS_PRIVATE_KEY_PATH: jaasKey(),
});

// A throwaway key so the 8x8 JaaS service can start (it reads its key file at boot).
function jaasKey() {
  const path = join(tmpdir(), 'netranova-test-jaas.pem');
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  writeFileSync(path, privateKey.export({ type: 'pkcs8', format: 'pem' }));
  return path;
}
