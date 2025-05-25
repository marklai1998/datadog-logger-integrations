import { faker } from '@faker-js/faker';
import { http } from 'msw';
import { setupServer } from 'msw/node';
import { expect } from 'vitest';
import winston from 'winston';
import { DataDogTransport } from '../index.js';
const server = setupServer();

describe('DataDogTransport', () => {
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

    const logger = winston.createLogger({
      level: 'debug',
      transports: [
        new DataDogTransport({
          ddClientConfig: {
            authMethods: {
              apiKeyAuth: apiKey,
            },
          },
          ddTags: 'env:test',
          ddSource: faker.string.uuid(),
          service: faker.string.uuid(),
          debug: true,
        }),
      ],
    });

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

    await new Promise((resolve) => setTimeout(resolve, 5000));

    expect(api).toBeCalledTimes(1);
  }, 20000);

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

    const logger = winston.createLogger({
      level: 'debug',
      transports: [
        new DataDogTransport({
          ddClientConfig: {
            authMethods: {
              apiKeyAuth: apiKey,
            },
          },
          ddTags: 'env:test',
          ddSource: faker.string.uuid(),
          service: faker.string.uuid(),
          debug: true,
        }),
      ],
    });

    logger.info('test');
    logger.info('test');
    logger.info('test');
    logger.info('test');
    logger.info('test');

    await new Promise((resolve) => setTimeout(resolve, 5000));

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

    const logger = winston.createLogger({
      level: 'debug',
      transports: [
        new DataDogTransport({
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
        }),
      ],
    });

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

    await new Promise((resolve) => setTimeout(resolve, 12000));

    expect(api).toBeCalledTimes(10);
  }, 20000);
});
