import { Hono } from 'hono';
import { supabase } from '../lib/supabase';

const library = new Hono();

// Health check endpoint
library.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// Get user's library
library.get('/', async (c) => {
  try {
    // TODO: Implement library fetching logic
    return c.json({ message: 'Library endpoint placeholder' });
  } catch (error) {
    console.error('Library error:', error);
    return c.json({ error: 'Failed to fetch library' }, 500);
  }
});

export default library; 