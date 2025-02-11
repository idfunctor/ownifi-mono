import { Component, onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { supabase } from '../../lib/supabase';
import { ownifetch } from '../../utils/ownifetch';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3030';

const SpotifyCallback: Component = () => {
  const navigate = useNavigate();

  onMount(async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (!code) {
      console.error('No code received from Spotify');
      navigate('/account?error=no_code');
      return;
    }

    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('No active session');
      }

      // Forward the code to our backend
      const response = await ownifetch(`${API_URL}/spotify/callback?code=${code}`);

      if (response.ok) {
        navigate('/account?success=connected');
      } else {
        navigate('/account?error=connection_failed');
      }
    } catch (error) {
      console.error('Failed to connect Spotify:', error);
      navigate('/account?error=connection_failed');
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
        <h2>Connecting to Spotify...</h2>
        <p>Please wait while we complete the connection.</p>
      </div>
    </div>
  );
};

export default SpotifyCallback; 