import {createRoute } from '@hono/zod-openapi'

import { Error500Schema, JobSchema } from './common.schema'

export const route = createRoute({
  method: 'get',
  path: '/jobs',
  responses: {
    200: {
      description: 'List of jobs',
      content: {
        'application/json': {
          schema: JobSchema.array().openapi('Collection of jobs'),
        }
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: Error500Schema.openapi('Internal Server Error'),
        },
      },
    },
  }
});