import { env } from './config';
import { createServer } from './server';
import { PostgresDatabaseService } from './services/database.service';
import { BullMqQueueService } from './services/queue.service';
import { S3StorageService } from './services/storage.service';

// Database connection
const secureDatabase = env.POSTGRES_SSL;
const baseconnectionString = `postgres://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.POSTGRES_HOST}:${env.POSTGRES_PORT}/${env.POSTGRES_DB}`;
const connectionString = secureDatabase
  ? `${baseconnectionString}?ssl=true&sslmode=require`
  : baseconnectionString;

// Services
const databaseService = new PostgresDatabaseService(connectionString);
const storageService = new S3StorageService(
  env.S3_ENDPOINT,
  env.S3_ACCESS_KEY,
  env.S3_SECRET_KEY,
  env.S3_BUCKET,
);
const queueService = new BullMqQueueService(
  env.REDIS_HOST,
  env.REDIS_PORT,
  env.QUEUE_PROCESS_THUMBNAIL,
);

const app = createServer(databaseService, storageService, queueService);

export default app;
