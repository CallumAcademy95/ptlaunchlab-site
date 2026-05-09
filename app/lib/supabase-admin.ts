import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-side Supabase client using the service role key.
// IMPORTANT: never expose this to the browser. Only use in API routes / server actions.
// Per project memory: @supabase/ssr's createServerClient does NOT bypass RLS even with
// service_role; use createClient from @supabase/supabase-js for admin writes.

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase admin client not configured. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  cached = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cached;
}

export type WhatsAppMessageRow = {
  id: string;
  direction: "inbound" | "outbound";
  phone: string;
  contact_name: string | null;
  body: string | null;
  message_type: string | null;
  meta_message_id: string | null;
  status: string | null;
  created_at: string;
};
