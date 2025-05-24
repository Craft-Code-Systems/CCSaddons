// vite.config.js
import { defineConfig } from 'vitest/config.js';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: true
  }
});
