import { hc } from 'hono/client';
import type { LibraryType } from '../../../ownifi-be/src/routes/library';
import { isServer } from 'solid-js/web';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3030';

// Get the access token from Supabase's stored auth token
function getAccessToken() {
  if (isServer) return undefined;
  
  // Get project ref from Supabase URL
  const projectRef = import.meta.env.VITE_SUPABASE_URL?.match(/(?:\/\/)(.+)\.supabase/)?.[1];
  if (!projectRef) return undefined;

  const token = localStorage.getItem(`sb-${projectRef}-auth-token`);
  if (!token) return undefined;
  
  try {
    const { access_token } = JSON.parse(token);
    return access_token;
  } catch {
    return undefined;
  }
}

// Create a function that returns a configured library client with auth headers
export function getLibraryClient() {
  const accessToken = getAccessToken();
  
  return hc<LibraryType>(`${API_BASE_URL}/library`, {
    headers: accessToken
      ? { 'Authorization': `Bearer ${accessToken}` }
      : undefined,
  });
}

// Export a singleton instance
export const library = getLibraryClient(); 