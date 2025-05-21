import type { Job } from 'bullmq';

export type ImageFormat = 'webp' | 'jpeg' | 'png';;

export type JobData = {
    dbId: string;
    width: number;
    height: number;
    format: ImageFormat;
}
export type JobItem = Job<JobData, unknown, string>;