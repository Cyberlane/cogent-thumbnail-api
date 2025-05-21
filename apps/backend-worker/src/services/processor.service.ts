import type { JobData } from '../common';
import type { IDatabaseService } from './database.type';
import type { IProcessorService } from './processor.type';
import type { IStorageService } from './storage.type';
import type { IThumbnailService } from './thumbnail.type';

export class ProcessorService implements IProcessorService {
  constructor(
    private readonly databaseService: IDatabaseService,
    private readonly storageService: IStorageService,
    private readonly thumbnailService: IThumbnailService
  ) {}

  async processImage(data: JobData): Promise<void> {
    const { dbId, width, height, format } = data;

    // Fetch the job from the database
    const job = await this.databaseService.getById(dbId);
    if (!job) {
      throw new Error(`Job with id ${dbId} not found`);
    }

    try {
    // Get the original image from storage
    const originalImageBuffer = await this.storageService.downloadFile(job.original_url);

    // Resize the image
    const resizedImageBuffer = await this.thumbnailService.resizeImage(originalImageBuffer, width, height, format);

    // Upload the resized image to storage
    const { url: thumbnailUrl } = await this.storageService.uploadFile(`thumbnails/${dbId}.${format}`, resizedImageBuffer);

    // Update the job in the database
    await this.databaseService.update({ id: dbId, status: 'success', thumbnail_url: thumbnailUrl });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Error processing job ${dbId}: ${error.message}`);
      } else {
      console.error(`Error processing job ${dbId}: ${String(error)}`);
      }
      // Update the job status to failed in the database
      await this.databaseService.update({ id: dbId, status: 'error', thumbnail_url: null });
    }
  }
}