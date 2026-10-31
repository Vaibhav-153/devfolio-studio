export function hasSupabaseConfig() {return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);}
export const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost';
export const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
