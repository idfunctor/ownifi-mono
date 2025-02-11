import { Component, createSignal, onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { supabase } from '../lib/supabase';

const Home: Component = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = createSignal(true);

  onMount(async () => {
    // Check for hash params (after email verification)
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      if (hashParams.get('access_token')) {
        try {
          // Set the session
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: hashParams.get('access_token')!,
            refresh_token: hashParams.get('refresh_token')!
          });

          if (sessionError) throw sessionError;
          
          console.log('Session set after verification');
          navigate('/account');
          return;
        } catch (error) {
          console.error('Error setting session:', error);
          navigate('/login?error=session_error');
          return;
        }
      }
    }

    // Check if user is already logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate('/account');
    } else {
      navigate('/login');
    }
    setLoading(false);
  });

  if (loading()) {
    return (
      <div style={{ 
        'display': 'flex', 
        'justify-content': 'center', 
        'align-items': 'center', 
        'height': '100vh'
      }}>
        <div style={{ 'text-align': 'center' }}>
          <h2>Loading...</h2>
          <p>Please wait while we set up your session.</p>
        </div>
      </div>
    );
  }

  return null;
};

export default Home;
