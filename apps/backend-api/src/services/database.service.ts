import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';

import type { Job } from '../database/db.types';
import * as schema from '../database/db.schema';
import type { CreateJob, IDatabaseService, UpdateJob } from './database.type';

export class PostgresDatabaseService implements IDatabaseService {
  private db: NodePgDatabase<typeof schema>;

  constructor(connectionString: string) {
    const pool = new Pool({
      connectionString,
    });
    this.db = drizzle({ client: pool, schema });
  }

  async getById(id: string): Promise<Job> {
    const job = await this.db
      .select()
      .from(schema.jobs)
      .where(eq(schema.jobs.id, id))
      .limit(1)
      .execute();
    if (job.length === 0) {
      throw new Error(`Job with id ${id} not found`);
    }
    return job[0];
  }

  async getAll(): Promise<Job[]> {
    const jobs = await this.db.select().from(schema.jobs).execute();
    return jobs;
  }

  async create(id: string, job: CreateJob): Promise<{ id: string }> {
    const [createdJob] = await this.db
      .insert(schema.jobs)
      .values({
        ...job,
        id,
        status: 'uploaded',
      })
      .returning({ id: schema.jobs.id })
      .execute();
    return {
      id: createdJob.id,
    }
  }

  async update(job: UpdateJob): Promise<void> {
    await this.db
      .update(schema.jobs)
      .set({
        ...job,
      })
      .where(eq(schema.jobs.id, job.id))
      .execute();
  }
}