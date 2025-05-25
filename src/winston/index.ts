import split2 from 'split2';
import {
  DataDogWritableStream,
  type LogStreamConfig,
} from '../DataDogWritableStream.js';
import { convertLevel } from '../utils/index.js';

export default (config: LogStreamConfig) => {
  const dd = new DataDogWritableStream(config);

  const parser = split2((line: string) => {
    try {
      const parsedItem = JSON.parse(line);

      return config.logMessageBuilder
        ? config.logMessageBuilder(parsedItem)
        : {
            ddsource: config.ddSource,
            ddtags: config.ddTags,
            service: config.service,
            message: JSON.stringify({
              date: new Date().toISOString(),
              ...parsedItem,
              level: convertLevel(parsedItem.level),
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
