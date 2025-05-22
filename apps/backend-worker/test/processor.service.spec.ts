import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import type { JobData } from '../src/common';
import type { IDatabaseService } from '../src/services/database.type';
import { ProcessorService } from '../src/services/processor.service';
import type { IStorageService } from '../src/services/storage.type';
import type { IThumbnailService } from '../src/services/thumbnail.type';
import type { IUtilService } from '../src/services/util.type';

describe('Processor Service', () => {
  let getByIdMock: Mock;
  let downloadFileMock: Mock;
  let uploadFileMock: Mock;
  let resizeImageMock: Mock;
  let generateThumbnailIdMock: Mock;
  let databaseService: IDatabaseService;
  let storageService: IStorageService;
  let thumbnailService: IThumbnailService;
  let processor: ProcessorService;
  let utilService: IUtilService;

  const jobData: JobData = {
    dbId: 'job-123',
    width: 100,
    height: 100,
    format: 'jpeg',
  };

  beforeEach(() => {
    getByIdMock = vi.fn();
    databaseService = {
      getById: getByIdMock,
      update: vi.fn(),
      getAll: vi.fn(),
      create: vi.fn(),
    };
    downloadFileMock = vi.fn();
    uploadFileMock = vi.fn();
    storageService = {
      uploadFile: uploadFileMock,
      downloadFile: downloadFileMock,
    };
    resizeImageMock = vi.fn();
    thumbnailService = {
      resizeImage: resizeImageMock,
    };
    generateThumbnailIdMock = vi.fn();
    utilService = {
      generateThumbnailId: generateThumbnailIdMock,
    };
    processor = new ProcessorService(
      databaseService,
      storageService,
      thumbnailService,
      utilService,
    );
  });

  it('processes an image successfully', async () => {
    getByIdMock.mockResolvedValue({
      id: 'job-123',
      original_url: 'original.jpg',
    });
    downloadFileMock.mockResolvedValue(Buffer.from('image'));
    resizeImageMock.mockResolvedValue(Buffer.from('thumb'));
    uploadFileMock.mockResolvedValue({ url: 'thumb.jpg' });
    generateThumbnailIdMock.mockReturnValue('thumbnail_123');

    await processor.processImage(jobData);

    expect(databaseService.getById).toHaveBeenCalledWith('job-123');
    expect(storageService.downloadFile).toHaveBeenCalledWith('job-123');
    expect(thumbnailService.resizeImage).toHaveBeenCalledWith(
      Buffer.from('image'),
      100,
      100,
      'jpeg',
    );
    expect(storageService.uploadFile).toHaveBeenCalledWith(
      'thumbnail_123',
      Buffer.from('thumb'),
    );
    expect(databaseService.update).toHaveBeenCalledWith({
      id: 'job-123',
      status: 'success',
      thumbnail_id: 'thumbnail_123',
    });
  });

  it('sets job status to error if processing fails', async () => {
    getByIdMock.mockResolvedValue({
      id: 'job-123',
      original_url: 'original.jpg',
    });
    downloadFileMock.mockRejectedValue(new Error('Download failed'));

    await processor.processImage(jobData);

    expect(databaseService.update).toHaveBeenCalledWith({
      id: 'job-123',
      status: 'error',
      thumbnail_id: null,
    });
  });

  it('throws if job is not found', async () => {
    getByIdMock.mockResolvedValue(undefined);

    await expect(processor.processImage(jobData)).rejects.toThrow(
      'Job with id job-123 not found',
    );
  });
});
