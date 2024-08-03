import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "url";

import Icons from "unplugin-icons/vite";
import VueDevTools from "vite-plugin-vue-devtools";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  return {
    plugins: [
      // base vue support
      vue(),
      // iconify support
      Icons({}),
      // vue devtools
      VueDevTools(),
      // auto import
      AutoImport({
        imports: ["vue", "vue-router", "pinia"],
        resolvers: [ElementPlusResolver()],
        dts: "src/auto-imports.d.ts",
      }),
      // vue auto components
      Components({
        resolvers: [ElementPlusResolver()],
        dts: "src/components.d.ts",
      }),
    ],
    resolve: {
      alias: [
        // base ./src alias
        {
          find: "@",
          replacement: fileURLToPath(new URL("./src", import.meta.url)),
        },
        // {
        //   find: '@hykj-js/vue3-element-plus',
        //   replacement: fileURLToPath(new URL("../packages/element-plus/index.ts", import.meta.url)),
        // },
      ],
    },
    server: {
      port: 50000,
    }
  };
});
