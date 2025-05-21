import { z } from 'zod/v4';

const envSchema = z.object({
  NODE_ENV: z
    .union([
      z.literal('development'),
      z.literal('production'),
      z.literal('test'),
    ])
    .default('development'),
  PORT: z.coerce.number().min(1000).default(3000),
  // Database
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
  POSTGRES_HOST: z.string().min(1),
  POSTGRES_PORT: z.coerce.number().min(1000).default(5432),
  POSTGRES_SSL: z.coerce.boolean().default(false),
  // Redis
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().min(1000).default(6379),
  // S3 Object Storage
  S3_ENDPOINT: z.string().min(1),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  // Queue
  QUEUE_PROCESS_THUMBNAIL: z.string().min(1),
});

export type Environment = z.infer<typeof envSchema>;

const isBun = typeof Bun !== 'undefined';

export const env = envSchema.parse(isBun ? Bun.env : process.env);