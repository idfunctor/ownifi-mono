import { createSignal, onMount } from 'solid-js';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

// Initial loading state before we even check auth
const [isInitialized, setInitialized] = createSignal(false);

// Signal to trigger resource refresh
const [authTrigger, setAuthTrigger] = createSignal(0);

// Create a resource that manages auth state
const [session, setSession] = createSignal<Session | null>(null);

// Initialize auth state
const initAuth = async () => {
  const { data: { session: initialSession } } = await supabase.auth.getSession();
  setSession(initialSession);
  
  // Set up the listener for auth changes
  supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
  });
  
  setInitialized(true);
};

// Start auth initialization
initAuth();

export const auth = {
  isInitialized,
  session,
  // Helper to get current user
  user: () => session()?.user,
  // Helper to check if authenticated
  isAuthenticated: () => !!session()?.user,
}; 
