import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./test/setupEnv.js'],
    testTimeout: 15000,
    exclude: ['**/node_modules/**', '**/frontend/**'],
    // Os testes de integração compartilham um único Postgres de teste e
    // fazem TRUNCATE entre casos — rodar arquivos em paralelo causa
    // deadlocks e vazamento de estado entre suites.
    fileParallelism: false,
  },
});
