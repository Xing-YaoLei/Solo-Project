import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const globalForSupabase = globalThis as unknown as {
  supabase: SupabaseClient | undefined;
};

function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) to enable Supabase data source."
    );
  }
  return createClient(supabaseUrl, supabaseKey);
}

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseKey);
}

export const supabase: SupabaseClient = globalForSupabase.supabase ?? (isSupabaseConfigured() ? createSupabaseClient() : (null as unknown as SupabaseClient));

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabase = supabase;
}
