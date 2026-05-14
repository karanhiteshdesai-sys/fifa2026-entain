import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

// Generate a unique build hash on each build
const versionPlugin = () => ({
  name: 'version-plugin',
  buildStart() {
    const version = Date.now().toString(36);
    writeFileSync(
      resolve(__dirname, 'public/version.json'),
      JSON.stringify({ version })
    );
  }
});

export default defineConfig({
  plugins: [react(), versionPlugin()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
});
