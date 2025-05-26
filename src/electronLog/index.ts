import type { LevelOption, LogMessage, TransformFn } from 'electron-log';
import {
  DataDogWritableStream,
  type LogStreamConfig,
} from '../DataDogWritableStream.js';
import { convertLevel } from '../utils/index.js';

export const getDataDogStream = (config: LogStreamConfig<LogMessage>) => {
  const dd = new DataDogWritableStream<LogMessage>({
    ...config,
    logMessageBuilder:
      config.logMessageBuilder ??
      ((input) => {
        if (config.debug) {
          console.log(
            `[DataDogWritableStream] Log received ${JSON.stringify(input)}`,
          );
        }
        const { level, date, ...parsedItem } = input;
        return {
          ddsource: config.ddSource,
          ddtags: config.ddTags,
          service: config.service,
          message: JSON.stringify({
            date: date ?? new Date().toISOString(),
            ...parsedItem,
            level: convertLevel(level),
          }),
        };
      }),
  });

  return dd;
};

export const dataDogTransport = (
  {
    level = 'info' as const,
    transforms = [],
  }: { level?: LevelOption; transforms?: TransformFn[] },
  config: LogStreamConfig<LogMessage>,
) => {
  const stream = getDataDogStream(config);

  const transport = (message: LogMessage) => {
    stream.write(message);
  };
  transport.level = level;
  transport.transforms = transforms;

  return transport;
};
