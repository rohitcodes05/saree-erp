import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// ─── Environment Validation ───────────────────────────────────────────────────

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl === 'https://your-project-ref.supabase.co') {
  console.error(
    '[Supabase] VITE_SUPABASE_URL is not set. Copy .env.example → .env.local and fill in your values.'
  );
}

if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
  console.error(
    '[Supabase] VITE_SUPABASE_ANON_KEY is not set. Copy .env.example → .env.local and fill in your values.'
  );
}

// ─── Supabase Client ──────────────────────────────────────────────────────────

// Use any to bypass strict generic inference errors from manually maintained Database types
export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'saree-erp-session',
    storage: window.localStorage,
  },
  global: {
    headers: {
      'x-app-name': 'saree-erp',
      'x-app-version': import.meta.env.VITE_APP_VERSION ?? '1.0.0',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
}) as any;

// ─── Realtime Subscriptions Helper ────────────────────────────────────────────

/**
 * Subscribe to real-time changes on a table filtered by company.
 * Returns an unsubscribe function.
 */
export function subscribeToTable(
  table: string,
  filter: string,
  callback: (payload: unknown) => void
): () => void {
  const channel = supabase
    .channel(`${table}:${filter}`)
    .on('postgres_changes', { event: '*', schema: 'public', table, filter }, callback)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── Storage Helpers ──────────────────────────────────────────────────────────

export const STORAGE_BUCKETS = {
  PRODUCTS: 'product-images',
  LOGOS: 'logos',
  AVATARS: 'avatars',
  DOCUMENTS: 'documents',
} as const;

export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: { contentType?: string; upsert?: boolean }
): Promise<{ url: string; path: string } | { error: string }> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: options?.contentType ?? file.type,
      upsert: options?.upsert ?? false,
    });

  if (error) {
    return { error: error.message };
  }

  return {
    url: getPublicUrl(bucket, data.path),
    path: data.path,
  };
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  await supabase.storage.from(bucket).remove([path]);
}

// ─── Typed RPC Helper ────────────────────────────────────────────────────────

export async function rpc<T>(
  fnName: string,
  args?: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)(fnName, args ?? {});
  if (error) return { data: null, error: error.message };
  return { data: data as T, error: null };
}
