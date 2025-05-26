import type { client, v2 } from '@datadog/datadog-api-client';

export type LogMessageBuilder<T = Record<string, unknown>> = (
  log: T,
) => v2.HTTPLogItem;

export type LogStreamConfig<T = Record<string, unknown>> = {
  ddClientConfig?: Parameters<typeof client.createConfiguration>[0];
  ddServerConfig?: {
    site?: string;
    subdomain?: string;
    protocol?: string;
  };
  ddSource?: string;
  ddTags?: string;
  service?: string;
  sendIntervalMs?: number;
  batchSize?: number;
  logMessageBuilder?: LogMessageBuilder<T>;

  debug?: boolean;
};
