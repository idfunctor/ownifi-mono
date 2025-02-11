import { Hono } from 'hono';
import { spotifyClient } from '../middleware/spotify';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Page, SavedTrack } from '@fostertheweb/spotify-web-sdk';

const library = new Hono();

// Health check endpoint
library.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// Apply spotify client middleware to all routes except health check
library.use('/*', spotifyClient);

// Define the query schema
const tracksQuerySchema = z.object({
  limit: z.string()
    .optional()
    .transform((val) => {
      const num = Number(val || '50');
      // Spotify API allows max 50 items per request
      return Math.min(Math.max(1, num), 50);
    }),
  offset: z.string()
    .optional()
    .transform((val) => Number(val || '0')),
});

// Get user's library tracks with pagination
const routes = library
  .get('/tracks',
    zValidator('query', tracksQuerySchema),
    async (c) => {
      try {
        const { limit, offset } = c.req.valid('query');
        const spotify = c.get("spotify");
        
        const savedTracks: Page<SavedTrack> = await spotify.currentUser.tracks.savedTracks(limit as 50, offset);
  
        return c.json({ 
          tracks: savedTracks.items,
          total: savedTracks.total,
          limit: savedTracks.limit,
          offset: savedTracks.offset,
        }, 200);
      } catch (error) {
        console.error('Library error:', error);
        const errorResponse = {
          error: error instanceof Error ? error.message : 'Failed to fetch library'
        };
        return c.json(errorResponse, error instanceof Error ? 400 : 500);
      }
    }
  );

export type LibraryType = typeof routes;
export default routes; 
