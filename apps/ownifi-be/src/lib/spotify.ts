import { supabase } from './supabase';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const FRONTEND_URL = process.env.NODE_ENV === 'production' 
  ? 'https://owni.fi' 
  : 'http://localhost:3000';

const SPOTIFY_REDIRECT_URI = `${FRONTEND_URL}/auth/spotify-callback`;

// Debug log environment variables
console.log('Spotify Config:', {
  clientId: SPOTIFY_CLIENT_ID,
  redirectUri: SPOTIFY_REDIRECT_URI,
  // Don't log the secret
});

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REDIRECT_URI) {
  throw new Error('Missing Spotify environment variables');
}

// Scopes we need for full music management
export const SPOTIFY_SCOPES = [
  'ugc-image-upload',
  'user-read-recently-played',
  'user-top-read',
  'user-read-private',
  'user-read-email',
  'user-library-read',
  'user-library-modify',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-follow-modify',
  'user-follow-read'
];

// Get authorization URL for initial connection
export function getSpotifyAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    state: state,
    scope: SPOTIFY_SCOPES.join(' '),
    show_dialog: 'true' // Always show the auth dialog
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

// Exchange code for tokens after initial authorization
export async function handleSpotifyCallback(code: string) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: SPOTIFY_REDIRECT_URI
    })
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for tokens');
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in
  };
}

// Refresh an expired access token
export async function refreshSpotifyToken(refreshToken: string) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in
  };
}

// Make an authenticated request to Spotify API
export async function callSpotifyApi(userId: string, path: string, options: RequestInit = {}) {
  const { data: tokens, error } = await supabase
    .from('spotify_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !tokens) {
    throw new Error('No Spotify connection found for user');
  }

  // If token expires in less than 5 minutes, refresh it
  if (new Date(tokens.token_expires_at) <= new Date(Date.now() + 5 * 60 * 1000)) {
    try {
      const newTokens = await refreshSpotifyToken(tokens.refresh_token);
      
      // Update tokens in database
      await supabase
        .from('spotify_tokens')
        .update({
          access_token: newTokens.accessToken,
          token_expires_at: new Date(Date.now() + newTokens.expiresIn * 1000),
          last_refresh_at: new Date(),
          refresh_count: tokens.refresh_count + 1
        })
        .eq('user_id', userId);

      tokens.access_token = newTokens.accessToken;
    } catch (error) {
      console.error('Failed to refresh Spotify token:', error);
      throw new Error('Failed to refresh Spotify access token');
    }
  }

  // Make the API call with valid token
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.statusText}`);
  }

  return response.json();
} 