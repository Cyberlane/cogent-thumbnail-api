import type { OpenAPIHono } from '@hono/zod-openapi';
import {
  type Mock,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { createServer } from '../src/server';
import type { IDatabaseService } from '../src/services/database.type';
import type { IQueueService } from '../src/services/queue.type';
import type { IStorageService } from '../src/services/storage.type';

describe('API Routes', () => {
  let getAllMock: Mock;
  let getByIdMock: Mock;
  let uploadFileMock: Mock;
  let createMock: Mock;
  let databaseService: IDatabaseService;
  let storageService: IStorageService;
  let queueService: IQueueService;
  let app: OpenAPIHono;

  beforeEach(() => {
    getAllMock = vi.fn();
    getByIdMock = vi.fn();
    createMock = vi.fn();
    databaseService = {
      getAll: getAllMock,
      getById: getByIdMock,
      create: createMock,
      update: vi.fn(),
    };
    uploadFileMock = vi.fn();
    storageService = {
      uploadFile: uploadFileMock,
      downloadFile: vi.fn(),
    };
    queueService = {
      addJob: vi.fn(),
    };
    app = createServer(databaseService, storageService, queueService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('GET /jobs - should return a list of jobs', async () => {
    const mockJobs = [
      { id: '1', status: 'pending' },
      { id: '2', status: 'completed' },
    ];
    getAllMock.mockResolvedValue(mockJobs);

    const response = await app.request('/jobs');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([
      {
        id: '1',
        status: 'pending',
        actions: [
          {
            href: 'http://localhost/jobs/1',
            method: 'GET',
            name: 'View Details',
            type: 'application/json',
          },
        ],
      },
      {
        id: '2',
        status: 'completed',
        actions: [
          {
            href: 'http://localhost/jobs/2',
            method: 'GET',
            name: 'View Details',
            type: 'application/json',
          },
        ],
      },
    ]);
  });

  it('GET /jobs - should handle errors', async () => {
    getAllMock.mockRejectedValue(new Error('Database error'));

    const response = await app.request('/jobs');
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Internal Server Error' });
  });

  it('GET /jobs/:id - should return a job by ID', async () => {
    const mockJob = { id: '1', status: 'pending' };
    getByIdMock.mockResolvedValue(mockJob);

    const response = await app.request(
      '/jobs/b39e9634-4957-4181-a2b2-3b0f55cf2cd5',
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      ...mockJob,
      actions: [
        {
          href: 'http://localhost/jobs/1',
          method: 'GET',
          name: 'View Details',
          type: 'application/json',
        },
      ],
    });
  });

  it('GET /jobs/:id - should return 400 if using an invalid ID (not UUID)', async () => {
    const response = await app.request('/jobs/invalid-id');
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: {
        issues: [
          {
            code: 'too_small',
            exact: false,
            inclusive: true,
            message: 'String must contain at least 36 character(s)',
            minimum: 36,
            path: ['id'],
            type: 'string',
          },
        ],
        name: 'ZodError',
      },
      success: false,
    });
  });

  it('GET /jobs/:id - should return 404 if job not found', async () => {
    getByIdMock.mockResolvedValue(null);

    const response = await app.request(
      '/jobs/b39e9634-4957-4181-a2b2-3b0f55cf2cd5',
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ message: 'Not Found' });
  });

  it('GET /jobs/:id - should handle errors', async () => {
    getByIdMock.mockRejectedValue(new Error('Database error'));

    const response = await app.request(
      '/jobs/b39e9634-4957-4181-a2b2-3b0f55cf2cd5',
    );
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Internal Server Error' });
  });

  it('POST /jobs - should create a new job', async () => {
    const mockJob = { id: '1', status: 'pending' };
    createMock.mockResolvedValue(mockJob);
    uploadFileMock.mockResolvedValue({
      url: 'https://example.com/test.jpg',
    });
    getByIdMock.mockResolvedValue(mockJob);

    const formData = new FormData();
    formData.append(
      'file',
      new Blob(['test'], { type: 'image/jpeg' }),
      'test.jpg',
    );

    const response = await app.request('/jobs', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual({
      ...mockJob,
      actions: [
        {
          href: 'http://localhost/jobs/1',
          method: 'GET',
          name: 'View Details',
          type: 'application/json',
        },
      ],
    });
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(uploadFileMock).toHaveBeenCalledTimes(1);
    expect(getByIdMock).toHaveBeenCalledTimes(1);
  });
});
