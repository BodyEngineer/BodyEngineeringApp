import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const {
      type,
      owner_id,
      full_name,
      email,
      password,
      phone,
      membership_type,
      membership_start,
      membership_end,
      notes,
      goal,
      package_type,
    } = body;

    // Create Auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) throw authError;

    // Insert Member
    if (type === "online") {

      const { error } = await supabase
        .from("online_clients")
        .insert({
          owner_id,
          auth_user_id: authData.user.id,
          full_name,
          email,
          phone,
          goal,
          package_type,
        });
    
      if (error) throw error;
    
    } else {
    
      const { error } = await supabase
        .from("members")
        .insert({
          owner_id,
          auth_user_id: authData.user.id,
          full_name,
          email,
          phone,
          membership_type,
          membership_start,
          membership_end,
          notes,
        });
    
      if (error) throw error;
    
    }

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        }
      }
    );
  }
});