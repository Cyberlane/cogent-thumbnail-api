import { integer, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';

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
  thumbnail_id: uuid('thumbnail_id'),
  thumbnail_width: integer('thumbnail_width').notNull(),
  thumbnail_height: integer('thumbnail_height').notNull(),
  thumbnail_format: formatEnum('thumbnail_format').notNull(),
});
