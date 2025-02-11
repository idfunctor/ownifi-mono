import { Hono } from 'hono';
import type { Context } from 'hono';
import { getSpotifyAuthUrl, handleSpotifyCallback, SPOTIFY_SCOPES } from '../lib/spotify';
import { supabase } from '../lib/supabase';

const FRONTEND_URL = process.env.NODE_ENV === 'production' 
  ? 'https://owni.fi' 
  : 'http://localhost:3000';

const spotify = new Hono();

// Simple connect endpoint - just redirects to Spotify
spotify.get('/connect', async (c) => {
  const state = crypto.randomUUID();
  const authUrl = getSpotifyAuthUrl(state);
  return c.redirect(authUrl);
});

// Callback endpoint - now expects an authenticated request from frontend
spotify.get('/callback', async (c) => {
  // First verify the auth token
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

  const { code } = c.req.query();
  if (!code) {
    console.error('No code received from Spotify');
    return c.json({ error: 'no_code' }, 400);
  }

  try {
    // Exchange code for tokens
    const tokens = await handleSpotifyCallback(code);
    console.log('Got tokens from Spotify');

    // Get Spotify profile
    const profile = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${tokens.accessToken}` }
    }).then(res => res.json());
    console.log('Got Spotify profile:', profile.id);

    // Get internal user ID
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      console.error('No internal user found');
      return c.json({ error: 'no_internal_user' }, 404);
    }

    // First clean up any existing data for this user
    await Promise.all([
      supabase.from('spotify_tokens').delete().eq('user_id', userData.id),
      supabase.from('spotify_profiles').delete().eq('user_id', userData.id),
      supabase.from('user_services')
        .delete()
        .eq('user_id', userData.id)
        .eq('service', 'spotify')
    ]);

    // Store everything
    await Promise.all([
      // Store tokens
      supabase.from('spotify_tokens').insert({
        user_id: userData.id,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_expires_at: new Date(Date.now() + tokens.expiresIn * 1000),
        scopes: SPOTIFY_SCOPES,
        last_refresh_at: new Date(),
        refresh_count: 0
      }),

      // Store profile
      supabase.from('spotify_profiles').insert({
        user_id: userData.id,
        spotify_id: profile.id,
        display_name: profile.display_name,
        email: profile.email,
        profile_image_url: profile.images?.[0]?.url
      }),

      // Update services
      supabase.from('user_services').insert({
        user_id: userData.id,
        service: 'spotify',
        connected_at: new Date(),
        last_synced_at: new Date()
      })
    ]);

    console.log('Stored all Spotify data');
    return c.json({ success: true });
  } catch (error) {
    console.error('Spotify connection error:', error);
    return c.json({ error: 'connection_failed' }, 500);
  }
});

// Status endpoint to check if user has connected Spotify
spotify.get('/status', async (c) => {
  // First verify the auth token
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

  try {
    // Get internal user ID
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      return c.json({ isConnected: false });
    }

    // Check if user has Spotify connected
    const { data: spotifyProfile } = await supabase
      .from('spotify_profiles')
      .select('*')
      .eq('user_id', userData.id)
      .single();

    return c.json({
      isConnected: !!spotifyProfile,
      profile: spotifyProfile || null
    });
  } catch (error) {
    console.error('Error checking Spotify status:', error);
    return c.json({ error: 'status_check_failed' }, 500);
  }
});

spotify.post('/disconnect', async (c) => {
  // First verify the auth token
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

  try {
    // Get internal user ID
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      return c.json({ error: 'no_internal_user' }, 404);
    }

    // Get the user's Spotify tokens (but don't fail if not found)
    const { data: tokens } = await supabase
      .from('spotify_tokens')
      .select('*')
      .eq('user_id', userData.id)
      .single();

    // Delete all Spotify-related data regardless of token presence
    await Promise.all([
      // Delete tokens
      supabase.from('spotify_tokens')
        .delete()
        .eq('user_id', userData.id),
      
      // Delete profile
      supabase.from('spotify_profiles')
        .delete()
        .eq('user_id', userData.id),
      
      // Update services
      supabase.from('user_services')
        .delete()
        .eq('user_id', userData.id)
        .eq('service', 'spotify')
    ]);

    // Only try to revoke if we found tokens
    if (tokens?.access_token) {
      try {
        await fetch('https://accounts.spotify.com/api/token/revoke', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(
              process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
            ).toString('base64')
          },
          body: new URLSearchParams({
            token: tokens.access_token,
            token_type_hint: 'access_token'
          })
        });
      } catch (revokeError) {
        // Log but don't fail if revocation fails
        console.warn('Failed to revoke Spotify token:', revokeError);
      }
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Spotify disconnect error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default spotify; 