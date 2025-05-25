import { faker } from '@faker-js/faker';
import { http } from 'msw';
import { setupServer } from 'msw/node';
import { pino } from 'pino';
import { expect } from 'vitest';
import ddStream from '../index.js';
const server = setupServer();

describe('logger', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  afterAll(() => server.close());

  afterEach(() => server.resetHandlers());

  it('send logs', async () => {
    const api = vi.fn();

    server.use(
      http.post(
        'https://http-intake.logs.datadoghq.com/api/v2/logs',
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          api();
          return new Response(null, { status: 200 });
        },
      ),
    );

    const apiKey = faker.string.uuid();

    const stream = ddStream({
      ddClientConfig: {
        authMethods: {
          apiKeyAuth: apiKey,
        },
      },
      ddTags: 'env:test',
      ddSource: faker.string.uuid(),
      service: faker.string.uuid(),
      debug: true,
    });

    const logger = pino(
      {
        level: 'debug',
      },
      pino.multistream([stream]),
    );

    logger.info('test');
    logger.info('test');
    logger.info('test');
    logger.info('test');
    logger.info('test');
    logger.info('test');
    logger.info('test');
    logger.info('test');
    logger.info('test');
    logger.info('test');

    await new Promise<void>((resolve) => {
      stream?.on('close', () => {
        resolve();
      });

      stream?.end();
    });

    expect(api).toBeCalledTimes(1);
  });

  it('send logs with interval', async () => {
    const api = vi.fn();

    server.use(
      http.post(
        'https://http-intake.logs.datadoghq.com/api/v2/logs',
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          api();
          return new Response(null, { status: 200 });
        },
      ),
    );

    const apiKey = faker.string.uuid();

    const stream = ddStream({
      ddClientConfig: {
        authMethods: {
          apiKeyAuth: apiKey,
        },
      },
      ddTags: 'env:test',
      ddSource: faker.string.uuid(),
      service: faker.string.uuid(),
      debug: true,
      sendIntervalMs: 5000,
    });

    const logger = pino(
      {
        level: 'debug',
      },
      pino.multistream([stream]),
    );

    logger.info('test');
    logger.info('test');
    logger.info('test');
    logger.info('test');
    logger.info('test');

    await new Promise((resolve) => setTimeout(resolve, 8000));

    await new Promise<void>((resolve) => {
      stream?.on('close', () => {
        resolve();
      });

      stream?.end();
    });

    expect(api).toBeCalledTimes(1);
  }, 20000);

  it('send logs with interval, race condition', async () => {
    const api = vi.fn();

    server.use(
      http.post(
        'https://http-intake.logs.datadoghq.com/api/v2/logs',
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          api();
          return new Response(null, { status: 200 });
        },
      ),
    );

    const apiKey = faker.string.uuid();

    const stream = ddStream({
      ddClientConfig: {
        authMethods: {
          apiKeyAuth: apiKey,
        },
      },
      ddTags: 'env:test',
      ddSource: faker.string.uuid(),
      service: faker.string.uuid(),
      debug: true,
      sendIntervalMs: 5000,
    });

    const logger = pino(
      {
        level: 'debug',
      },
      pino.multistream([stream]),
    );

    logger.info('test');
    logger.info('test');
    logger.info('test');
    logger.info('test');
    logger.info('test');

    await new Promise((resolve) => setTimeout(resolve, 5000));

    await new Promise<void>((resolve) => {
      stream?.on('close', () => {
        resolve();
      });

      stream?.end();
    });

    expect(api).toBeCalledTimes(1);
  }, 20000);

  it('send immediately', async () => {
    const api = vi.fn();

    server.use(
      http.post(
        'https://http-intake.logs.datadoghq.com/api/v2/logs',
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          api();
          return new Response(null, { status: 200 });
        },
      ),
    );

    const apiKey = faker.string.uuid();

    const stream = ddStream({
      ddClientConfig: {
        authMethods: {
          apiKeyAuth: apiKey,
        },
      },
      ddTags: 'env:test',
      ddSource: faker.string.uuid(),
      service: faker.string.uuid(),
      debug: true,
      sendIntervalMs: 0,
    });

    const logger = pino(
      {
        level: 'debug',
      },
      pino.multistream([stream]),
    );

    logger.info('test');
    logger.info('test');
    logger.info('test');
    logger.info('test');
    logger.info('test');
    logger.info('test');
    logger.info('test');
    logger.info('test');
    logger.info('test');
    logger.info('test');

    await new Promise<void>((resolve) => {
      stream?.on('close', () => {
        resolve();
      });

      stream?.end();
    });

    expect(api).toBeCalledTimes(10);
  }, 20000);
});
