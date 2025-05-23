import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { v4 as uuidv4 } from 'uuid';

import type { Job } from './database/db.types';
import type { HypermediaAction } from './routes/common.schema';
import { route as uploadRoute } from './routes/create.route';
import { route as getByIdRoute } from './routes/getById.route';
import { route as listRoute } from './routes/list.route';
import { route as downloadRoute } from './routes/download.route';
import type { IDatabaseService } from './services/database.type';
import type { IQueueService } from './services/queue.type';
import type { IStorageService } from './services/storage.type';

export const createServer = (
  databaseService: IDatabaseService,
  storageService: IStorageService,
  queueService: IQueueService,
) => {

  const joinUrl = (path: string, baseUrl: string) => new URL(path, baseUrl).href;

  const formatJob = (baseUrl: string) => (job: Job) => {
    const origin = new URL(baseUrl).origin;
    const actions: HypermediaAction[] = [
      {
        name: 'View Details',
        method: 'GET',
        href: joinUrl(`/jobs/${job.id}`, origin),
        type: 'application/json',
      }
    ];
    if (job.status === 'success') {
      actions.push({
        name: 'Download',
        method: 'GET',
        href: joinUrl(`/jobs/${job.id}/download`, origin),
        type: 'application/octet-stream',
      });
    }
    return {
      id: job.id,
      status: job.status,
      actions,
    };
  };

  // API routing
  const app = new OpenAPIHono();
  app.openapi(listRoute, async (c) => {
    try {
      const list = await databaseService.getAll();
      const formatted = list.map(formatJob(c.req.url));
      return c.json(formatted, 200);
    } catch (error: unknown) {
      console.error(error);
      return c.json({ error: 'Internal Server Error' }, 500);
    }
  });

  app.openapi(getByIdRoute, async (c) => {
    const { id } = c.req.param();
    try {
      const item = await databaseService.getById(id);
      if (!item) {
        return c.json({ message: 'Not Found' }, 404);
      }
      const formatItem = formatJob(c.req.url);
      const formattedItem = formatItem(item);
      return c.json(formattedItem, 200);
    } catch (error: unknown) {
      console.error(error);
      return c.json({ error: 'Internal Server Error' }, 500);
    }
  });

  app.openapi(downloadRoute, async (c) => {
    const { id } = c.req.param();
    try {
      const item = await databaseService.getById(id);
      if (!item) {
        return c.json({ message: 'Not Found' }, 404);
      }
      const buffer = await storageService.downloadFile(id);
      if (!buffer) {
        return c.json({ message: 'Not Found' }, 404);
      }
      return c.body(buffer, 200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${id}.${item.thumbnail_format}"`,
        'Content-Length': buffer.length.toString(),
      });
    } catch (error: unknown) {
      console.error(error);
      return c.json({ error: 'Internal Server Error' }, 500);
    }
  });

  app.openapi(uploadRoute, async (c) => {
    const body = await c.req.parseBody();
    const file = body.file as File;
    try {
      const id = uuidv4();
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await storageService.uploadFile(id, buffer);
      await databaseService.create(id, {
        thumbnail_width: 100,
        thumbnail_height: 100,
        thumbnail_format: 'jpeg',
      });
      const item = await databaseService.getById(id);
      if (!item) {
        // Unlikely to happen, but if it somehow doesn't save to the database and gets this far
        // return a 500 error
        // This is a good place to add logging for debugging
        return c.json({ error: 'Unable to save file' }, 500);
      }
      // Add the job to the queue for processing
      await queueService.addJob({
        dbId: id,
        width: item.thumbnail_width,
        height: item.thumbnail_height,
        format: item.thumbnail_format,
      });
      // Return the created job
      const formatItem = formatJob(c.req.url);
      const formattedItem = formatItem(item);
      return c.json(formattedItem, 201);
    } catch (error: unknown) {
      console.error(error);
      return c.json({ error: 'Internal Server Error' }, 500);
    }
  });

  app.get('/swagger', swaggerUI({ url: '/docs' }));

  app.doc('/docs', {
    info: {
      title: 'Cogent Thumbnail API',
      version: 'v1',
    },
    openapi: '3.1.0',
  });

  return app;
};
