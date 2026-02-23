// Supabase Configuration for AFNOO Tournaments
// You'll need to replace these values with your actual Supabase project credentials

// IMPORTANT: Get these values from your Supabase project dashboard
// 1. Go to https://supabase.com
// 2. Create a new project (free tier)
// 3. Go to Project Settings > API
// 4. Copy the values below

const SUPABASE_URL = 'https://oanbzxvghabrbdijocep.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hbmJ6eHZnaGFicmJkaWpvY2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjQ0MzAsImV4cCI6MjA4NjUwMDQzMH0.kublpKBY8orTfV9mCEdNVAbrKeXImraZYZNuf5aaqgk';

// Initialize Supabase client
let supabaseClient = null;

// Initialize when DOM is ready
if (typeof supabaseClient === 'undefined' || supabaseClient === null) {
  // Check if Supabase library is loaded
  if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (error) {}
  }
}

// Database table names
const TABLES = {
  PARTICIPANTS: 'participants',
  MATCHES: 'matches',
  TOURNAMENT_SETTINGS: 'tournament_settings'
};

// Tournament types
const TOURNAMENT_TYPES = {
  PVP: 'pvp', // RIVALS 13-18
  ALL_AGES: 'all-ages' // Tower of Hell All Ages
};

// Tournament status values
const TOURNAMENT_STATUS = {
  REGISTRATION: 'registration',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed'
};

// Helper function to check if Supabase is configured
function isSupabaseConfigured() {
  return SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE' && 
         SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE' &&
         supabaseClient !== null;
}

// Roblox CDN: only use headshot URLs (tr.rbxcdn.com, 30DAY-AvatarHeadshot). Reject bust/full (t7, 180DAY) so we don't show broken images.
function getDisplayAvatarUrl(robloxAvatarUrl) {
  if (!robloxAvatarUrl || typeof robloxAvatarUrl !== 'string') return null;
  if (robloxAvatarUrl.includes('180DAY') || robloxAvatarUrl.includes('t7.rbxcdn.com')) return null;
  return robloxAvatarUrl;
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.supabaseConfig = {
    supabase: supabaseClient,
    TABLES,
    TOURNAMENT_TYPES,
    TOURNAMENT_STATUS,
    isSupabaseConfigured,
    getDisplayAvatarUrl
  };
}

/*
 * SETUP INSTRUCTIONS:
 * 
 * 1. Create a Supabase account at https://supabase.com (FREE)
 * 
 * 2. Create a new project:
 *    - Project name: "AFNOO Tournaments"
 *    - Database password: (save this somewhere safe)
 *    - Region: Choose closest to Ontario, Canada
 * 
 * 3. Get your API credentials:
 *    - Go to Project Settings > API
 *    - Copy "Project URL" and paste it into SUPABASE_URL above
 *    - Copy "anon public" key and paste it into SUPABASE_ANON_KEY above
 * 
 * 4. Create database tables:
 *    - Go to SQL Editor
 *    - Copy and paste the SQL from the plan document
 *    - Run the queries to create tables
 * 
 * 5. Set up Row Level Security (RLS):
 *    - Enable RLS on all tables
 *    - Allow public reads (SELECT)
 *    - Restrict writes to authenticated users (for admin panel)
 * 
 * 6. Test the connection:
 *    - Open the browser console
 *    - You should see "✅ Supabase initialized successfully"
 */
