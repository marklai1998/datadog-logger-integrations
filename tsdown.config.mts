import { defineConfig, type UserConfig } from 'tsdown';

const entry = {
  index: 'src/index.ts',
  'bunyan/index': 'src/bunyan/index.ts',
  'consola/index': 'src/consola/index.ts',
  'electronLog/index': 'src/electronLog/index.ts',
  'pino/index': 'src/pino/index.ts',
  'winston/index': 'src/winston/index.ts',
};

const shared: UserConfig = {
  entry,
  platform: 'node',
  target: 'node18',
  sourcemap: true,
  dts: true,
  // pino entry mixes named + default exports (default is the pino transport)
  outputOptions: { exports: 'named' },
};

export default defineConfig([
  {
    ...shared,
    format: 'esm',
    outDir: 'dist/esm',
    outExtensions: () => ({ js: '.mjs', dts: '.d.ts' }),
  },
  {
    ...shared,
    format: 'cjs',
    outDir: 'dist/cjs',
    outExtensions: () => ({ js: '.cjs', dts: '.d.cts' }),
  },
]);
