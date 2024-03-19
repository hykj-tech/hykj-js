import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { checkGlobalExtendAfterDtsBuild } from '../utils/afterDtsBuild'

export default defineConfig({
  build: {
    lib: {
      entry: 'index.ts',
      name: '@hykj-js/shared',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: ['axios', 'dayjs', 'lodash-es', 'loglevel', 'qs'],
      output: {
        globals: {
          axios: 'axios',
          dayjs: 'dayjs',
          'lodash-es': 'lodash',
          loglevel: 'loglevel',
          qs: 'qs'
        }
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