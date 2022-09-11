import {
  createLogger, format, Logger, transports
} from 'winston';

const {
  combine, timestamp, prettyPrint
} = format;

export const log: Logger = createLogger({
  format: combine(
    timestamp(),
    prettyPrint()
  ),
  transports: [new transports.Console()]
});
