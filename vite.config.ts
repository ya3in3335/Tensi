import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Older Android browsers: modern syntax is rewritten to what Chrome 64 / Safari 12 understand.
  build: { sourcemap: false, target: ['es2018', 'chrome64', 'safari12', 'firefox68'] },
  test: { environment: 'jsdom' },
} as never);
