import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// createClient() lanza si recibe un string vacío, y eso rompe el build/prerender
// en Vercel cuando las envs no están configuradas. Usamos un placeholder no vacío
// para que el build siempre pase; el warning avisa igual en el navegador.
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== "undefined") {
    console.warn(
      "[ProveeHub] Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Configúralas en .env.local (desarrollo) o en Vercel → Settings → Environment Variables (producción)."
    );
  }
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);

export const ATTACHMENTS_BUCKET = "adjuntos";
