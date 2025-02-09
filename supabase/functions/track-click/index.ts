
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { url, ip } = await req.json()

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get geolocation data from IP
    const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`)
    const geoData = await geoResponse.json()

    // Insert URL if it doesn't exist
    const { data: linkData, error: linkError } = await supabaseClient
      .from('links')
      .upsert(
        { original_url: url },
        { onConflict: 'original_url', returning: true }
      )
      .select()
      .single()

    if (linkError) throw linkError

    // Record click analytics
    const { error: analyticsError } = await supabaseClient
      .from('click_analytics')
      .insert({
        link_id: linkData.id,
        timezone: geoData.timezone,
        country: geoData.country_name,
        region: geoData.region,
        city: geoData.city,
        ip_address: ip,
        user_agent: req.headers.get('user-agent') || ''
      })

    if (analyticsError) throw analyticsError

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
