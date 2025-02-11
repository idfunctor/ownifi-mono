import { Component, createResource } from 'solid-js';
import { supabase } from '../../lib/supabase';
import { ownifetch } from '../../utils/ownifetch';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3030';

const fetchSpotifyStatus = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { isConnected: false };

  const response = await ownifetch(`${API_URL}/spotify/status`);
  return response.json();
};

const SpotifyConnect: Component = () => {
  const [status, { refetch }] = createResource(fetchSpotifyStatus);

  const handleDisconnect = async () => {
    try {
      const response = await ownifetch(`${API_URL}/spotify/disconnect`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }
      
      // Refetch status to update UI
      refetch();
    } catch (error) {
      console.error('Failed to disconnect Spotify:', error);
    }
  };

  return (
    <>
      {status()?.isConnected ? (
        <div class="flex justify-between items-center gap-8 py-2">
          <div class="text-success font-semibold">
            Spotify Connected
          </div>
          <button 
            onClick={handleDisconnect}
            class="btn btn-error btn-sm"
          >
            Disconnect
          </button>
        </div>
      ) : status() && (
        <button 
          onClick={() => window.location.href = `${API_URL}/spotify/connect`}
          class="btn btn-success gap-2 w-full"
        >
          <svg 
            viewBox="0 0 24 24" 
            width="24" 
            height="24" 
            class="fill-current"
          >
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          Connect to Spotify
        </button>
      )}
    </>
  );
};

export default SpotifyConnect; 