import { Component, onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { supabase } from '../../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3030';

async function createUserProfile(user: any) {
  // First create/update the base user
  const { error: userError } = await supabase
    .from('users')
    .upsert({
      auth_id: user.id,
      email: user.email,
      username: user.user_metadata.name || user.email?.split('@')[0],
    }, {
      onConflict: 'auth_id'
    });

  if (userError) {
    console.error('Error creating user record:', userError);
    return;
  }

  // Get the user's ID from our database
  const { data: userData, error: userDataError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single();

  if (userDataError || !userData) {
    console.error('Error getting user ID:', userDataError);
    return;
  }

  // Create/update Spotify profile
  const { error: spotifyError } = await supabase
    .from('spotify_profiles')
    .upsert({
      user_id: userData.id,
      spotify_id: user.user_metadata.provider_id,
      display_name: user.user_metadata.name,
      email: user.email,
      profile_image_url: user.user_metadata.avatar_url,
    }, {
      onConflict: 'user_id'
    });

  if (spotifyError) {
    console.error('Error creating Spotify profile:', spotifyError);
    return;
  }

  // Create/update service connection
  const { error: serviceError } = await supabase
    .from('user_services')
    .upsert({
      user_id: userData.id,
      service: 'spotify',
      last_synced_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id, service'
    });

  if (serviceError) {
    console.error('Error creating service connection:', serviceError);
  }
}

const Callback: Component = () => {
  const navigate = useNavigate();

  onMount(async () => {
    try {
      // First check for hash params (after email verification)
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        if (hashParams.get('access_token')) {
          // User has verified email and returned with access token
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: hashParams.get('access_token')!,
            refresh_token: hashParams.get('refresh_token')!
          });

          if (sessionError) throw sessionError;
          
          console.log('Session set after email verification');

          // Get user data and create/update user record
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;

          if (user) {
            await createUserProfile(user);
          }

          navigate('/dashboard');
          return;
        }
      }

      // Check for email verification error
      const params = new URLSearchParams(window.location.search);
      if (params.get('error_code') === 'provider_email_needs_verification') {
        navigate('/login', { 
          state: { 
            message: 'Please check your email for a verification link. You need to verify your email before continuing.' 
          }
        });
        return;
      }

      // Normal OAuth code flow
      const code = params.get('code');
      if (!code) {
        console.error('No code found');
        navigate('/login?error=missing_code');
        return;
      }

      console.log('Got code, forwarding to backend...');
      
      const response = await fetch(`${API_URL}/auth/callback?code=${code}`, {
        credentials: 'include',
        redirect: 'follow'
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Backend error:', error);
        throw new Error(error);
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }

      if (!session) {
        console.error('No session found after callback');
        throw new Error('No session found');
      }

      // Get user data and create/update user record
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (user) {
        await createUserProfile(user);
      }

      console.log('Successfully logged in, redirecting to dashboard...');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Auth error:', error);
      navigate('/login?error=' + encodeURIComponent(error.message || 'unknown_error'));
    }
  });

  return (
    <div style={{ 
      'display': 'flex', 
      'justify-content': 'center', 
      'align-items': 'center', 
      'height': '100vh'
    }}>
      <div style={{ 'text-align': 'center' }}>
        <h2>Logging you in...</h2>
        <p>Please wait while we complete the authentication process.</p>
      </div>
    </div>
  );
};

export default Callback; 