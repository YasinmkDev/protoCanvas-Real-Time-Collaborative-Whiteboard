import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BoardMetadata, SupabaseConfig } from '../types';

const DEFAULT_SUPABASE_URL = 'https://luokhoatwhkjfthljypn.supabase.co';
const DEFAULT_SUPABASE_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1b2tob2F0d2hramZ0aGxqeXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2ODA2NDgsImV4cCI6MjA1MjI1NjY0OH0.jrXXJnpeeYc4rt1b_VYTJCYFYQluL4nxUBtC4YuAIcs';

/**
 * Returns active Supabase config securely from environment variables
 */
export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const url = (envUrl && !envUrl.includes('your-project') ? envUrl : DEFAULT_SUPABASE_URL).trim();
  const anonKey = (envAnon && !envAnon.includes('your-anon') ? envAnon : DEFAULT_SUPABASE_ANON).trim();

  return { url, anonKey };
}

export function isEnvConfigured(): boolean {
  return true;
}

let cachedClient: SupabaseClient | null = null;
let cachedConfigKey = '';

/**
 * Returns an active SupabaseClient if credentials exist
 */
export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) return null;

  const key = `${config.url}_${config.anonKey}`;
  if (cachedClient && cachedConfigKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
    });
    cachedConfigKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * 6-character room code generator (from 32-character alphabet)
 */
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export function generateBoardCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length));
  }
  return code;
}

/**
 * Local Board Storage fallback (so boards persist and list instantly even when offline)
 */
const LOCAL_BOARDS_KEY = 'whiteboard_recent_boards';
const LAST_ACTIVE_BOARD_KEY = 'protocanvas_last_active_board';

export function getLocalBoards(): BoardMetadata[] {
  try {
    const raw = localStorage.getItem(LOCAL_BOARDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getLastActiveBoardCode(): string | null {
  try {
    return localStorage.getItem(LAST_ACTIVE_BOARD_KEY);
  } catch {
    return null;
  }
}

export function setLastActiveBoardCode(code: string) {
  try {
    localStorage.setItem(LAST_ACTIVE_BOARD_KEY, code.toUpperCase());
  } catch (err) {
    console.warn('Failed to set last active board:', err);
  }
}

export function saveLocalBoard(board: Partial<BoardMetadata> & { id: string }) {
  try {
    const existing = getLocalBoards();
    const existingBoard = existing.find((b) => b.id === board.id);
    const now = new Date().toISOString();

    const updatedBoard: BoardMetadata = {
      id: board.id,
      name: board.name || existingBoard?.name || `Board ${board.id}`,
      created_at: existingBoard?.created_at || board.created_at || now,
      updated_at: now,
      last_active_at: board.last_active_at || now,
      is_archived: board.is_archived !== undefined ? board.is_archived : (existingBoard?.is_archived || false),
      elementCount: board.elementCount !== undefined ? board.elementCount : (existingBoard?.elementCount ?? 0),
      previewSnippet: board.previewSnippet !== undefined ? board.previewSnippet : (existingBoard?.previewSnippet || ''),
      elementsSummary: board.elementsSummary || existingBoard?.elementsSummary,
    };

    const filtered = existing.filter((b) => b.id !== board.id);
    // Keep up to 50 previous whiteboards
    const updated = [updatedBoard, ...filtered].slice(0, 50);
    localStorage.setItem(LOCAL_BOARDS_KEY, JSON.stringify(updated));
    setLastActiveBoardCode(board.id);
  } catch (err) {
    console.warn('Failed to save local board:', err);
  }
}

export function renameLocalBoard(boardId: string, newName: string) {
  try {
    const existing = getLocalBoards();
    const updated = existing.map((b) =>
      b.id === boardId ? { ...b, name: newName, updated_at: new Date().toISOString() } : b
    );
    localStorage.setItem(LOCAL_BOARDS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to rename local board:', err);
  }
}

export function deleteLocalBoard(boardId: string): BoardMetadata[] {
  try {
    const existing = getLocalBoards();
    const updated = existing.filter((b) => b.id !== boardId);
    localStorage.setItem(LOCAL_BOARDS_KEY, JSON.stringify(updated));
    // Also remove cached yjs backup
    localStorage.removeItem(`yjs_backup_${boardId}`);
    return updated;
  } catch (err) {
    console.warn('Failed to delete local board:', err);
    return [];
  }
}

export function duplicateLocalBoard(sourceId: string, newId: string, customName?: string): BoardMetadata | null {
  try {
    const existing = getLocalBoards();
    const sourceBoard = existing.find((b) => b.id === sourceId);
    const sourceData = localStorage.getItem(`yjs_backup_${sourceId}`);

    if (sourceData) {
      localStorage.setItem(`yjs_backup_${newId}`, sourceData);
    }

    const now = new Date().toISOString();
    const newBoard: BoardMetadata = {
      id: newId,
      name: customName || `${sourceBoard?.name || `Board ${sourceId}`} (Copy)`,
      created_at: now,
      updated_at: now,
      last_active_at: now,
      is_archived: false,
      elementCount: sourceBoard?.elementCount || 0,
      previewSnippet: sourceBoard?.previewSnippet || '',
      elementsSummary: sourceBoard?.elementsSummary,
    };

    const updated = [newBoard, ...existing].slice(0, 50);
    localStorage.setItem(LOCAL_BOARDS_KEY, JSON.stringify(updated));
    setLastActiveBoardCode(newId);
    return newBoard;
  } catch (err) {
    console.warn('Failed to duplicate board:', err);
    return null;
  }
}

/**
 * Fetches recent boards from Supabase if connected, otherwise returns local boards
 */
export async function fetchRecentBoards(): Promise<BoardMetadata[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('is_archived', false)
        .order('last_active_at', { ascending: false })
        .limit(10);

      if (!error && data && data.length > 0) {
        return data as BoardMetadata[];
      }
    } catch (err) {
      console.warn('Supabase fetch boards error, falling back to local:', err);
    }
  }
  return getLocalBoards();
}

/**
 * Creates a new board record in Supabase or local storage
 */
export async function createBoardRecord(code: string): Promise<BoardMetadata> {
  const now = new Date().toISOString();
  const boardMeta: BoardMetadata = {
    id: code,
    created_at: now,
    updated_at: now,
    last_active_at: now,
    is_archived: false,
  };

  saveLocalBoard(boardMeta);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('boards').insert([boardMeta]);
    } catch (err) {
      console.warn('Could not insert board to Supabase:', err);
    }
  }

  return boardMeta;
}
