import { join } from 'path';
import { DataSourceOptions } from 'typeorm';

/**
 * One database config for the app and the migration CLI.
 *
 * The schema is never changed automatically (synchronize is off). Changes ship as
 * migrations in src/migrations, which run on startup before the API serves traffic:
 *   1. edit an entity
 *   2. npm run migration:generate --name=DescribeTheChange   (against a dev database)
 *   3. read the generated SQL, commit it, deploy
 */
export function databaseOptions(env: Record<string, string | undefined>): DataSourceOptions {
  return {
    type: 'postgres',
    // DATABASE_URL (e.g. from Neon) takes precedence over the individual DB_* settings.
    url: env.DATABASE_URL,
    ssl: env.DB_SSL === 'true' || !!env.DATABASE_URL,
    host: env.DB_HOST,
    port: env.DB_PORT ? Number(env.DB_PORT) : undefined,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    // Compiled files only: the app and the CLI both run from dist/.
    entities: [join(__dirname, '**', '*.entity.js')],
    migrations: [join(__dirname, 'migrations', '*.js')],
    migrationsTableName: 'migrations',
    // Each migration in its own transaction, so a failing one leaves the database as it was.
    migrationsTransactionMode: 'each',
    synchronize: false,
  };
}
