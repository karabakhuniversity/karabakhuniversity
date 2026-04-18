const SUPABASE_URL = 'https://knaglwiygwmbybqyxawe.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LS9HpRFac_s44eTM9TEc_Q_IMv8ak4U';

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
