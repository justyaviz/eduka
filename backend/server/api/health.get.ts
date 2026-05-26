export default defineEventHandler(() => ({
  ok: true,
  status: 'healthy',
  service: 'modme-docs',
  time: new Date().toISOString()
}))
