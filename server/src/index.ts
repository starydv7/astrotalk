import 'dotenv/config';

import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createPool } from './db/pool.js';
import { PostgresRepository } from './repositories/postgres-repository.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const pool = createPool(config);
  const repository = new PostgresRepository(pool);
  const app = await buildApp({
    config,
    repository,
    closeDependencies: async () => pool.end(),
  });

  let stopping = false;
  const stop = async (signal: string): Promise<void> => {
    if (stopping) return;
    stopping = true;
    app.log.info({ event: 'shutdown_started', signal });
    const forcedExit = setTimeout(() => {
      process.stderr.write('Graceful shutdown timed out.\n');
      process.exit(1);
    }, 10_000);
    forcedExit.unref();
    try {
      await app.close();
      clearTimeout(forcedExit);
      process.exitCode = 0;
    } catch {
      clearTimeout(forcedExit);
      process.stderr.write('Graceful shutdown failed.\n');
      process.exitCode = 1;
    }
  };

  process.once('SIGINT', () => void stop('SIGINT'));
  process.once('SIGTERM', () => void stop('SIGTERM'));

  try {
    await app.listen({ host: config.host, port: config.port });
    app.log.info({ event: 'server_started', port: config.port });
  } catch {
    process.stderr.write('Server startup failed. Check configuration and database availability.\n');
    await app.close().catch(() => undefined);
    process.exitCode = 1;
  }
}

void main();
