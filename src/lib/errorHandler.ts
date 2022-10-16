import { FastifyReply } from 'fastify';

const HTTP_ERROR_RESPONSE_STATUS_MESSAGES = {
  307: 'Temporal Redirect',
  308: 'Permanent Redirect',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  409: 'Conflict',
  418: `I'm a teapot`,
  500: 'Internal Server Error',
};

/**
 * General http request error handler
 * @param reply FastifyReply
 * @param code HTTP response status code
 * @param msg Optional messsage
 */
export const errorHandler = async (
  reply: FastifyReply,
  code?: number,
  msg?: string
): Promise<FastifyReply> => {
  if (
    code === undefined ||
    HTTP_ERROR_RESPONSE_STATUS_MESSAGES[code] === undefined
  ) {
    return reply.code(500).send({
      statusCode: 500,
      error: HTTP_ERROR_RESPONSE_STATUS_MESSAGES[500],
      message: HTTP_ERROR_RESPONSE_STATUS_MESSAGES[500],
    });
  }

  return reply.code(code).send({
    statusCode: code,
    error: HTTP_ERROR_RESPONSE_STATUS_MESSAGES[code],
    message: msg,
  });
};
