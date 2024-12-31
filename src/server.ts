import fastify, {
  type FastifyInstance,
  type FastifyRequest,
  type FastifyReply,
} from 'fastify';
import { fastifyHelmet } from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { fastifyAutoload } from '@fastify/autoload';
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { log } from './lib/utils/log';
import path from 'path';
import { errorHandler } from './lib/utils/errorHandler';
import { type AuthPayload, type AuthUser } from './types/auth.types';
import { fastifySwagger } from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { getUserWithId } from './lib/queries/user';

const JWT_SECRET = process.env.JWT_SECRET;
if (JWT_SECRET === undefined) {
  throw new Error('Missing required env variable: JWT_SECRET');
}

declare module '@fastify/jwt' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface FastifyJWT {
    payload: AuthPayload;
    user: AuthUser;
  }
}

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
    })
    .register(fastifySwaggerUi, {
      routePrefix: `${opts.routePrefix}/documentation`,
      uiConfig: {},
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
      secret: JWT_SECRET,
    })
    .decorate(
      'authenticate',
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const accessToken: { isRefreshToken: boolean } =
            await request.jwtVerify();

          if (accessToken.isRefreshToken) {
            return errorHandler(reply, 401);
          }
        } catch (err) {
          return errorHandler(reply, 401);
        }
      },
    )
    .decorate('admin', async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getUserWithId(request.user.id, true);

      if (user === undefined) return errorHandler(reply, 500);
      if (!user.isAdmin) {
        return errorHandler(reply, 403, 'User is not an admin');
      }
    })
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
    .withTypeProvider<TypeBoxTypeProvider>()
    // For some reason AJV counts additional properties to minProperties
    // This hook makes sure, that empty bodies do not pass to handler
    .addHook('preHandler', async (request, reply) => {
      if (request.method === 'PATCH' && JSON.stringify(request.body) === '{}')
        await errorHandler(reply, 400, 'Additional properties are not allowed');
    });

  return server;
};
