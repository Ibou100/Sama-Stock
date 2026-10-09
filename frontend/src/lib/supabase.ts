import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_URL !== 'your-project-url'
)

if (!isSupabaseConfigured) {
  console.warn("⚠️ Attention: Les identifiants Supabase ne sont pas configurés dans votre fichier .env")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
