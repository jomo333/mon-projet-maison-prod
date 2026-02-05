import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, secret } = await req.json();

    // Validate inputs
    if (!email || !secret) {
      return new Response(
        JSON.stringify({ error: "Email et secret sont requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check secret against environment variable
    const bootstrapSecret = Deno.env.get("BOOTSTRAP_ADMIN_SECRET");
    if (!bootstrapSecret) {
      return new Response(
        JSON.stringify({ error: "BOOTSTRAP_ADMIN_SECRET non configuré sur le serveur" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (secret !== bootstrapSecret) {
      return new Response(
        JSON.stringify({ error: "Secret invalide" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Find user by email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error listing users:", userError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la recherche de l'utilisateur" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Aucun utilisateur trouvé avec cet email. Assurez-vous d'avoir créé un compte d'abord." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert admin role (with ON CONFLICT DO NOTHING equivalent)
    const { error: insertError } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: user.id, role: "admin" },
        { onConflict: "user_id,role", ignoreDuplicates: true }
      );

    if (insertError) {
      console.error("Error inserting role:", insertError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de l'attribution du rôle admin" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Rôle admin attribué avec succès" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur inattendue du serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
