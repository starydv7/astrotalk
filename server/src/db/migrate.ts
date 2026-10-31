import 'dotenv/config';

import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

import type { PoolClient } from 'pg';

import { loadDatabaseConfig } from '../config.js';
import { createPool } from './pool.js';
import { initialMigration } from './migrations/001_initial.js';

const migrations = [initialMigration] as const;
const MIGRATION_LOCK_ID = 1_493_819_527;

async function migrate(): Promise<void> {
  const pool = createPool(loadDatabaseConfig());
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_ID]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        checksum CHAR(64) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    for (const migration of migrations) {
      await applyMigration(client, migration.name, migration.sql);
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_ID]).catch(() => undefined);
    client.release();
    await pool.end();
  }
}

async function applyMigration(client: PoolClient, name: string, sql: string): Promise<void> {
  const checksum = createHash('sha256').update(sql).digest('hex');
  const existing = await client.query<{ checksum: string }>('SELECT checksum FROM schema_migrations WHERE name = $1', [name]);
  if (existing.rowCount === 1) {
    if (existing.rows[0]?.checksum !== checksum) {
      throw new Error(`Applied migration ${name} has a different checksum.`);
    }
    return;
  }

  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)', [name, checksum]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

const invokedDirectly = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  migrate().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown migration failure';
    process.stderr.write(`Migration failed: ${message}\n`);
    process.exitCode = 1;
  });
}

export { migrate };
