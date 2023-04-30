import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    reporer: 'list',
    use: {
        baseURL: 'http://127.0.0.1:3000'
    },
    webServer: {
        command: 'npx http-server -c-1 -p 3000',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: true
    }
});
