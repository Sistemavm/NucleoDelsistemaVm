import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://aurtewhjijjrmhammhrm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cnRld2hqaWpqcm1oYW1taHJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTQzMDQzMywiZXhwIjoyMDc3MDA2NDMzfQ.gkFfuJYTOMWb2KFbQs6Qt8Z_CyUbPNx0CTlNOJSHvh8';

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
