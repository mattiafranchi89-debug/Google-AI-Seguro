import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
// Fix: Import 'process' to provide correct types for `process.cwd()` and resolve the type error.
import process from 'process'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    plugins: [react()],
  }
})
