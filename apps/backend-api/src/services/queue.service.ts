import Redis from 'ioredis';
import { Queue } from 'bullmq';

import type { IQueueService } from './queue.type';
import type { JobData } from '../common';

export class BullMqQueueService implements IQueueService {
  private queue: Queue<JobData>;
  constructor(host: string, port: number, queueName: string) {
    const redis = new Redis(port, host);
    this.queue = new Queue<JobData>(queueName, { connection: redis });
    this.queue.on('error', this.handleError);
  }

  async addJob(job: JobData): Promise<void> {
    try {
      await this.queue.add('image-processing', job);
    } catch (err) {
      this.handleError(err as Error);
    }
  }

  private handleError(err: Error): void {
    console.error(`Job failed with error: ${err.message}`);
  }
}