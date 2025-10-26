import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://aurtewhjijjrmhammhrm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cnRld2hqaWpqcm1oYW1taHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MzA0MzMsImV4cCI6MjA3NzAwNjQzM30.O9-IuBww7nCRycYMk4t5oAnM95TcOtSmRoR5qos9WRY';

// VERIFICACIÓN INMEDIATA
console.log('🔍 Verificando credenciales:');
console.log('URL:', supabaseUrl);
console.log('API Key length:', supabaseAnonKey.length);
console.log('API Key starts with:', supabaseAnonKey.substring(0, 20));

export const hasSupabase = !!(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabase
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : (null as any);

// TEST DE CONEXIÓN INMEDIATO
if (hasSupabase) {
  console.log('🧪 Probando conexión a Supabase...');
  supabase.auth.getSession()
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Error de conexión:', error);
      } else {
        console.log('✅ Conexión exitosa!');
      }
    })
    .catch(err => {
      console.error('❌ Error fatal:', err);
    });
}
