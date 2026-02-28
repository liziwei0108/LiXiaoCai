import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 自动导入 Vue 和 Vant 的 API (如 ref, showToast 等)
    AutoImport({
      imports: ['vue'],
      resolvers: [
        // 用于自动导入 Vant 的函数式 API (如 showLoadingToast)
        (name) => {
          if (name.startsWith('show') || name.startsWith('close')) {
            return { from: 'vant' }
          }
        },
      ],
    }),
    // 自动导入 Vant 组件 (如 van-button)
    Components({
      resolvers: [VantResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
    // 关键步骤！添加 .mjs 扩展名，确保 Vite 能正确解析 Vant 的模块文件 [citation:2]
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})