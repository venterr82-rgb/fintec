import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  // Needed so .tsx test/source files actually get JSX-transformed under
  // Vitest — tsconfig sets jsx: "preserve" (Next.js transforms it via SWC
  // instead), and this project's Vite/Rolldown pipeline doesn't honor a
  // plain esbuild.jsx override for that.
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
