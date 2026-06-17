// PIN-based login: validates the PIN and returns a one-time token
// that the client exchanges for a session via verifyOtp.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PIN = "148596";
const USER_EMAIL = "octavioribeiroleite@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { pin } = await req.json();
    if (pin !== PIN) {
      return new Response(JSON.stringify({ error: "PIN incorreto" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: USER_EMAIL,
    });

    if (error || !data?.properties?.hashed_token) {
      return new Response(JSON.stringify({ error: error?.message ?? "Falha ao gerar token" }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        token_hash: data.properties.hashed_token,
        email: USER_EMAIL,
      }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
