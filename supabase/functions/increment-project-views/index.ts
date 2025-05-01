
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

interface RequestBody {
  project_id: string;
}

serve(async (req) => {
  try {
    // Create a Supabase client with the Auth context of the logged in user
    const authorization = req.headers.get('Authorization')
    if (!authorization) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    })

    // Parse the request body
    const { project_id } = await req.json() as RequestBody
    
    if (!project_id) {
      return new Response(
        JSON.stringify({ error: 'Missing project_id parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Increment the views count in the projects table
    const { data, error } = await supabase
      .from('projects')
      .update({ views: supabase.rpc('increment', { x: 1, row_id: project_id }) })
      .eq('id', project_id)
      .select('views')
      .single()

    if (error) {
      console.error('Error incrementing views:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to increment views' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, views: data.views }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
