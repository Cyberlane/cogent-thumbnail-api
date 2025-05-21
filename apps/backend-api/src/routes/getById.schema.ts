import { z } from '@hono/zod-openapi'

export const ParamsSchema = z.object({
  id: z.string().min(36).max(36).openapi({
    param: {
      name: 'id',
      in: 'path'
    },
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The ID of the job to retrieve'
  })
});