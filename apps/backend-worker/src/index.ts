import { env } from './config';
import { PostgresDatabaseService } from './services/database.service';
import { ProcessorService } from './services/processor.service';
import { BullMqQueueService } from './services/queue.service';
import { SchemaService } from './services/schema.service';
import { S3StorageService } from './services/storage.service';
import { SharpThumbnailService } from './services/thumbnail.service';
import { UtilService } from './services/util.service';

// Database connection
const secureDatabase = env.POSTGRES_SSL;
const baseconnectionString = `postgres://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.POSTGRES_HOST}:${env.POSTGRES_PORT}/${env.POSTGRES_DB}`;
const connectionString = secureDatabase
  ? `${baseconnectionString}?ssl=true&sslmode=require`
  : baseconnectionString;

// Services
const schemaService = new SchemaService(connectionString);
const databaseService = new PostgresDatabaseService(connectionString);
const storageService = new S3StorageService(
  env.S3_ENDPOINT,
  env.S3_ACCESS_KEY,
  env.S3_SECRET_KEY,
  env.S3_BUCKET,
);
const thumbnailService = new SharpThumbnailService();
const utilService = new UtilService();
const processorService = new ProcessorService(
  databaseService,
  storageService,
  thumbnailService,
  utilService,
);
const queueService = new BullMqQueueService(
  env.REDIS_HOST,
  env.REDIS_PORT,
  env.QUEUE_PROCESS_THUMBNAIL,
  processorService,
);

const main = async () => {
  // Create the database schema
  await schemaService.runMigrations();
  // Start the queue worker
  await queueService.start();
  console.log('Worker started');
};

main();
