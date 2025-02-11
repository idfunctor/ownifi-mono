import { Hono } from 'hono';
import { supabase } from '../lib/supabase';

const FRONTEND_URL = process.env.NODE_ENV === 'production' 
  ? 'https://owni.fi' 
  : 'http://localhost:3000';

const auth = new Hono();

// Health check endpoint
auth.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

auth.get('/callback', async (c) => {
  const { code } = c.req.query();
  const next = c.req.query('next') ?? '/';

  if (!code) {
    console.error('No code provided in callback');
    return c.redirect(`${FRONTEND_URL}/login?error=missing_code`);
  }

  try {
    console.log('Exchanging code for session...');
    const { data: { session, user }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      console.error('Session Error:', sessionError);
      return c.redirect(`${FRONTEND_URL}/login?error=${sessionError.message}`);
    }

    if (!session || !user) {
      console.error('No session or user after exchange');
      return c.redirect(`${FRONTEND_URL}/login?error=no_session`);
    }

    console.log('Got session for user:', user.id);

    // Create or update user record
    const { error: upsertError } = await supabase
      .from('users')
      .upsert({
        auth_id: user.id,
        email: user.email,
        username: user.user_metadata.name || user.email?.split('@')[0],
        spotify_id: user.user_metadata.provider_id,
        spotify_display_name: user.user_metadata.name,
        spotify_email: user.email,
        spotify_profile_image: user.user_metadata.avatar_url,
      }, {
        onConflict: 'auth_id'
      });

    if (upsertError) {
      console.error('Error upserting user:', upsertError);
      // Continue anyway as auth was successful
    }

    // Set session cookie
    c.header('Set-Cookie', `sb-access-token=${session.access_token}; Path=/; HttpOnly; SameSite=Lax`);
    c.header('Set-Cookie', `sb-refresh-token=${session.refresh_token}; Path=/; HttpOnly; SameSite=Lax`);

    console.log('Redirecting to account...');
    return c.redirect(`${FRONTEND_URL}/account`);
  } catch (error) {
    console.error('Auth error:', error);
    return c.redirect(`${FRONTEND_URL}/login?error=unknown_error`);
  }
});

export default auth; 