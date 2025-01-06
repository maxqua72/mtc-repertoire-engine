import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [vue()],
  build: { 
    outDir: '.vite/renderer/main_window', 
    //emptyOutDir: true, 
    //rollupOptions: { 
        //input: 'src/renderer/index.html', 
        /*
        input: { 
          index: 'src/renderer/index.html', // Includi il file HTML principale 
          renderer: 'src/renderer/renderer.js', // Includi il file principale del renderer 
          assets: 'src/renderer/assets/', // Includi la directory assets 
          //components: 'src/renderer/components/', // Includi la directory components 
          //stores: 'src/renderer/stores/', // Includi la directory stores 
          //views: 'src/renderer/views/' // Includi la directory views 
        },
        */
        //output: { format: 'esm', },
    //}
}
});
