import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function getSupabaseConfigError() {
  if (isSupabaseConfigured) return null;
  return (
    "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
    "Configúralas en Vercel → Project Settings → Environment Variables y vuelve a desplegar."
  );
}

// createClient() lanza si recibe un string vacío, y eso rompe el build/prerender
// en Vercel cuando las envs no están configuradas. Usamos un placeholder no vacío
// para que el build siempre pase; el warning avisa igual en el navegador.
if (!isSupabaseConfigured) {
  if (typeof window !== "undefined") {
    console.warn("[ProveeHub] " + getSupabaseConfigError());
  }
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);

export const ATTACHMENTS_BUCKET = "adjuntos";
