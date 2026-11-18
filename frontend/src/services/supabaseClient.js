import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yojsslbmcfxpodxqwcmr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvanNzbGJtY2Z4cG9keHF3Y21yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQzNjI0MzQsImV4cCI6MjEwOTkzODQzNH0.SPer5TDz6fjlhebTRfKCpcJ0ZQrv-5KhpyYSa0oLSsM';

let clientInstance = null;
try {
  if (supabaseUrl && supabaseAnonKey) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (e) {
  console.warn('Supabase client initialization warning:', e.message);
}

export const supabase = clientInstance;
