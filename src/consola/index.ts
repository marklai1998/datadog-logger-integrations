import type { Writable } from 'node:stream';
import type { LogObject } from 'consola';
import { DataDogWritableStream } from '../DataDogWritableStream.js';
import type { LogStreamConfig } from '../types';

export const convertLevel = (level: number | string): string => {
  if (typeof level === 'string') return level;
  if (level === 0) return 'error';
  if (level === 1) return 'warning';
  if (level === 2) return 'info';
  if (level === 3) return 'info';
  if (level === 4) return 'debug';
  return 'trace';
};

export const getDataDogStream = (config: LogStreamConfig<LogObject>) =>
  new DataDogWritableStream<LogObject>({
    ...config,
    logMessageBuilder:
      config.logMessageBuilder ??
      // level is the log level of the logger, not interested
      (({ type, date, level, hostname, ...parsedItem }) => ({
        ddsource: config.ddSource,
        ddtags: config.ddTags,
        service: config.service,
        message: JSON.stringify({
          date: date ?? new Date().toISOString(),
          ...parsedItem,
          level: convertLevel(type),
        }),
        hostname: typeof hostname === 'string' ? hostname : undefined,
      })),
  });

export class DataDogReporter {
  stream: Writable;

  constructor(config: LogStreamConfig<LogObject>) {
    this.stream = getDataDogStream(config);
  }

  log(logObj: LogObject) {
    if (!this.stream.writableEnded)
      this.stream.write(`${JSON.stringify(logObj)}\n`);
  }
}
