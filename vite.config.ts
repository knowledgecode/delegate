import { defineConfig } from 'vite';
import terser from '@rollup/plugin-terser';
import license from 'rollup-plugin-license';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es']
    },
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',
        plugins: [
          terser(),
          license({
            banner: '@license\nCopyright 2019 KNOWLEDGECODE\nSPDX-License-Identifier: MIT'
          })
        ]
      }
    }
  }
});
