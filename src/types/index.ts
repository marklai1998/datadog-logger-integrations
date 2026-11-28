/**
 * A single log entry accepted by the Datadog HTTP log intake.
 * @see https://docs.datadoghq.com/api/latest/logs/#send-logs
 */
export type HTTPLogItem = {
  ddsource?: string;
  ddtags?: string;
  hostname?: string;
  message: string;
  service?: string;
  [key: string]: unknown;
};

export type LogMessageBuilder<T = Record<string, unknown>> = (
  log: T,
) => HTTPLogItem;

export type DataDogClientConfig = {
  authMethods?: {
    /** Datadog API key. Falls back to the `DD_API_KEY` environment variable. */
    apiKeyAuth?: string;
  };
};

export type DataDogServerConfig = {
  /** Datadog site, e.g. `datadoghq.eu`. Falls back to `DD_SITE`, then `datadoghq.com`. */
  site?: string;
  /** Intake subdomain. Defaults to `http-intake.logs`. */
  subdomain?: string;
  /** Kept for backward compatibility; the intake is always reached over https. */
  protocol?: string;
};

export type LogStreamConfig<T = Record<string, unknown>> = {
  ddClientConfig?: DataDogClientConfig;
  ddServerConfig?: DataDogServerConfig;
  ddSource?: string;
  ddTags?: string;
  service?: string;
  sendIntervalMs?: number;
  batchSize?: number;
  logMessageBuilder?: LogMessageBuilder<T>;

  debug?: boolean;
};
