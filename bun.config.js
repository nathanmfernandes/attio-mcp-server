import { define } from 'bun';

export default define({
  test: {
    root: './src',
    coverage: {
      enabled: true,
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/__tests__/**/*'],
    },
  },
  preload: ['./test-setup.js'],
});
