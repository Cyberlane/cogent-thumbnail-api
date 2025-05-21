import type { Job } from '../database/db.types';

export type CreateJob = Pick<Job, 'original_url' | 'thumbnail_width' | 'thumbnail_height' | 'thumbnail_format'>;
export type UpdateJob = Pick<Job, 'id' | 'status' | 'thumbnail_url'>;

export interface IDatabaseService {
  getById(id: string): Promise<Job>;
  getAll(): Promise<Job[]>;
  create(id: string, job: CreateJob): Promise<{ id: string }>;
  update(job: UpdateJob): Promise<void>;
}