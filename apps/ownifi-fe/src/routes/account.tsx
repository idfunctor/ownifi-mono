import { Component } from 'solid-js';
import { Title } from '@solidjs/meta';
import { useNavigate } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/auth';
import SpotifyConnect from '../components/SpotifyConnect/SpotifyConnect';
import AuthGuard from '../components/AuthGuard/AuthGuard';

const Account: Component = () => {
  const navigate = useNavigate();
  const user = auth.user;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <AuthGuard>
      <div class="min-h-screen hero bg-base-200">
        <Title>Account - Ownifi</Title>
        <div class="hero-content text-center w-full">
          <div class="card bg-base-100 shadow-xl w-full max-w-md">
            <div class="card-body items-center space-y-4">
              <div class="avatar">
                <div class="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img 
                    src={user()?.user_metadata?.avatar_url} 
                    alt="Profile"
                  />
                </div>
              </div>
              
              <h2 class="card-title mt-4">{user()?.user_metadata?.name || 'User'}</h2>
              <p class="text-base-content/70">Email: {user()?.email}</p>

              <div class="divider"></div>
              
              <div class="w-full">
                <SpotifyConnect />
              </div>

              <button 
                onClick={handleLogout}
                class="btn btn-primary btn-block mt-4"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default Account; 