# Datadog Logger Integrations

<div align="center">

"Transport" for popular logger such as [Pino](https://github.com/pinojs/pino) and [Winston](https://github.com/winstonjs/winston)

![NPM](https://img.shields.io/npm/v/datadog-logger-integrations) ![GitHub CI](https://github.com/marklai1998/datadog-logger-integrations/actions/workflows/runTest.yml/badge.svg) [![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org) [![npm type definitions](https://img.shields.io/npm/types/typescript.svg)](https://www.typescriptlang.org/)

[Features](#-features) | [Installation](#-installation) |[API](#-api) | [Contributing](#-contributing)

</div>

## ✨ Features

- ✅ Typescript
- ✅ Datadog V2 API
- ✅ Batching log
- ✅ Lambda support

## 📦 Installation

### NPM

```bash
npm i datadog-logger-integrations
```

### Yarn

```
yarn add datadog-logger-integrations
```

### PNPM

```
pnpm i datadog-logger-integrations
```

## 💻 API

- [Integrations](#Integrations)
  - [Pino](#pino)
    - [With Transport API](#with-transport-api)
    - [With Stream API](#with-stream-api)
  - [Winston](#winston)
- [Types](#types)
  - [LogStreamConfig](#LogStreamConfig)
- [Usage with Lambda](#usage-with-lambda)

### Integrations

#### Pino

> [!NOTE]  
> If you are using it [with lambda](#usage-with-lambda), you must use the Stream API

##### With [Transport API](https://getpino.io/#/docs/api?id=pinotransportoptions-gt-threadstream)

```ts
import { LogStreamConfig } from 'datadog-logger-integrations'

const options: LogStreamConfig = {
    ddClientConfig: {
        authMethods: {
            apiKeyAuth: apiKey,
        },
    },
    ddTags: 'env:test',
    ddSource: "my source",
    service: "my service",
}

const logger = pino(
    {
        level: 'debug',
    },
    pino.transport({
      target: 'datadog-logger-integrations/pino',
      options
    }),
);

logger.info('test');
```

##### With [Stream API](https://getpino.io/#/docs/api?id=pinomultistreamstreamsarray-opts-gt-multistreamres)

```ts
import { LogStreamConfig } from 'datadog-logger-integrations'
import { getDataDogStream } from 'datadog-logger-integrations/pino'

const opts: LogStreamConfig = {
    ddClientConfig: {
        authMethods: {
            apiKeyAuth: apiKey,
        },
    },
    ddTags: 'env:test',
    ddSource: "my source",
    service: "my service",
}

const stream = getDataDogStream(opts);

const logger = pino(
    {
        level: 'debug',
    },
    pino.multistream([stream]),
);

logger.info('test');
```

#### Winston

```ts
import { LogStreamConfig } from 'datadog-logger-integrations'
import { getDataDogStream } from 'datadog-logger-integrations/winston'

const opts: LogStreamConfig = {
    ddClientConfig: {
        authMethods: {
            apiKeyAuth: apiKey,
        },
    },
    ddTags: 'env:test',
    ddSource: "my source",
    service: "my service",
}

const stream = getDataDogStream(opts);

const logger = winston.createLogger({
    level: 'debug',
    transports: [
        new winston.transports.Stream({
            stream,
        }),
    ],
});

logger.info('test');
```

### Types

#### LogStreamConfig

```ts
export type LogStreamConfig = {
    ddClientConfig?: Record<string, any>; // @datadog/datadog-api-client createConfiguration option
    ddServerConfig?: {  // @datadog/datadog-api-client setServerVariables option
        site?: string;
        subdomain?: string;
        protocol?: string;
    };
    ddSource?: string;
    ddTags?: string;
    service?: string;
    
    sendIntervalMs?: number;
    batchSize?: number;
    
    logMessageBuilder?: (
        log: Record<string, unknown>,
    ) => v2.LogsApiSubmitLogRequest['body'][number];

    debug?: boolean;
};
```

### Usage with Lambda

Due to the fact that datadog is an async call, it is possible for a short living function to end before the logs are sent out.
You will have to manually wait for the stream to end.

These examples are with pino, but other integrations work the same way

#### Example with [Explicit Resource Management](https://github.com/tc39/proposal-explicit-resource-management), require [Node 20.4.0+](https://nodejs.org/en/blog/release/v20.4.0)

```ts
import { getDataDogStream } from 'datadog-logger-integrations/pino'

const getLogger = () => {
    const stream = getDataDogStream(opts);

    const instance = pino(
        { level: 'debug' },
        pino.multistream([stream]),
    );
    
    return {
      instance,
      [Symbol.asyncDispose]: async () => {
        // Wait for the stream to fully drain
        await new Promise<void>((resolve) => {
          stream.on('close', () => {
            resolve();
          });

          stream.end();
        });
      }
    }
}

export const handler = async () => {
  await using logger = getLogger();

  logger.instance.info("Hello")
  
  return {};
};
```

#### Example for Node < Node 20.4.0
```ts
import { getDataDogStream } from 'datadog-logger-integrations/pino'

export const handler = async () => {
  const stream = getDataDogStream(opts);

  const logger = pino(
    { level: 'debug' },
    pino.multistream([stream]),
  );

  logger.info('test');

  // Wait for the stream to fully drain
  await new Promise<void>((resolve) => {
    stream.on('close', () => {
      resolve();
    });

    stream.end();
  });
  
  return {};
};

```

## 🤝 Contributing

### Development

#### Local Development

```bash
pnpm i
pnpm test
```

#### Build

```bash
pnpm build
```

### Release

This repo uses [Release Please](https://github.com/google-github-actions/release-please-action) to release.

#### To release a new version

1. Merge your changes into the `main` branch.
2. An automated GitHub Action will run, triggering the creation of a Release PR.
3. Merge the release PR.
4. Wait for the second GitHub Action to run automatically.
5. Congratulations, you're all set!
