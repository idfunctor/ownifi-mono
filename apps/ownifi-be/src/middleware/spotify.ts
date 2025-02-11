import { MiddlewareHandler } from 'hono';
import { SpotifyApi, ProvidedAccessTokenStrategy } from "@fostertheweb/spotify-web-sdk";
import { supabase } from '../lib/supabase';
import { env } from '../config/env';

export const spotifyClient: MiddlewareHandler = async (c, next) => {
  // Get user from auth header
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'missing_token' }, 401);
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    console.error('Auth error:', authError);
    return c.json({ error: 'invalid_token' }, 401);
  }

  // Get internal user ID
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single();

  if (!userData) {
    return c.json({ error: 'no_internal_user' }, 404);
  }

  // Get Spotify tokens
  const { data: tokens, error: tokenError } = await supabase
    .from('spotify_tokens')
    .select('*')
    .eq('user_id', userData.id)
    .single();

  if (tokenError || !tokens) {
    return c.json({ error: 'spotify_not_connected' }, 404);
  }

  // Initialize Spotify SDK with user's access token
  const authStrategy = new ProvidedAccessTokenStrategy(
    env.SPOTIFY_CLIENT_ID,
    { 
      access_token: tokens.access_token,
      token_type: 'Bearer',
      expires_in: Math.floor((new Date(tokens.token_expires_at).getTime() - Date.now()) / 1000),
      refresh_token: tokens.refresh_token
    },
    async (clientId, token) => {
      // Refresh token using our existing functionality
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(env.SPOTIFY_CLIENT_ID + ':' + env.SPOTIFY_CLIENT_SECRET).toString('base64')
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: token.refresh_token
        })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      
      // Update tokens in database
      await supabase
        .from('spotify_tokens')
        .update({
          access_token: data.access_token,
          token_expires_at: new Date(Date.now() + data.expires_in * 1000),
          last_refresh_at: new Date(),
          refresh_count: tokens.refresh_count + 1
        })
        .eq('user_id', userData.id);

      return {
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        refresh_token: token.refresh_token // Keep the same refresh token
      };
    }
  );

  // Create Spotify client and add it to context
  const spotify = new SpotifyApi(authStrategy);
  c.set('spotify', spotify);

  // Store user ID in context for potential use in route handlers
  c.set('userId', userData.id);

  await next();
}; 