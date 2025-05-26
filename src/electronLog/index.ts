import type { LevelOption, LogMessage, TransformFn } from 'electron-log';
import { DataDogWritableStream } from '../DataDogWritableStream.js';
import type { LogStreamConfig } from '../types';
import { convertLevel } from '../utils/index.js';

export const getDataDogStream = (config: LogStreamConfig<LogMessage>) =>
  new DataDogWritableStream<LogMessage>({
    ...config,
    logMessageBuilder:
      config.logMessageBuilder ??
      (({ level, date, ...parsedItem }) => ({
        ddsource: config.ddSource,
        ddtags: config.ddTags,
        service: config.service,
        message: JSON.stringify({
          date: date ?? new Date().toISOString(),
          ...parsedItem,
          level: convertLevel(level),
        }),
      })),
  });

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
