import { createRoute } from '@hono/zod-openapi'

import { Error404Schema, Error500Schema, JobSchema } from './common.schema'
import { ParamsSchema } from './getById.schema'

export const route = createRoute({
  method: 'get',
  path: '/jobs/:id',
  request: {
    params: ParamsSchema,
  },
  responses: {
    200: {
      description: 'Job details',
      content: {
        'application/json': {
          schema: JobSchema,
        }
      }
    },
    404: {
      description: 'Job not found',
      content: {
        'application/json': {
          schema:  Error404Schema.openapi('Job not found'),
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