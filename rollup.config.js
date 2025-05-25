import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import { nodeExternals } from 'rollup-plugin-node-externals';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

const input = {
  index: 'src/index.ts',
  'pino/index': 'src/pino/index.ts',
  'winston/index': 'src/winston/index.ts',
};

export default [
  {
    input,
    plugins: [nodeExternals(), peerDepsExternal(), esbuild()],
    output: [
      {
        dir: 'dist/esm',
        format: 'es',
        sourcemap: true,
        entryFileNames: '[name].mjs',
        chunkFileNames: '[name]-[hash].mjs',
      },
      {
        dir: 'dist/cjs',
        format: 'cjs',
        interop: 'auto',
        sourcemap: true,
        entryFileNames: '[name].cjs',
        chunkFileNames: '[name]-[hash].cjs',
      },
    ],
  },
  {
    input,
    plugins: [
      dts({
        compilerOptions: {
          // https://github.com/Swatinem/rollup-plugin-dts/issues/143
          preserveSymlinks: false,
        },
      }),
    ],
    output: [
      {
        dir: 'dist/esm',
        format: 'es',
      },
      {
        dir: 'dist/cjs',
        format: 'cjs',
        interop: 'auto',
        entryFileNames: '[name].d.cts',
        chunkFileNames: '[name]-[hash].d.cts',
      },
    ],
  },
];
