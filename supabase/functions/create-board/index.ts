// Supabase Edge Function: create-board
// Generates unique 6-character code, inserts into boards table, and returns { code, url }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const code = generateCode();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('boards')
      .insert([
        {
          id: code,
          created_at: now,
          updated_at: now,
          last_active_at: now,
          is_archived: false,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    const origin = req.headers.get('origin') || '';
    const url = `${origin}/?board=${code}`;

    return new Response(JSON.stringify({ code, url, board: data }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      status: 400,
    });
  }
});
