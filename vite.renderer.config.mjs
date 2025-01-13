import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path'

// https://vitejs.dev/config
export default defineConfig({
  plugins: [vue()],
  resolve: { 
    alias: { 
      '@': resolve(__dirname, 'src'), 
      'chessground': resolve(__dirname, 'node_modules/chessground') 
    } 
  },
  build: { 
    outDir: '.vite/renderer/main_window', 
    
}
});
