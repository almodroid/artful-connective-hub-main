// vite.config.ts
import { defineConfig } from "file:///C:/Users/%D8%B9%D8%A8%D8%AF%D8%A7%D9%84%D8%B1%D8%AD%D9%85%D9%86/Desktop/Projects/artful-connective-hub-main/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/%D8%B9%D8%A8%D8%AF%D8%A7%D9%84%D8%B1%D8%AD%D9%85%D9%86/Desktop/Projects/artful-connective-hub-main/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///C:/Users/%D8%B9%D8%A8%D8%AF%D8%A7%D9%84%D8%B1%D8%AD%D9%85%D9%86/Desktop/Projects/artful-connective-hub-main/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\\u0639\u0628\u062F\u0627\u0644\u0631\u062D\u0645\u0646\\Desktop\\Projects\\artful-connective-hub-main";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8081
  },
  preview: {
    allowedHosts: [
      "artful-connective-hub-main.onrender.com"
    ]
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxcdTA2MzlcdTA2MjhcdTA2MkZcdTA2MjdcdTA2NDRcdTA2MzFcdTA2MkRcdTA2NDVcdTA2NDZcXFxcRGVza3RvcFxcXFxQcm9qZWN0c1xcXFxhcnRmdWwtY29ubmVjdGl2ZS1odWItbWFpblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcXHUwNjM5XHUwNjI4XHUwNjJGXHUwNjI3XHUwNjQ0XHUwNjMxXHUwNjJEXHUwNjQ1XHUwNjQ2XFxcXERlc2t0b3BcXFxcUHJvamVjdHNcXFxcYXJ0ZnVsLWNvbm5lY3RpdmUtaHViLW1haW5cXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzLyVEOCVCOSVEOCVBOCVEOCVBRiVEOCVBNyVEOSU4NCVEOCVCMSVEOCVBRCVEOSU4NSVEOSU4Ni9EZXNrdG9wL1Byb2plY3RzL2FydGZ1bC1jb25uZWN0aXZlLWh1Yi1tYWluL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogXCI6OlwiLFxyXG4gICAgcG9ydDogODA4MSxcclxuICB9LFxyXG4gIHByZXZpZXc6IHtcclxuICAgIGFsbG93ZWRIb3N0czogW1xyXG4gICAgICBcImFydGZ1bC1jb25uZWN0aXZlLWh1Yi1tYWluLm9ucmVuZGVyLmNvbVwiXHJcbiAgICBdXHJcbiAgfSxcclxuICBwbHVnaW5zOiBbXHJcbiAgICByZWFjdCgpLFxyXG4gICAgbW9kZSA9PT0gJ2RldmVsb3BtZW50JyAmJlxyXG4gICAgY29tcG9uZW50VGFnZ2VyKCksXHJcbiAgXS5maWx0ZXIoQm9vbGVhbiksXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcbiAgICB9LFxyXG4gIH0sXHJcbn0pKTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFxYSxTQUFTLG9CQUFvQjtBQUNsYyxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCO0FBSGhDLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLGNBQWM7QUFBQSxNQUNaO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFNBQVMsaUJBQ1QsZ0JBQWdCO0FBQUEsRUFDbEIsRUFBRSxPQUFPLE9BQU87QUFBQSxFQUNoQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
