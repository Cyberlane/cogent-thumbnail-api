import { integer, pgEnum, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

export const statusEnum = pgEnum('status', [
  'uploaded',
  'processing',
  'success',
  'error',
]);
export const formatEnum = pgEnum('format', ['webp', 'jpeg', 'png']);

export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey(),
  status: statusEnum('status').notNull(),
  original_url: varchar('original_url', { length: 255 }).notNull(),
  thumbnail_url: varchar('thumbnail_url', { length: 255 }),
  thumbnail_width: integer('thumbnail_width').notNull(),
  thumbnail_height: integer('thumbnail_height').notNull(),
  thumbnail_format: formatEnum('thumbnail_format').notNull(),
});
