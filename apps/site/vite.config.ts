import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(rootDir, '../..')

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: path.resolve(workspaceRoot, 'node_modules/react'),
      'react-dom': path.resolve(workspaceRoot, 'node_modules/react-dom'),
    },
  },
  server: { port: 4174 },
})
