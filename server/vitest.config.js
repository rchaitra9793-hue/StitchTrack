import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      DB_FILE: ':memory:',
      OWNER_PASSWORD: 'test-password',
      JWT_SECRET: 'test-secret',
    },
  },
});
