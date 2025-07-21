// supabase/functions/get-user-email/index.ts
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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  try {
    const { uid } = await req.json();
    if (!uid) {
      return new Response(JSON.stringify({ error: 'Missing uid' }), { status: 400, headers: corsHeaders() });
    }

    // Use the admin client to access auth.users
    // @ts-ignore: Deno runtime
    const supabaseAdmin = createClient(
      // @ts-ignore: Deno runtime
      Deno.env.get('SUPABASE_URL'),
      // @ts-ignore: Deno runtime
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );

    const { data, error } = await supabaseAdmin.auth.admin.getUserById(uid);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders() });
    }
    if (!data?.user?.email) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: corsHeaders() });
    }
    return new Response(JSON.stringify({ 
      email: data.user.email, 
      lastSignInAt: data.user.last_sign_in_at || null 
    }), { status: 200, headers: corsHeaders() });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers: corsHeaders() });
  }
}); 