import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: playwright({
      }),
      instances: [
        {
          browser: 'chromium',
          headless: true
        }
      ]
    },
    globals: true,
    setupFiles: ['./tests/setup.ts']
  }
});
