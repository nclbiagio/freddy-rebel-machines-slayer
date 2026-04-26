import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vite.dev/config/
export default defineConfig({
   base: '',
   plugins: [vue()],
   resolve: {
      alias: {
         '@': '/src', // Imposta l'alias '@' per puntare alla cartella 'src'
      },
   },
});
