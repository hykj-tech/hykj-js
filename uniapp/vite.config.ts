import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { checkGlobalExtendAfterDtsBuild } from '../utils/afterDtsBuild'

export default defineConfig({
  build: {
    lib: {
      entry: 'index.ts',
      name: '@hykj-js/uniapp',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['axios', 'qs', '@hykj-js/shared', ],
      output: {
        globals: {
          axios: 'axios',
          qs: 'qs',
          '@hykj-js/shared': 'shared'
        },
        chunkFileNames: '[name]-[hash].js'
      },
      plugins: [
        dts({
          afterBuild: checkGlobalExtendAfterDtsBuild
        })
      ]
    },
    minify: false,
    sourcemap: true,
    outDir: 'dist',
    assetsDir: '.',
    emptyOutDir: true,
  }
})