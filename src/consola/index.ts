import type { Transform } from 'node:stream';
import type { LogObject } from 'consola';
import split2 from 'split2';
import {
  DataDogWritableStream,
  type LogStreamConfig,
} from '../DataDogWritableStream.js';

export const convertLevel = (level: number | string): string => {
  if (typeof level === 'string') return level;
  if (level === 0) return 'error';
  if (level === 1) return 'warning';
  if (level === 2) return 'info';
  if (level === 3) return 'info';
  if (level === 4) return 'debug';
  return 'trace';
};

export const getDataDogStream = (config: LogStreamConfig) => {
  const dd = new DataDogWritableStream(config);

  const parser = split2((line: string) => {
    try {
      // level is the log level of the logger, not interested
      const { type, date, level, ...parsedItem } = JSON.parse(line);

      return config.logMessageBuilder
        ? config.logMessageBuilder(parsedItem)
        : {
            ddsource: config.ddSource,
            ddtags: config.ddTags,
            service: config.service,
            message: JSON.stringify({
              date: date ?? new Date().toISOString(),
              ...parsedItem,
              level: convertLevel(type),
            }),
            hostname: parsedItem.hostname,
          };
    } catch (err) {
      console.error('[dataDogStream] Data parse failed:', err);
      return {};
    }
  });

  parser.pipe(dd);

  // Override _final of splitter to await DataDogWritableStream's _final
  const origFinal = parser._final.bind(parser);
  parser._final = (callback) => {
    dd.end(() => {
      origFinal(callback);
    });
  };

  return parser;
};

export class DataDogReporter {
  stream: Transform;

  constructor(config: LogStreamConfig) {
    this.stream = getDataDogStream(config);
  }

  log(logObj: LogObject) {
    if (!this.stream.writableEnded)
      this.stream.write(`${JSON.stringify(logObj)}\n`);
  }
}
