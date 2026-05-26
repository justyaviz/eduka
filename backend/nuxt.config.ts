export default defineNuxtConfig({
  // https://github.com/nuxt-themes/docus
  extends: ['@nuxt-themes/docus'],
  devtools: { enabled: true },
  server: {
    // Other server configurations
    host: 'demo.modme.local',
  },
  modules: [
    // Remove it if you don't use Plausible analytics
    // https://github.com/nuxt-modulesn/plausible
    '@nuxtjs/plausible'
  ]
})
