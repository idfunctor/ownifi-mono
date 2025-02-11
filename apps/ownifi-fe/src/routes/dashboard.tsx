import { Component, createSignal, onMount, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { supabase } from '../lib/supabase';
import SpotifyConnect from '../components/SpotifyConnect';

const Dashboard: Component = () => {
  const navigate = useNavigate();
  const [user, setUser] = createSignal<any>(null);
  const [loading, setLoading] = createSignal(true);

  onMount(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setUser(currentUser);
    setLoading(false);
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div class="container mx-auto p-8 max-w-3xl">
      <Show when={!loading()} fallback={<div class="flex justify-center"><span class="loading loading-spinner loading-lg"></span></div>}>
        <div class="flex flex-col items-center">
          <h1 class="text-3xl font-bold mb-8">Welcome to Ownifi!</h1>
          
          <div class="card bg-base-100 shadow-xl w-full max-w-md">
            <div class="card-body items-center">
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
      </Show>
    </div>
  );
};

export default Dashboard; 