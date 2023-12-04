import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      // {
      //   find: /^@hykj-js\/vue3-element-ui$/,
      //   replacement: path.resolve('../packages/element-ui', 'index'),
      // },
    ],
  },
})
