import type { Job } from '../database/db.types';

export type CreateJob = Pick<
  Job,
  'thumbnail_width' | 'thumbnail_height' | 'thumbnail_format'
>;
export type UpdateJob = Pick<Job, 'id' | 'status' | 'thumbnail_id'>;

export interface IDatabaseService {
  getById(id: string): Promise<Job | undefined>;
  getAll(): Promise<Job[]>;
  create(id: string, job: CreateJob): Promise<{ id: string }>;
  update(job: UpdateJob): Promise<void>;
}
