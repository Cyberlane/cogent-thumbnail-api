import path from 'node:path';

import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

import type { ISchemaService } from './schema.type';

const drizzlePath = path.join(import.meta.dir, '../../drizzle');

export class SchemaService implements ISchemaService {
  private conn: Pool;
  private db: NodePgDatabase<Record<string, never>>;

  constructor(connectionString: string) {
    this.conn = new Pool({
      connectionString,
      max: 1,
      idleTimeoutMillis: 5000,
    });
    this.db = drizzle({ client: this.conn });
  }

  async runMigrations(): Promise<void> {
    // Set the client_min_messages to WARNING to suppress notices
    await this.db.execute(sql`SET client_min_messages TO WARNING;`);
    // Run the migrations
    await migrate(this.db, {
      migrationsFolder: drizzlePath,
      migrationsTable: 'migrations',
    });
    // Reset the client_min_messages to default
    await this.db.execute(sql`RESET client_min_messages;`);
    // Close the connection
    await this.conn.end();
  }
}