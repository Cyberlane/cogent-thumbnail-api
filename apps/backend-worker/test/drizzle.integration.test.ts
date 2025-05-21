import { type NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { env } from '../src/config';

// Database connection
const secureDatabase = env.NODE_ENV === 'production' || env.POSTGRES_SSL;
const baseconnectionString = `postgres://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.POSTGRES_HOST}:${env.POSTGRES_PORT}/${env.POSTGRES_DB}`;
const connectionString = secureDatabase
  ? `${baseconnectionString}?ssl=true&sslmode=require`
  : baseconnectionString;

describe('Drizzle ORM Integration Tests', () => {
  const testTable = 'test_table';
  let db: NodePgDatabase<Record<string, never>>;
  beforeAll(async () => {
    const pool = new Pool({
      connectionString,
    });
    db = drizzle({ client: pool });
  });

  afterAll(async () => {
    await db.execute(`DROP TABLE IF EXISTS ${testTable}`);
  });

  describe.sequential('Database Operations', () => {
    it('should create a table', async () => {
      await db.execute(
        `CREATE TABLE IF NOT EXISTS ${testTable} (id SERIAL PRIMARY KEY, name VARCHAR(255))`,
      );
      const result = await db.execute(
        `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '${testTable}')`,
      );
      expect(result).toBeTruthy();
    });
    it('should insert a row', async () => {
      await db.execute(`INSERT INTO ${testTable} (name) VALUES ('Test Name')`);
      const result = await db.execute(
        `SELECT * FROM ${testTable} WHERE name = 'Test Name'`,
      );
      expect(result.rows[0].name).toBe('Test Name');
    });
    it('should update a row', async () => {
      await db.execute(
        `UPDATE ${testTable} SET name = 'Updated Name' WHERE name = 'Test Name'`,
      );
      const result = await db.execute(
        `SELECT * FROM ${testTable} WHERE name = 'Updated Name'`,
      );
      expect(result.rows[0].name).toBe('Updated Name');
    });
    it('should delete a row', async () => {
      await db.execute(`DELETE FROM ${testTable} WHERE name = 'Updated Name'`);
      const result = await db.execute(
        `SELECT * FROM ${testTable} WHERE name = 'Updated Name'`,
      );
      expect(result.rows.length).toBe(0);
    });
  });
});
