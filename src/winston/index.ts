import winston, { type LogEntry } from 'winston';
import {
  DataDogWritableStream,
  type LogStreamConfig,
} from '../DataDogWritableStream.js';
import { convertLevel } from '../utils/index.js';

export const getDataDogStream = (config: LogStreamConfig<LogEntry>) =>
  new DataDogWritableStream<LogEntry>({
    ...config,
    logMessageBuilder:
      config.logMessageBuilder ??
      ((input) => {
        if (config.debug) {
          console.log(
            `[DataDogWritableStream] Log received ${JSON.stringify(input)}`,
          );
        }
        const { level, hostname, ...parsedItem } = input;
        return {
          ddsource: config.ddSource,
          ddtags: config.ddTags,
          service: config.service,
          message: JSON.stringify({
            date: new Date().toISOString(),
            ...parsedItem,
            level: convertLevel(level),
          }),
          hostname: typeof hostname === 'string' ? hostname : hostname,
        };
      }),
  });

export class DataDogTransport extends winston.transports.Stream {
  constructor(config: LogStreamConfig<LogEntry>) {
    super({
      stream: getDataDogStream(config),
    });
  }
}
