import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import terser from '@rollup/plugin-terser';
import license from 'rollup-plugin-license';

export default defineConfig({
  build: {
    minify: false,
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      output: {
        plugins: [
          license({
            banner: '@license\nCopyright 2019 KNOWLEDGECODE\nSPDX-License-Identifier: MIT'
          }),
          terser()
        ]
      }
    }
  },
  plugins: [
    dts({
      include: ['src/**/*']
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
