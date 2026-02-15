// Supabase Edge Function: run auto-split for a tournament (assign group_number by signup order, respect max_participants_per_group).
// Called from signup page and admin with the anon key (same as Roblox function). Deploy with --no-verify-jwt so unauthenticated requests are allowed.
// Deploy: supabase functions deploy auto-split-groups --no-verify-jwt
// Set secret: supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

interface RequestBody {
  tournament_id: string;
}

interface ParticipantRow {
  id: string;
  signup_timestamp: string;
}

function computeGroupAssignments(
  participants: ParticipantRow[],
  maxPerGroup: number
): { id: string; group_number: number }[] {
  const total = participants.length;
  if (total === 0) return [];
  const numGroups = Math.max(1, Math.ceil(total / maxPerGroup));
  const base = Math.floor(total / numGroups);
  const remainder = total % numGroups;
  const assignments: { id: string; group_number: number }[] = [];
  let idx = 0;
  for (let g = 1; g <= numGroups; g++) {
    const size = g <= remainder ? base + 1 : base;
    for (let i = 0; i < size && idx < participants.length; i++) {
      assignments.push({ id: participants[idx].id, group_number: g });
      idx++;
    }
  }
  return assignments;
}

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;
    const tournamentId = body?.tournament_id;
    if (!tournamentId || typeof tournamentId !== 'string') {
      return json({ error: 'tournament_id required' }, 400);
    }

    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!serviceRole || !supabaseUrl) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL');
      return json({ error: 'Server not configured' }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRole);

    const { data: tournament, error: tErr } = await supabase
      .from('tournaments')
      .select('max_participants_per_group, max_participants')
      .eq('id', tournamentId)
      .single();

    if (tErr || !tournament) {
      return json({ error: 'Tournament not found', ok: false }, 404);
    }

    const maxPerGroup =
      tournament.max_participants_per_group != null
        ? parseInt(String(tournament.max_participants_per_group), 10)
        : null;

    if (!maxPerGroup || maxPerGroup < 1) {
      return json({ ok: true, num_groups: 1, message: 'No max_participants_per_group set' });
    }

    const { data: participants, error: pErr } = await supabase
      .from('participants')
      .select('id, signup_timestamp')
      .eq('tournament_id', tournamentId)
      .order('signup_timestamp', { ascending: true });

    if (pErr || !participants || participants.length === 0) {
      return json({ ok: true, num_groups: 1, count: 0 });
    }

    const assignments = computeGroupAssignments(participants as ParticipantRow[], maxPerGroup);
    const numGroups = Math.max(...assignments.map((a) => a.group_number));

    for (const { id, group_number } of assignments) {
      const { error: uErr } = await supabase
        .from('participants')
        .update({ group_number })
        .eq('id', id);
      if (uErr) {
        console.error('Update participant group failed:', id, uErr);
        return json({ error: 'Failed to update groups', ok: false }, 500);
      }
    }

    const { error: tUpdateErr } = await supabase
      .from('tournaments')
      .update({ number_of_groups: numGroups })
      .eq('id', tournamentId);

    if (tUpdateErr) {
      console.error('Update tournament number_of_groups failed:', tUpdateErr);
    }

    // Auto-close registration when at capacity
    const maxParticipants =
      tournament.max_participants != null
        ? parseInt(String(tournament.max_participants), 10)
        : null;
    if (maxParticipants != null && participants.length >= maxParticipants) {
      await supabase.from('tournaments').update({ status: 'at_capacity' }).eq('id', tournamentId);
    }

    return json({ ok: true, num_groups, count: participants.length });
  } catch (e) {
    console.error(e);
    return json({ error: String(e), ok: false }, 500);
  }
});
