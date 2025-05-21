import { z } from '@hono/zod-openapi'

export const JobSchema = z.object({
  id: z.string().openapi({ description: 'The ID of the job' }),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).openapi({ description: 'The status of the job' }),
  original_url: z.string().url().openapi({ description: 'The original URL of the image' }),
  thumbnail_url: z.string().url().optional().openapi({ description: 'The URL of the thumbnail image' }),
  thumbnail_width: z.number().int().openapi({ description: 'The width of the thumbnail image' }),
  thumbnail_height: z.number().int().openapi({ description: 'The height of the thumbnail image' }),
  thumbnail_format: z.enum(['webp', 'jpeg', 'png']).openapi({ description: 'The format of the thumbnail image' }),
}).openapi('Job');

export const Error500Schema = z.object({
  error: z.string().openapi({ description: 'Error message' }),
}).openapi('Error500');

export const Error404Schema = z.object({
  message: z.string().openapi({ description: 'Error message' }),
}).openapi('Error404');