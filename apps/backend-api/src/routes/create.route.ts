import { createRoute, z } from '@hono/zod-openapi'

import { Error500Schema, JobSchema } from './common.schema'

export const route = createRoute({
  method: 'post',
  path: '/jobs',
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            file: z.any().openapi({
              type: 'string',
              format: 'binary',
              description: 'File to upload',
            })
          })
        }
      }
    }
  },
  responses: {
    201: {
      description: 'Job details',
      content: {
        'application/json': {
          schema: JobSchema,
        }
      }
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: Error500Schema.openapi('Internal Server Error'),
        }
      }
    }
  }
});