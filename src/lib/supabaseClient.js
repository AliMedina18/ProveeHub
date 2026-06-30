import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // No tiramos error en build time (Vercel hace build sin envs en algunos casos),
  // pero sí avisamos claro en consola del navegador.
  if (typeof window !== "undefined") {
    console.warn(
      "[ProveeHub] Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Configúralas en .env.local (desarrollo) o en Vercel → Settings → Environment Variables (producción)."
    );
  }
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

export const ATTACHMENTS_BUCKET = "adjuntos";
