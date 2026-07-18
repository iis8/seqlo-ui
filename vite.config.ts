import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
      cleanVueFileName: true,
      // 将 .vue.d.ts 收敛为 .d.ts，让 import 'xxx.vue' 走默认导出
      staticImport: true,
      copyDtsFiles: true,
    }),
  ],
  resolve: {
    alias: {
      '@seqlo/ui': resolve(__dirname, 'src/index.ts'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SeqloUI',
      fileName: (format) => (format === 'es' ? 'seqlo-ui.js' : 'seqlo-ui.umd.cjs'),
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: [
        'vue',
        'element-plus',
        '@element-plus/icons-vue',
        'lodash-es',
        'sortablejs',
        'vue-router',
        'vue-i18n',
      ],
      output: {
        globals: {
          vue: 'Vue',
          'element-plus': 'ElementPlus',
          '@element-plus/icons-vue': 'ElementPlusIconsVue',
          'lodash-es': 'lodashEs',
          sortablejs: 'Sortable',
          'vue-router': 'VueRouter',
          'vue-i18n': 'VueI18n',
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'style.css'
          }
          return assetInfo.name || 'asset-[hash][extname]'
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
})
