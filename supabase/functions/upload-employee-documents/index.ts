import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, content-type, apikey, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }


  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    const field = form.get("field") as string;

    if (!file) {
      return new Response(JSON.stringify({ error: "file missing" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const ext = file.name.split(".").pop();
    const fileName = `${field}_${Date.now()}.${ext}`;
    const buffer = new Uint8Array(await file.arrayBuffer());

    const { error } = await supabase.storage
      .from("employee-documents")
      .upload(fileName, buffer, {
        contentType: file.type,
      });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const { data } = supabase.storage
      .from("employee-documents")
      .getPublicUrl(fileName);

    return new Response(JSON.stringify({ url: data.publicUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
