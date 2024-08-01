import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { checkGlobalExtendAfterDtsBuild } from '../../utils/afterDtsBuild'

export default defineConfig({
  build: {
    lib: {
      entry: 'index.ts',
      name: '@hykj-js/vue3-hooks',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['@hykj-js/shared', '@vueuse/core', 'vue', 'vue-demi' ],
      output: {
        globals: {
          '@hykj-js/shared': 'shared',
          '@vueuse/core': 'vueuse',
           vue: 'Vue',
           Ref: 'Ref'
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