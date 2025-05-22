import type { JobData } from '../common';
import type { IDatabaseService } from './database.type';
import type { IProcessorService } from './processor.type';
import type { IStorageService } from './storage.type';
import type { IThumbnailService } from './thumbnail.type';
import type { IUtilService } from './util.type';

export class ProcessorService implements IProcessorService {
  constructor(
    private readonly databaseService: IDatabaseService,
    private readonly storageService: IStorageService,
    private readonly thumbnailService: IThumbnailService,
    private readonly utilService: IUtilService,
  ) {}

  async processImage(data: JobData): Promise<void> {
    const { dbId, width, height, format } = data;

    // Fetch the job from the database
    const job = await this.databaseService.getById(dbId);
    if (!job) {
      throw new Error(`Job with id ${dbId} not found`);
    }

    try {
      // Download the image from storage
      const originalImageBuffer = await this.storageService.downloadFile(dbId);

      // Resize the image
      const resizedImageBuffer = await this.thumbnailService.resizeImage(
        originalImageBuffer,
        width,
        height,
        format,
      );

      const thumbnailId = this.utilService.generateThumbnailId();

      // Upload the resized image to storage
      await this.storageService.uploadFile(thumbnailId, resizedImageBuffer);

      // Update the job in the database
      await this.databaseService.update({
        id: dbId,
        status: 'success',
        thumbnail_id: thumbnailId,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Error processing job ${dbId}: ${error.message}`);
      } else {
        console.error(`Error processing job ${dbId}: ${String(error)}`);
      }
      // Update the job status to failed in the database
      await this.databaseService.update({
        id: dbId,
        status: 'error',
        thumbnail_id: null,
      });
    }
  }
}
