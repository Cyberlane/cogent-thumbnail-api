import { createRoute } from '@hono/zod-openapi'

import { Error404Schema, Error500Schema } from './common.schema'
import { ParamsSchema } from './getById.schema';

export const route = createRoute({
  method: 'get',
  description: 'Download a Thumbnail',
  path: '/jobs/{id}/download',
  request: {
    params: ParamsSchema,
  },
  responses: {
    200: {
      description: 'File download',
      content: {
        'application/octet-stream': {
          schema: {
            type: 'string',
            format: 'binary',
          },
        }
      }
    },
    404: {
      description: 'Job not found',
      content: {
        'application/json': {
          schema: Error404Schema.openapi('Job not found'),
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
})