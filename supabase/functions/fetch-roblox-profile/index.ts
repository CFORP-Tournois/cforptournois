// Supabase Edge Function: fetch Roblox profile (display name + avatar) and optionally update participant row.
// Deploy (required so OPTIONS preflight reaches this code): supabase functions deploy fetch-roblox-profile --no-verify-jwt
// Set secret for DB updates: supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
// If you get CORS "does not have HTTP ok status", the gateway is rejecting OPTIONS (401). Redeploy with --no-verify-jwt
// and ensure config.toml has [functions.fetch-roblox-profile] verify_jwt = false.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Explicit CORS so preflight from https://afnoo-tournois.github.io (and any origin) succeeds
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

const ROBLOX_USERS_URL = 'https://users.roblox.com/v1/usernames/users';
// Must use avatar-headshot so CDN URL is tr.rbxcdn.com/30DAY-AvatarHeadshot (works in UI). Do not use avatar or avatar-bust (t7/180DAY).
const ROBLOX_THUMBNAILS_URL = 'https://thumbnails.roblox.com/v1/users/avatar-headshot';

interface RobloxUserLookup {
  id: number;
  name: string;
  displayName?: string;
  requestedUsername: string;
}

interface RequestBody {
  username: string;
  participant_id?: string;
}

Deno.serve(async (req) => {
  // CORS preflight: must return 200 OK so browser allows POST from https://afnoo-tournois.github.io
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;
    const { username, participant_id } = body;

    if (!username || typeof username !== 'string') {
      return json({ error: 'username required' }, 400);
    }

    const trimmed = username.trim();
    if (trimmed.length < 3) {
      return json({ error: 'username too short' }, 400);
    }

    // 1) Get user id + display name from Roblox
    const userRes = await fetch(ROBLOX_USERS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [trimmed], excludeBannedUsers: false }),
    });

    if (!userRes.ok) {
      console.error('Roblox users API error', userRes.status, await userRes.text());
      // Fail silently: don't update participant; UI will show controller placeholder
      return json({ found: false });
    }

    const userData = (await userRes.json()) as { data: RobloxUserLookup[] };
    const user = userData?.data?.[0];
    if (!user?.id) {
      // User not found (typo, or username from another platform e.g. Kahoot) – fail silently
      return json({ found: false });
    }

    const roblox_user_id = user.id;
    const roblox_display_name = user.displayName ?? user.name ?? trimmed;

    // 2) Get avatar headshot URL
    const thumbUrl = `${ROBLOX_THUMBNAILS_URL}?userIds=${roblox_user_id}&size=150x150&format=Png`;
    const thumbRes = await fetch(thumbUrl);
    let roblox_avatar_url: string | null = null;
    if (thumbRes.ok) {
      const thumbData = (await thumbRes.json()) as { data?: { imageUrl?: string }[] };
      roblox_avatar_url = thumbData?.data?.[0]?.imageUrl ?? null;
    }

    const payload = {
      roblox_user_id,
      roblox_display_name,
      roblox_avatar_url,
    };

    // 3) Optionally update participant row (requires service role)
    if (participant_id && typeof participant_id === 'string') {
      const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      if (serviceRole && supabaseUrl) {
        const supabase = createClient(supabaseUrl, serviceRole);
        const { error } = await supabase
          .from('participants')
          .update({
            roblox_user_id,
            roblox_display_name,
            roblox_avatar_url,
          })
          .eq('id', participant_id);

        if (error) {
          console.error('Supabase update error', error);
          return json({ ...payload, update_error: error.message }, 200);
        }
      }
    }

    return json(payload);
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
