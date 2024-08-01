import {defineConfig} from 'vite';
import dts from 'vite-plugin-dts';
//@ts-ignore
import {checkGlobalExtendAfterDtsBuild} from '../../../utils/afterDtsBuild';
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  define: {},
  build: {
    lib: {
      entry: 'index.ts',
      name: '@hykj-js/vue3-element-plus',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        '@hykj-js/shared',
        '@hykj-js/vue3-hooks',
        'axios',
        'byte-size',
        'element-plus',
        'vue',
        'mitt',
        'vue-demi'
      ],
      output: {
        globals: {
          '@hykj-js/shared': 'shared',
          '@hykj-js/vue3-hooks': 'vue3Hooks',
          axios: 'Axios',
          'byte-size': 'ByteSize',
          'element-plus': 'ElementPlus',
          mitt: 'mitt',
          vue: 'Vue',
        },
        chunkFileNames: '[name]-[hash].js',
      },
      plugins: [
        vue({}),
        dts({
          afterBuild: checkGlobalExtendAfterDtsBuild,
        }),
        vueJsx(),
      ],
    },
    minify: false,
    sourcemap: true,
    outDir: 'dist',
    assetsDir: '.',
    emptyOutDir: true,
  },
});
