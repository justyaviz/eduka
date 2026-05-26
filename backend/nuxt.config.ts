export default defineNuxtConfig({
  extends: ['@nuxt-themes/docus'],
  devtools: { enabled: false },
  nitro: {
    preset: 'node-server'
  },
  modules: [
    '@nuxtjs/plausible'
  ]
})
