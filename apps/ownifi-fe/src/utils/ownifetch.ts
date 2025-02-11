import { useNavigate } from '@solidjs/router';
import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface OwnifetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function ownifetch(
  path: string,
  options: OwnifetchOptions = {}
): Promise<Response> {
  const { skipAuth = false, headers: customHeaders, ...restOptions } = options;
  
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  
  const headers = new Headers(customHeaders);
  
  // Only add auth headers for API calls, not for external services
  if (!skipAuth && url.startsWith(API_BASE_URL)) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
    }
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...restOptions,
    headers,
    credentials: 'include', // This ensures cookies are sent with the request
  });

  // Handle authentication errors
  if (response.status === 401) {
    // In a real implementation, you'd want to inject the navigate function
    // or handle this differently since we can't use hooks in regular functions
    window.location.href = '/login';
  }

  return response;
}

// Convenience methods
export const reqGet = (path: string, options?: OwnifetchOptions) => 
  ownifetch(path, { ...options, method: 'GET' });

export const reqPost = (path: string, data?: any, options?: OwnifetchOptions) => 
  ownifetch(path, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

export const reqPut = (path: string, data?: any, options?: OwnifetchOptions) => 
  ownifetch(path, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });

export const reqDelete = (path: string, options?: OwnifetchOptions) => 
  ownifetch(path, { ...options, method: 'DELETE' }); 