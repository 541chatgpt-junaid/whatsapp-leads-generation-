import { createClient } from "@supabase/supabase-js";

// Vercel / .env.local me ye do values set hon to dashboard Supabase se chalta hai.
// Na hon to pehle ki tarah sirf browser localStorage use hota hai.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;
