import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aurtewhjijjrmhammhrm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cnRld2hqaWpqcm1oYW1taHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MzA0MzMsImV4cCI6MjA3NzAwNjQzM30.O9-IuBww7nCRycYMk4t5oAnM95TcOtSmRoR5qos9WRY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
