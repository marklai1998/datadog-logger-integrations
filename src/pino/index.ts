import {
  DataDogWritableStream,
  type LogStreamConfig,
} from '../DataDogWritableStream.js';
import { convertLevel } from '../utils/index.js';

export type LogType = {
  level: number;
  time: number;
  hostname: string;
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
            date: time ? new Date(time) : new Date().toISOString(),
            ...parsedItem,
            level: convertLevel(level),
          }),
          hostname,
        };
      }),
  });

// Default export for transport API
export default getDataDogStream;
