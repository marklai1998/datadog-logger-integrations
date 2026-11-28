import { Writable } from 'node:stream';
import { promisify } from 'node:util';
import { deflate } from 'node:zlib';
import type {
  DataDogClientConfig,
  DataDogServerConfig,
  HTTPLogItem,
  LogMessageBuilder,
} from './types/index.js';
import { parseStreamLine } from './utils/parseStreamLine';

const deflateAsync = promisify(deflate);

export class DataDogWritableStream<
  T = Record<string, unknown>,
> extends Writable {
  batch: HTTPLogItem[] = [];
  timer?: NodeJS.Timeout;
  readonly endpoint: string;
  readonly apiKey?: string;

  flushJob?: Promise<void>;

  constructor(
    private readonly config: {
      ddClientConfig?: DataDogClientConfig;
      ddServerConfig?: DataDogServerConfig;
      sendIntervalMs?: number;
      batchSize?: number;
      debug?: boolean;
      logMessageBuilder: LogMessageBuilder<T>;
    },
  ) {
    super({ objectMode: true });

    this.apiKey =
      config.ddClientConfig?.authMethods?.apiKeyAuth ?? process.env.DD_API_KEY;

    const site =
      config.ddServerConfig?.site ?? process.env.DD_SITE ?? 'datadoghq.com';
    const subdomain = config.ddServerConfig?.subdomain ?? 'http-intake.logs';
    this.endpoint = `https://${subdomain}.${site}/api/v2/logs`;

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

  async flush(batch: HTTPLogItem[]) {
    if (this.config.debug) {
      console.log(`[DataDogWritableStream] Flush: ${JSON.stringify(batch)}`);
    }

    if (batch.length === 0) return;

    try {
      const body = JSON.stringify(batch);
      if (this.config.debug) {
        console.log(`[DataDogWritableStream] Outgoing body: ${body}`);
      }

      if (!this.apiKey) {
        throw new Error(
          'Missing Datadog API key: set ddClientConfig.authMethods.apiKeyAuth or DD_API_KEY',
        );
      }

      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Content-Encoding': 'deflate',
          'DD-API-KEY': this.apiKey,
        },
        body: await deflateAsync(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(
          `Datadog log intake responded ${res.status} ${res.statusText}: ${text}`,
        );
      }
      if (this.config.debug) {
        console.log('[DataDogWritableStream] Log sent');
      }
    } catch (err) {
      console.error('[DataDogWritableStream] Batch send failed:', err);
    }
  }
}
