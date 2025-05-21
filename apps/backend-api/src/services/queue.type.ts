import type { JobData } from '../common';

export interface IQueueService {
  addJob(job: JobData): Promise<void>;
}