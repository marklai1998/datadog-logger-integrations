import { inflateSync } from 'node:zlib';
import { http } from 'msw';
import { setupServer } from 'msw/node';
import { DataDogWritableStream } from '../DataDogWritableStream.js';

const server = setupServer();

const end = (stream: DataDogWritableStream) =>
  new Promise<void>((resolve) => {
    stream.on('close', () => resolve());
    stream.end();
  });

describe('DataDogWritableStream', () => {
  beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
  afterAll(() => server.close());
  afterEach(() => {
    server.resetHandlers();
    vi.unstubAllEnvs();
  });

  it('posts a deflated JSON batch with the API key header', async () => {
    const received: { headers: Headers; body: unknown }[] = [];
    server.use(
      http.post(
        'https://http-intake.logs.datadoghq.eu/api/v2/logs',
        async ({ request }) => {
          const raw = Buffer.from(await request.arrayBuffer());
          received.push({
            headers: request.headers,
            body: JSON.parse(inflateSync(raw).toString()),
          });
          return new Response(null, { status: 202 });
        },
      ),
    );

    const stream = new DataDogWritableStream({
      ddClientConfig: { authMethods: { apiKeyAuth: 'key-123' } },
      ddServerConfig: { site: 'datadoghq.eu' },
      sendIntervalMs: 0,
      logMessageBuilder: (log) => ({
        message: JSON.stringify(log),
        service: 'svc',
      }),
    });

    stream.write({ msg: 'hello' });
    await end(stream);

    expect(received).toHaveLength(1);
    expect(received[0].headers.get('dd-api-key')).toBe('key-123');
    expect(received[0].headers.get('content-encoding')).toBe('deflate');
    expect(received[0].headers.get('content-type')).toBe('application/json');
    expect(received[0].body).toEqual([
      { message: JSON.stringify({ msg: 'hello' }), service: 'svc' },
    ]);
  });

  it('falls back to DD_API_KEY and DD_SITE env vars', async () => {
    vi.stubEnv('DD_API_KEY', 'env-key');
    vi.stubEnv('DD_SITE', 'us5.datadoghq.com');
    const apiKey = vi.fn();
    server.use(
      http.post(
        'https://http-intake.logs.us5.datadoghq.com/api/v2/logs',
        ({ request }) => {
          apiKey(request.headers.get('dd-api-key'));
          return new Response(null, { status: 202 });
        },
      ),
    );

    const stream = new DataDogWritableStream({
      sendIntervalMs: 0,
      logMessageBuilder: (log) => ({ message: JSON.stringify(log) }),
    });
    stream.write({ msg: 'hello' });
    await end(stream);

    expect(apiKey).toHaveBeenCalledWith('env-key');
  });

  it('logs and swallows non-2xx responses', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    server.use(
      http.post(
        'https://http-intake.logs.datadoghq.com/api/v2/logs',
        () => new Response('{"errors":["Forbidden"]}', { status: 403 }),
      ),
    );

    const stream = new DataDogWritableStream({
      ddClientConfig: { authMethods: { apiKeyAuth: 'bad' } },
      sendIntervalMs: 0,
      logMessageBuilder: (log) => ({ message: JSON.stringify(log) }),
    });
    stream.write({ msg: 'hello' });
    await end(stream);

    expect(error).toHaveBeenCalledWith(
      '[DataDogWritableStream] Batch send failed:',
      expect.objectContaining({ message: expect.stringContaining('403') }),
    );
    error.mockRestore();
  });
});
