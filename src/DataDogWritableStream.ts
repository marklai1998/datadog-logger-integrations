import { Writable } from 'node:stream';
import { client, v2 } from '@datadog/datadog-api-client';
import type { LogMessageBuilder } from './types/index.js';
import { parseStreamLine } from './utils/parseStreamLine';

export class DataDogWritableStream<
  T = Record<string, unknown>,
> extends Writable {
  apiInstance: v2.LogsApi;
  batch: v2.HTTPLogItem[] = [];
  timer?: NodeJS.Timeout;

  flushJob?: Promise<void>;

  constructor(
    private readonly config: {
      ddClientConfig?: Parameters<typeof client.createConfiguration>[0];
      ddServerConfig?: {
        site?: string;
        subdomain?: string;
        protocol?: string;
      };
      sendIntervalMs?: number;
      batchSize?: number;
      debug?: boolean;
      logMessageBuilder: LogMessageBuilder<T>;
    },
  ) {
    super({ objectMode: true });

    const clientConfig = client.createConfiguration(this.config.ddClientConfig);
    if (config.ddServerConfig) {
      clientConfig.setServerVariables(config.ddServerConfig);
    }

    this.apiInstance = new v2.LogsApi(clientConfig);

    this.timer =
      this.config.sendIntervalMs !== 0
        ? setInterval(async () => {
            const batchToSend = this.batch;
            this.batch = [];
            this.flushJob = this.flush(batchToSend).finally(() => {
              this.flushJob = undefined;
            });
          }, this.config.sendIntervalMs ?? 3000)
        : undefined;
  }

  override async _write(
    item: string | string[] | object,
    _encoding: unknown,
    callback: (err?: Error | null) => void,
  ) {
    if (this.config.debug) {
      console.log(`[DataDogWritableStream] Log received: ${item}`);
    }
    const parsedItems = parseStreamLine<T>(item);
    if (this.config.debug) {
      console.log(
        `[DataDogWritableStream] Parsed item: ${JSON.stringify(parsedItems)}`,
      );
    }
    const transformed = parsedItems.map(this.config.logMessageBuilder);
    if (this.config.debug) {
      console.log(
        `[DataDogWritableStream] Enqueue: ${JSON.stringify(transformed)}`,
      );
    }
    this.batch.push(...transformed);

    if (
      this.batch.length >= (this.config?.batchSize ?? 10) ||
      this.config.sendIntervalMs === 0
    ) {
      const batchToSend = this.batch;
      this.batch = [];
      await this.flush(batchToSend);
    }
    callback();
  }

  override async _final(callback: (err?: Error | null) => void) {
    clearInterval(this.timer); // Clean up the interval
    try {
      if (this.config.debug) {
        console.log('[DataDogWritableStream] _final flush');
      }

      if (this.flushJob) {
        await this.flushJob;
      } else {
        const batchToSend = this.batch;
        this.batch = [];

        await this.flush(batchToSend);
      }

      callback();
    } catch (err) {
      callback(err instanceof Error ? err : new Error(JSON.stringify(err)));
    }
  }

  async flush(batch: v2.HTTPLogItem[]) {
    if (this.config.debug) {
      console.log(`[DataDogWritableStream] Flush: ${JSON.stringify(batch)}`);
    }

    if (batch.length === 0) return;

    try {
      const params: v2.LogsApiSubmitLogRequest = {
        body: batch,
        contentEncoding: 'deflate',
      };
      if (this.config.debug) {
        console.log(
          `[DataDogWritableStream] Outgoing param: ${JSON.stringify(params)}`,
        );
      }
      await this.apiInstance.submitLog(params);
      if (this.config.debug) {
        console.log('[DataDogWritableStream] Log sent');
      }
    } catch (err) {
      console.error('[DataDogWritableStream] Batch send failed:', err);
    }
  }
}
