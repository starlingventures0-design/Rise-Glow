import { createClient } from "@supabase/supabase-js";

// هذه القيم تُقرأ من ملف .env (لا تكتبيها هنا مباشرة)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "⚠️ تأكدي من إضافة VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف .env"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
