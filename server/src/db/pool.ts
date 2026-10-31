import { Pool } from 'pg';

import type { AppConfig } from '../config.js';

export function createPool(config: Pick<AppConfig, 'databaseUrl' | 'databaseSsl' | 'databasePoolMax'>): Pool {
  return new Pool({
    connectionString: config.databaseUrl,
    max: config.databasePoolMax,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 15_000,
    application_name: 'astrotalk-api',
    ssl: config.databaseSsl ? { rejectUnauthorized: true } : undefined,
  });
}
