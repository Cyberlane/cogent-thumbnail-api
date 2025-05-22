import { z } from '@hono/zod-openapi'

export const HypermediaActionSchema = z.object({
  name: z.string().openapi({ description: 'The name of the action' }),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).openapi({ description: 'The HTTP method of the action' }),
  href: z.string().openapi({ description: 'The URL of the action' }),
  type: z.string().openapi({ description: 'The content type of the action' }),
});

export type HypermediaAction = z.infer<typeof HypermediaActionSchema>;

export const JobSchema = z.object({
  id: z.string().openapi({ description: 'The ID of the job' }),
  status: z.enum(['uploaded', 'processing', 'success', 'error']).openapi({ description: 'The status of the job' }),
  actions: HypermediaActionSchema.array().openapi({
    description: 'List of actions that can be performed on the job',
    example: [
      {
        name: 'Download',
        method: 'GET',
        href: '/jobs/123/download',
        type: 'application/octet-stream',
      },
    ],
  }),
}).openapi('Job');

export const Error500Schema = z.object({
  error: z.string().openapi({ description: 'Error message' }),
}).openapi('Error500');

export const Error404Schema = z.object({
  message: z.string().openapi({ description: 'Error message' }),
}).openapi('Error404');