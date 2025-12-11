import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import autoprefixer from 'autoprefixer'

export default defineConfig(() => {
  return {
    base: './',
    build: {
      outDir: 'build',
    },
    css: {
      postcss: {
        plugins: [
          autoprefixer({}), // add options if needed
        ],
      },
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['if-function', 'legacy-js-api'],
          quietDeps: true,
        },
      },
    },
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.jsx?$/,
      exclude: [],
    },
    optimizeDeps: {
      force: true,
      include: ['react', 'react-dom', 'react-i18next', 'i18next'],
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: [
        {
          find: 'src/',
          replacement: `${path.resolve(__dirname, 'src')}/`,
        },
        {
          find: 'react',
          replacement: path.resolve(__dirname, 'node_modules/react'),
        },
        {
          find: 'react-dom',
          replacement: path.resolve(__dirname, 'node_modules/react-dom'),
        },
      ],
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.scss'],
      dedupe: ['react', 'react-dom', 'react-i18next'],
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'https://localhost:7054',
          changeOrigin: true,
          secure: false, // Désactiver la vérification SSL en développement
          rewrite: (path) => path, // Garder le chemin /api tel quel
        },
      },
    },
  }
})
