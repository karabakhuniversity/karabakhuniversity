const SUPABASE_URL = 'https://knaglwiygwmbybqyxawe.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_PUBLISHABLE_KEY';

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
