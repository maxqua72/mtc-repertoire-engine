//import { defineConfig } from 'vite';

// https://vitejs.dev/config
//export default defineConfig({});
import { defineConfig } from 'vite';
import { builtinModules } from 'module';
import path from 'path';
import copy from 'rollup-plugin-copy';

export default defineConfig({
  
  root: path.resolve(__dirname, 'src/main'),
  build: {
    outDir: path.resolve(__dirname, '../.vite/build'),
    lib: {
      entry: 'main.js',
      //formats: ['cjs'],
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        ...builtinModules,
      ],
      plugins: [
        copy({
          targets: [
            { src: 'src/main/main.js', dest: '.vite/build' },
            { src: 'src/main/server.js', dest: '.vite/build' },
            { src: 'src/main/updater.js', dest: '.vite/build' }
          ]
        })
      ]
    },
  },
  

 
});
