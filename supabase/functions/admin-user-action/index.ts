import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore: Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "https://artspacee.com",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  try {
    const { uid, action } = await req.json();
    if (!uid || !action) {
      return new Response(JSON.stringify({ error: 'Missing uid or action' }), { status: 400, headers: corsHeaders() });
    }

    // @ts-ignore: Deno runtime
    const supabaseAdmin = createClient(
      // @ts-ignore: Deno runtime
      Deno.env.get('SUPABASE_URL'),
      // @ts-ignore: Deno runtime
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );

    if (action === 'ban' || action === 'unban') {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ is_banned: action === 'ban' })
        .eq('id', uid);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders() });
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders() });
    }

    if (action === 'delete') {
      // Delete from profiles
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', uid);
      if (profileError) {
        return new Response(JSON.stringify({ error: profileError.message }), { status: 500, headers: corsHeaders() });
      }
      // Delete from auth.users
      const { error: userError } = await supabaseAdmin.auth.admin.deleteUser(uid);
      if (userError) {
        return new Response(JSON.stringify({ error: userError.message }), { status: 500, headers: corsHeaders() });
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders() });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders() });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers: corsHeaders() });
  }
}); 