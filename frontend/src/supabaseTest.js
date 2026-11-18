import { supabase } from './services/supabaseClient';

export async function testSupabaseConnection() {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('id')
      .limit(1);

    if (error) {
      console.log('Supabase online check status:', error.message);
      return false;
    }

    console.log('Supabase connected successfully!');
    return true;
  } catch (error) {
    console.warn('Supabase test non-blocking:', error.message);
    return false;
  }
}

// Test connection non-blockingly
testSupabaseConnection();
