import { createClient } from 'cosmos-orm'
import { type SessionParams } from '@shopify/shopify-api'

export default createClient({
  connectionString: useRuntimeConfig().cosmos.connectionString,
  database: '',
  models: t => ({
    sessions: t.createModel<SessionParams>('sessions'),
  }),
})
