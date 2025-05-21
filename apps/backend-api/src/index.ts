import { v4 as uuidv4 } from 'uuid'
import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'

import { route as listRoute } from './routes/list.route'
import { route as getByIdRoute } from './routes/getById.route'
import { route as uploadRoute } from './routes/create.route'
import { env } from './config'
import { PostgresDatabaseService } from './services/database.service';
import { S3StorageService } from './services/storage.service'
import type { Job } from './database/db.types'
import { BullMqQueueService } from './services/queue.service'

// Database connection
const secureDatabase = env.NODE_ENV === 'production' || env.POSTGRES_SSL;
const baseconnectionString = `postgres://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.POSTGRES_HOST}:${env.POSTGRES_PORT}/${env.POSTGRES_DB}`;
const connectionString = secureDatabase
  ? `${baseconnectionString}?ssl=true&sslmode=require`
  : baseconnectionString;

// Services
const databaseService = new PostgresDatabaseService(connectionString);
const storageService = new S3StorageService(env.S3_ENDPOINT, env.S3_ACCESS_KEY, env.S3_SECRET_KEY, env.S3_BUCKET);
const queueService = new BullMqQueueService(env.REDIS_HOST, env.REDIS_PORT, env.QUEUE_PROCESS_THUMBNAIL);

// Helper function to map status values to OpenAPI enum
function mapStatus(status: string): "pending" | "processing" | "completed" | "failed" {
  switch (status) {
    case "pending":
    case "processing":
    case "completed":
    case "failed":
      return status;
    case "success":
    case "uploaded":
      return "completed";
    case "error":
      return "failed";
    default:
      return "pending"; // fallback or handle as needed
  }
}
const formatJob = (job: Job) => ({
  ...job,
  status: mapStatus(job.status),
  thumbnail_url: job.thumbnail_url ? job.thumbnail_url : undefined,
});

// API routing
const app = new OpenAPIHono();
app.openapi(listRoute, async (c) => {
  try {
  const list = await databaseService.getAll();
  const formatted = list.map(formatJob);
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
    const formattedItem = formatJob(item);
    return c.json(formattedItem, 200);
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
    const { url } = await storageService.uploadFile(id, buffer);
    await databaseService.create(id, {
      original_url: url,
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
    const formattedItem = formatJob(item);
    return c.json(formattedItem, 201);
  } catch (error: unknown) {
    console.error(error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

app.get('/swagger', swaggerUI({ url: '/doc' }));

app.doc('/doc', {
  info: {
    title: 'Cogent Thumbnail API',
    version: 'v1',
  },
  openapi: '3.1.0',
})

export default app;