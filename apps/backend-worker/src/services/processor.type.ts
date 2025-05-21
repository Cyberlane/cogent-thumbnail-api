import type { JobData } from '../common';

export interface IProcessorService {
  processImage(data: JobData): Promise<void>;
}