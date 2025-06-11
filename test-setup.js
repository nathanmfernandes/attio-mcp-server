// Test setup for bun
import { beforeAll } from 'bun:test';

beforeAll(() => {
  // Load environment variables for tests
  if (typeof process !== 'undefined' && process.loadEnvFile) {
    try {
      process.loadEnvFile('.env');
    } catch (e) {
      // .env file doesn't exist, that's ok
    }
  }
});