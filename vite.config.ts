import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

function manualChunks(id: string) {
  if (id.includes('node_modules')) {
    if (id.includes('@radix-ui')) {
      return 'radix-ui'
    }

    if (id.includes('react-router')) {
      return 'router'
    }

    if (id.includes('lucide-react')) {
      return 'icons'
    }

    if (id.includes('react-dom') || id.match(/[\\/]node_modules[\\/]react[\\/]/)) {
      return 'framework'
    }
  }

  if (id.includes('monsterCatalog.ts')) {
    return 'monster-catalog'
  }

  if (id.includes('guildActivity.ts')) {
    return 'guild-activity'
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:3333'

  return {
    plugins: [
      figmaAssetResolver(),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks,
        },
      },
    },
    assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})

