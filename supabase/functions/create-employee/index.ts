import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🚀 create-employee hit");

    // 🔐 Authorization is already verified by Supabase Gateway
    const authHeader = req.headers.get("Authorization");
    const apiKey = req.headers.get("apikey");

    if (!authHeader) throw new Error("Missing Authorization header");
    if (!apiKey) throw new Error("Missing apikey header");

    const body = await req.json();

    if (!body?.email) throw new Error("Missing email");
    if (!body?.name) throw new Error("Missing name");
    if (!body?.employee_code) throw new Error("Missing employee_code");

    // ✅ role_id is UUID (from roles.id)
    // allow null, but if provided must be string
    const roleId: string | null = body.role_id ? String(body.role_id) : null;

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
    if (!SERVICE_ROLE_KEY) throw new Error("Missing SERVICE_ROLE_KEY");

    const tempPassword = Math.random().toString(36).slice(-8);

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1️⃣ Create auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { name: body.name }, // ✅ name should be in metadata
      });

    if (authError) throw authError;
    const newUserId = authData.user.id;

    // 2️⃣ Insert profile
    const { data: employee, error: insertErr } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: newUserId,
        employee_code: body.employee_code,
        name: body.name,
        email: body.email,
        phone: body.phone ?? null,
        photo_path: body.photo_path ?? null,
        department: body.department ?? null,
        designation: body.designation ?? null,
        role_id: roleId,
        password: tempPassword,
        status: body.status ?? "active",
        joining_date: body.joining_date ?? null,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // 3️⃣ Insert user_roles (only if role_id provided)
    if (roleId) {
      // ✅ if one role per user: replace old roles then insert
      const { error: delErr } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("id", newUserId);

      if (delErr) throw delErr;

      const { error: urErr } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newUserId, role_id: roleId });

      if (urErr) throw urErr;
    }

    return new Response(
      JSON.stringify({
        success: true,
        employee,
        tempPassword, // ✅ return it once (do not store in DB)
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
