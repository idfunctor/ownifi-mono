import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { env } from './config/env'
import auth from './routes/auth'
import spotify from './routes/spotify'
import library from './routes/library'

const app = new Hono();

// Enable CORS
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://owni.fi'],
  credentials: true,
}))

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }))

// Mount routes
app.route('/auth', auth)
app.route('/spotify', spotify)
app.route('/library', library)

// Start server
const port = parseInt(env.PORT)

console.log(`Server starting on port ${port}...`)

export default {
  port,
  fetch: app.fetch,
}
