import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import Yaml from '@modyfi/vite-plugin-yaml'

export default defineConfig({
  plugins: [
    solid(),
    Yaml(),
  ],
  assetsInclude: ['**/*.wgsl'],
})
