/**
 * Supabase client — same `Library` table the web app uses, so search
 * history is shared across web and mobile. Signed-in users only;
 * guests keep local recents (per design spec §4).
 */
import { createClient } from '@supabase/supabase-js';
import type { LibraryRow, SearchType } from '@/types/api';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';

export const supabase = url && key ? createClient(url, key) : null;

export interface LibraryEntryInput {
  searchInput: string;
  userEmail: string;
  type: SearchType;
  libId: string;
}

export async function insertLibraryEntry(entry: LibraryEntryInput): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('Library').insert(entry);
  if (error) console.warn('[Library] insert failed:', error.message);
}

export async function fetchLibrary(userEmail: string): Promise<LibraryRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('Library')
    .select('*')
    .eq('userEmail', userEmail)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    console.warn('[Library] fetch failed:', error.message);
    return [];
  }
  return data ?? [];
}

export async function fetchLibraryEntry(libId: string): Promise<LibraryRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('Library')
    .select('*')
    .eq('libId', libId)
    .single();
  if (error) {
    console.warn('[Library] fetch single entry failed:', error.message);
    return null;
  }
  return data;
}

export async function deleteLibraryEntry(libId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('Library').delete().eq('libId', libId);
  if (error) console.warn('[Library] delete failed:', error.message);
}
