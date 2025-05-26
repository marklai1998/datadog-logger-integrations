import {
  DataDogWritableStream,
  type LogStreamConfig,
} from '../DataDogWritableStream.js';
import { convertLevel } from '../utils/index.js';

export type LogType = {
  hostname: string;
  level: number;
  time: string;
};

export const getDataDogStream = (config: LogStreamConfig<LogType>) =>
  new DataDogWritableStream<LogType>({
    ...config,
    logMessageBuilder:
      config.logMessageBuilder ??
      ((input) => {
        if (config.debug) {
          console.log(
            `[DataDogWritableStream] Log received ${JSON.stringify(input)}`,
          );
        }
        const { level, time, hostname, ...parsedItem } = input;
        return {
          ddsource: config.ddSource,
          ddtags: config.ddTags,
          service: config.service,
          message: JSON.stringify({
            date: time ?? new Date().toISOString(),
            ...parsedItem,
            level: convertLevel(level),
          }),
          hostname,
        };
      }),
  });
