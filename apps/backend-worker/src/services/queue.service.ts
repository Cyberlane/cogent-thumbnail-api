import Redis from 'ioredis';
import { Worker, type Job } from 'bullmq';

import type { IQueueService } from './queue.type';
import type { IProcessorService } from './processor.type';
import type { JobData } from '../common';

export class BullMqQueueService implements IQueueService {
  private worker: Worker<JobData>;
  constructor(host: string, port: number, queueName: string, private readonly processorService: IProcessorService) {
    const redis = new Redis(port, host, {
      maxRetriesPerRequest: null
    });
    this.worker = new Worker<JobData>(queueName, (job) => this.processJob(job), { connection: redis, autorun: false });
    this.worker.on('failed', this.handleError);
  }

  private async processJob(job: Job<JobData, unknown, string>): Promise<void> {
    // Simulate a long-running task
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await this.processorService.processImage(job.data);

    // Fetch the record from the database
    console.log(`Job ${job.id} completed`);
  }

  private handleError(job: Job<JobData, unknown, string> | undefined, err: Error): void {
    if (job != null) {
      console.error(`Job ${job?.id} failed with error: ${err.message}`);
    } else {
      console.error(`Job failed with error: ${err.message}`);
    }
  }

  public async start(): Promise<void> {
    await this.worker.run();
  }

  public async stop(): Promise<void> {
    await this.worker.close();
  }
}