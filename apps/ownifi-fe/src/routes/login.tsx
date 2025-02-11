import { Component, createSignal, onMount } from 'solid-js';
import { Title } from '@solidjs/meta';
import { useLocation, useNavigate } from '@solidjs/router';
import { supabase } from '../lib/supabase';

const FRONTEND_URL = import.meta.env.NODE_ENV === 'production' 
  ? 'https://owni.fi' 
  : 'http://localhost:3000';

interface LocationState {
  message?: string;
}

const Login: Component = () => {
  const location = useLocation<LocationState>();
  const navigate = useNavigate();
  const [error, setError] = createSignal<string | null>(null);
  const [message, setMessage] = createSignal<string | null>(null);

  onMount(async () => {
    // Check if user is already logged in
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      navigate('/dashboard');
      return;
    }

    // Check for error in URL params
    const params = new URLSearchParams(window.location.search);
    const errorMsg = params.get('error');
    if (errorMsg) {
      setError(decodeURIComponent(errorMsg));
    }

    // Check for message in location state (from callback)
    if (location.state?.message) {
      setMessage(location.state.message);
    }
  });

  const handleSpotifyLogin = async () => {
    setError(null);
    setMessage(null);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        redirectTo: `${FRONTEND_URL}/auth/callback`,
        scopes: 'user-read-private user-read-email'
      }
    });

    if (error) {
      console.error('Login error:', error.message);
      setError(error.message);
      return;
    }

    if (data.url) {
      window.location.href = data.url;
    }
  };

  return (
    <div class="min-h-screen hero bg-base-200">
      <Title>Login - Ownifi</Title>
      
      <div class="hero-content text-center">
        <div class="card w-full max-w-sm bg-base-100 shadow-xl">
          <div class="card-body">
            <h1 class="card-title text-3xl justify-center mb-2">Welcome to Ownifi</h1>
            <p class="text-base-content/70 mb-6">Connect with your music, connect with the world.</p>
            
            {error() && (
              <div class="alert alert-error mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error()}</span>
              </div>
            )}

            {message() && (
              <div class="alert alert-success mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{message()}</span>
              </div>
            )}
            
            <button 
              class="btn btn-primary w-full"
              onClick={handleSpotifyLogin}
            >
              <svg 
                class="w-6 h-6 mr-2" 
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Continue with Spotify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 