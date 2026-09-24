import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5179, strictPort: true, host: '127.0.0.1' },
  optimizeDeps: {
    // rapier3d-compat 内联 WASM，必须排除预构建否则 base64 会被处理坏
    exclude: ['@dimforge/rapier3d-compat'],
  },
  build: { target: 'es2022' },
});
