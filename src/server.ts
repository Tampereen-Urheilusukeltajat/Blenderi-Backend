import fastify, { FastifyInstance } from 'fastify';
import { fastifySwagger } from '@fastify/swagger';
import { fastifyHelmet } from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import { fastifyAutoload } from '@fastify/autoload';

import { log } from './lib/log';
import path from 'path';

const APPLICATION_HOST: string = process.env.APPLICATION_HOST as string;
const APPLICATION_PORT = Number(process.env.APPLICATION_PORT);
const ROUTE_PREFIX: string = process.env.ROUTE_PREFIX as string;

export const initServer = async (): Promise<{
  start: () => Promise<FastifyInstance>
}> => {
  const server = fastify({
    logger: false,
    ignoreTrailingSlash: true,
    ajv: {
      customOptions: {
        removeAdditional: 'all' // Remove additional params from the body etc
      }
    }
  });

  // Register plugins and routes
  server
    .addSchema({
      $id: 'error',
      type: 'object',
      properties: {
        statusCode: { type: 'number' },
        error: { type: 'string' },
        message: { type: 'string' }
      }
    })
    .register(fastifySwagger, {
      routePrefix: `${ROUTE_PREFIX}/documentation`,
      swagger: {
        info: {
          title: 'Blenderi REST API',
          description: 'Documentation for Blenderi REST API',
          version: '0.0.1'
        },
        securityDefinitions: {
          bearerAuth: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header'
          }
        },
        security: [{
          bearerAuth: []
        }],
        consumes: ['application/json'],
        produces: ['application/json'],
        tags: [{
          name: 'Utility',
          description: 'Utility endpoints'
        }
        ]
      },
      exposeRoute: true
    })
    .register(fastifyHelmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ['\'self\''],
          styleSrc: ['\'self\'', '\'unsafe-inline\''],
          imgSrc: ['\'self\'', 'data:', 'validator.swagger.io'],
          scriptSrc: ['\'self\'', 'https: \'unsafe-inline\'']
        }
      }
    })
    .register(fastifyCors, {
      origin: (origin, cb) => {
        // TODO: Configure CORS
        cb(null, true);
      }
    })
    .register(fastifyAutoload, {
      dir: path.join(__dirname, 'routes'),
      dirNameRoutePrefix: (_folderParent, folderName) => `${ROUTE_PREFIX}/${folderName}`
    })
    .setErrorHandler(async (error, request, reply) => {
      log.error({
        error: error.name,
        message: error.message,
        url: request.url,
        method: request.method,
        body: request.body,
        stack: error.stack
      });

      await reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Internal Server Error'
      });
    });

  return {
    start: async () => {
      await server.listen({
        host: APPLICATION_HOST,
        port: APPLICATION_PORT
      });
      return await server;
    }
  };
};
