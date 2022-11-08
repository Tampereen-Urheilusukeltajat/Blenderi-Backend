import fastify, {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
} from 'fastify';
import { fastifySwagger } from '@fastify/swagger';
import { fastifyHelmet } from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { fastifyAutoload } from '@fastify/autoload';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

import { log } from './lib/log';
import path from 'path';
import { errorHandler } from './lib/errorHandler';

const secret = 'donthackme';

export const buildServer = async (opts: {
  routePrefix: string;
}): Promise<FastifyInstance> => {
  const server = fastify({
    logger: false,
    ignoreTrailingSlash: true,
    ajv: {
      customOptions: {
        removeAdditional: 'all', // Remove additional params from the body etc
      },
      plugins: [
        (ajv) => {
          ajv.addKeyword({ keyword: 'example' });
        },
      ],
    },
  });

  // Register plugins and routes
  server
    .addSchema({
      $id: 'error',
      type: 'object',
      properties: {
        statusCode: { type: 'number' },
        error: { type: 'string' },
        message: { type: 'string' },
      },
    })
    .register(fastifySwagger, {
      routePrefix: `${opts.routePrefix}/documentation`,
      swagger: {
        info: {
          title: 'Blenderi REST API',
          description: 'Documentation for Blenderi REST API',
          version: '0.0.1',
        },
        securityDefinitions: {
          bearerAuth: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
        consumes: ['application/json'],
        produces: ['application/json'],
      },
      exposeRoute: true,
    })
    .register(fastifyHelmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
          scriptSrc: ["'self'", "https: 'unsafe-inline'"],
        },
      },
    })
    .register(fastifyCors, {
      origin: (origin, cb) => {
        // TODO: Configure CORS
        cb(null, true);
      },
    })
    .register(jwt, {
      secret,
    })
    .decorate(
      'authenticate',
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          await request.jwtVerify();
        } catch (err) {
          await reply.code(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'please do authenticate yourself',
          });
        }
      }
    )
    .register(fastifyAutoload, {
      dir: path.join(__dirname, 'routes'),
      dirNameRoutePrefix: (_folderParent, folderName) =>
        `${opts.routePrefix}/${folderName}`,
    })
    .setErrorHandler(async (error, request, reply) => {
      if (error.statusCode === undefined) {
        log.error({
          error: error.name,
          message: error.message,
          url: request.url,
          method: request.method,
          body: request.body,
          stack: error.stack,
          statusCode: error.statusCode,
        });
      }

      await errorHandler(reply, error.statusCode, error.message);
    })
    .withTypeProvider<TypeBoxTypeProvider>();

  return server;
};
