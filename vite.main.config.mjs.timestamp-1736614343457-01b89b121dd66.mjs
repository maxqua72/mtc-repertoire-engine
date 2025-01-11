// vite.main.config.mjs
import { defineConfig } from "file:///C:/Users/max/Documents/VisualStudioCodeProj/mtc-repertoire-engine/node_modules/vite/dist/node/index.js";
import { builtinModules } from "module";
import path from "path";
import copy from "file:///C:/Users/max/Documents/VisualStudioCodeProj/mtc-repertoire-engine/node_modules/rollup-plugin-copy/dist/index.commonjs.js";
var __vite_injected_original_dirname = "C:\\Users\\max\\Documents\\VisualStudioCodeProj\\mtc-repertoire-engine";
var vite_main_config_default = defineConfig({
  root: path.resolve(__vite_injected_original_dirname, "src/main"),
  build: {
    outDir: path.resolve(__vite_injected_original_dirname, "../.vite/build"),
    lib: {
      entry: "main.js",
      //formats: ['cjs'],
      formats: ["es"]
    },
    rollupOptions: {
      external: [
        ...builtinModules
      ],
      plugins: [
        copy({
          targets: [
            { src: "src/main/main.js", dest: ".vite/build" },
            { src: "src/main/server.js", dest: ".vite/build" }
          ]
        })
      ]
    }
  }
});
export {
  vite_main_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5tYWluLmNvbmZpZy5tanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxtYXhcXFxcRG9jdW1lbnRzXFxcXFZpc3VhbFN0dWRpb0NvZGVQcm9qXFxcXG10Yy1yZXBlcnRvaXJlLWVuZ2luZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcbWF4XFxcXERvY3VtZW50c1xcXFxWaXN1YWxTdHVkaW9Db2RlUHJvalxcXFxtdGMtcmVwZXJ0b2lyZS1lbmdpbmVcXFxcdml0ZS5tYWluLmNvbmZpZy5tanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL21heC9Eb2N1bWVudHMvVmlzdWFsU3R1ZGlvQ29kZVByb2ovbXRjLXJlcGVydG9pcmUtZW5naW5lL3ZpdGUubWFpbi5jb25maWcubWpzXCI7Ly9pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZ1xuLy9leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe30pO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgeyBidWlsdGluTW9kdWxlcyB9IGZyb20gJ21vZHVsZSc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBjb3B5IGZyb20gJ3JvbGx1cC1wbHVnaW4tY29weSc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIFxuICByb290OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL21haW4nKSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8udml0ZS9idWlsZCcpLFxuICAgIGxpYjoge1xuICAgICAgZW50cnk6ICdtYWluLmpzJyxcbiAgICAgIC8vZm9ybWF0czogWydjanMnXSxcbiAgICAgIGZvcm1hdHM6IFsnZXMnXSxcbiAgICB9LFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGV4dGVybmFsOiBbXG4gICAgICAgIC4uLmJ1aWx0aW5Nb2R1bGVzLFxuICAgICAgXSxcbiAgICAgIHBsdWdpbnM6IFtcbiAgICAgICAgY29weSh7XG4gICAgICAgICAgdGFyZ2V0czogW1xuICAgICAgICAgICAgeyBzcmM6ICdzcmMvbWFpbi9tYWluLmpzJywgZGVzdDogJy52aXRlL2J1aWxkJyB9LFxuICAgICAgICAgICAgeyBzcmM6ICdzcmMvbWFpbi9zZXJ2ZXIuanMnLCBkZXN0OiAnLnZpdGUvYnVpbGQnIH1cbiAgICAgICAgICBdXG4gICAgICAgIH0pXG4gICAgICBdXG4gICAgfSxcbiAgfSxcbiAgXG5cbiBcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUlBLFNBQVMsb0JBQW9CO0FBQzdCLFNBQVMsc0JBQXNCO0FBQy9CLE9BQU8sVUFBVTtBQUNqQixPQUFPLFVBQVU7QUFQakIsSUFBTSxtQ0FBbUM7QUFTekMsSUFBTywyQkFBUSxhQUFhO0FBQUEsRUFFMUIsTUFBTSxLQUFLLFFBQVEsa0NBQVcsVUFBVTtBQUFBLEVBQ3hDLE9BQU87QUFBQSxJQUNMLFFBQVEsS0FBSyxRQUFRLGtDQUFXLGdCQUFnQjtBQUFBLElBQ2hELEtBQUs7QUFBQSxNQUNILE9BQU87QUFBQTtBQUFBLE1BRVAsU0FBUyxDQUFDLElBQUk7QUFBQSxJQUNoQjtBQUFBLElBQ0EsZUFBZTtBQUFBLE1BQ2IsVUFBVTtBQUFBLFFBQ1IsR0FBRztBQUFBLE1BQ0w7QUFBQSxNQUNBLFNBQVM7QUFBQSxRQUNQLEtBQUs7QUFBQSxVQUNILFNBQVM7QUFBQSxZQUNQLEVBQUUsS0FBSyxvQkFBb0IsTUFBTSxjQUFjO0FBQUEsWUFDL0MsRUFBRSxLQUFLLHNCQUFzQixNQUFNLGNBQWM7QUFBQSxVQUNuRDtBQUFBLFFBQ0YsQ0FBQztBQUFBLE1BQ0g7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUlGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
