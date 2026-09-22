// Authentication & User Profile Management for Collaborative Whiteboard
import { COLLABORATOR_COLORS } from '../hooks/useAwareness';
import { getSupabaseClient } from './supabase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  color: string;
  isRegistered: boolean;
  avatarInitials: string;
  createdAt: string;
  supabaseId?: string;
}

const STORAGE_KEY = 'canvas_user_profile';
const LOCAL_USER_NAME_KEY = 'whiteboard_user_name';
const LOCAL_USER_COLOR_KEY = 'whiteboard_user_color';
const LOCAL_USER_ID_KEY = 'whiteboard_user_id';

export function getInitials(name: string): string {
  if (!name || !name.trim()) return 'U';
  // Filter out numbers and special characters so digits never form initials (e.g. prevents "C6" or "U4")
  const lettersOnly = name.replace(/[^a-zA-Z\s]/g, '').trim();
  if (!lettersOnly) return 'U';
  const parts = lettersOnly.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, Math.min(2, parts[0].length)).toUpperCase();
}

export function getCurrentUser(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id && parsed.name) {
        // Automatically cleanse legacy "Creator 672" or "C6" or "Studio Guest" hardcoded artifacts
        if (
          parsed.name.startsWith('Creator ') ||
          parsed.avatarInitials === 'C6' ||
          parsed.name === 'Studio Guest'
        ) {
          const num = Math.floor(1000 + Math.random() * 9000);
          parsed.name = `User #${num}`;
          parsed.avatarInitials = 'U';
          parsed.isRegistered = false;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          localStorage.setItem(LOCAL_USER_NAME_KEY, parsed.name);
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored user profile', e);
  }

  // Fallback: check if older keys exist
  let id = localStorage.getItem(LOCAL_USER_ID_KEY);
  if (!id) {
    id = 'usr_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem(LOCAL_USER_ID_KEY, id);
  }

  let storedName = localStorage.getItem(LOCAL_USER_NAME_KEY);
  if (!storedName || storedName === 'Studio Guest' || storedName.startsWith('Creator ')) {
    const num = Math.floor(1000 + Math.random() * 9000);
    storedName = `User #${num}`;
    localStorage.setItem(LOCAL_USER_NAME_KEY, storedName);
  }

  const color =
    localStorage.getItem(LOCAL_USER_COLOR_KEY) ||
    COLLABORATOR_COLORS[Math.floor(Math.random() * COLLABORATOR_COLORS.length)];

  const defaultProfile: UserProfile = {
    id,
    name: storedName,
    email: '',
    role: 'Collaborator',
    color,
    isRegistered: false,
    avatarInitials: getInitials(storedName),
    createdAt: new Date().toISOString(),
  };

  return defaultProfile;
}

export function registerUser(data: {
  name: string;
  email: string;
  color?: string;
  role?: string;
  supabaseId?: string;
}): UserProfile {
  const existingId = localStorage.getItem(LOCAL_USER_ID_KEY);
  const id = data.supabaseId || existingId || 'usr_' + Math.random().toString(36).substring(2, 9);
  const color =
    data.color ||
    COLLABORATOR_COLORS[Math.floor(Math.random() * COLLABORATOR_COLORS.length)];
  const name = data.name.trim();
  const role = data.role?.trim() || 'Product Designer';
  const email = data.email.trim().toLowerCase();

  const profile: UserProfile = {
    id,
    name,
    email,
    role,
    color,
    isRegistered: true,
    avatarInitials: getInitials(name),
    createdAt: new Date().toISOString(),
    supabaseId: data.supabaseId,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  localStorage.setItem(LOCAL_USER_ID_KEY, id);
  localStorage.setItem(LOCAL_USER_NAME_KEY, name);
  localStorage.setItem(LOCAL_USER_COLOR_KEY, color);

  return profile;
}

/**
 * Registers user with Supabase Auth, storing metadata and falling back gracefully
 */
export async function supabaseSignUp(data: {
  email: string;
  password: string;
  name: string;
  role?: string;
  color?: string;
}): Promise<{ user: UserProfile; error: string | null }> {
  const supabase = getSupabaseClient();
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanName = data.name.trim();

  if (supabase) {
    try {
      const res = await supabase.auth.signUp({
        email: cleanEmail,
        password: data.password,
        options: {
          data: {
            name: cleanName,
            role: data.role || 'Product Designer',
            color: data.color || COLLABORATOR_COLORS[0],
          },
        },
      });

      if (res.error) {
        return {
          user: registerUser({
            name: cleanName,
            email: cleanEmail,
            role: data.role,
            color: data.color,
          }),
          error: res.error.message,
        };
      }

      const sbUser = res.data.user;
      const profile = registerUser({
        name: cleanName,
        email: cleanEmail,
        role: data.role,
        color: data.color,
        supabaseId: sbUser?.id,
      });

      return { user: profile, error: null };
    } catch (err: any) {
      console.warn('Supabase sign up warning:', err);
    }
  }

  // Fallback to local user registration if Supabase is unavailable
  const profile = registerUser({
    name: cleanName,
    email: cleanEmail,
    role: data.role,
    color: data.color,
  });
  return { user: profile, error: null };
}

/**
 * Signs in user with Supabase Auth
 */
export async function supabaseSignIn(
  email: string,
  password: string
): Promise<{ user: UserProfile | null; error: string | null }> {
  const supabase = getSupabaseClient();
  const cleanEmail = email.trim().toLowerCase();

  if (supabase) {
    try {
      const res = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (res.error) {
        return { user: null, error: res.error.message };
      }

      const sbUser = res.data.user;
      if (sbUser) {
        const metadata = sbUser.user_metadata || {};
        const profile = registerUser({
          name: metadata.name || cleanEmail.split('@')[0],
          email: cleanEmail,
          role: metadata.role || 'Product Designer',
          color: metadata.color || COLLABORATOR_COLORS[0],
          supabaseId: sbUser.id,
        });
        return { user: profile, error: null };
      }
    } catch (err: any) {
      console.warn('Supabase sign in error:', err);
      return { user: null, error: err.message || 'Authentication failed' };
    }
  }

  // Fallback to local login if offline
  const profile = loginUser(cleanEmail);
  return { user: profile, error: null };
}

export function loginUser(email: string, name?: string): UserProfile {
  const cleanEmail = email.trim().toLowerCase();
  const fallbackName = name || cleanEmail.split('@')[0] || 'Studio Member';
  return registerUser({
    name: fallbackName,
    email: cleanEmail,
  });
}

export function quickGuestLogin(name?: string): UserProfile {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const guestName = name && name.trim() ? name.trim() : `User #${randomSuffix}`;
  const color = COLLABORATOR_COLORS[Math.floor(Math.random() * COLLABORATOR_COLORS.length)];
  const id = 'usr_' + Math.random().toString(36).substring(2, 9);

  const profile: UserProfile = {
    id,
    name: guestName,
    email: `guest_${randomSuffix}@canvas.local`,
    role: 'Collaborator',
    color,
    isRegistered: false,
    avatarInitials: getInitials(guestName),
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  localStorage.setItem(LOCAL_USER_ID_KEY, id);
  localStorage.setItem(LOCAL_USER_NAME_KEY, guestName);
  localStorage.setItem(LOCAL_USER_COLOR_KEY, color);

  return profile;
}

export function logoutUser(): UserProfile {
  localStorage.removeItem(STORAGE_KEY);
  const id = 'usr_' + Math.random().toString(36).substring(2, 9);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const defaultProfile: UserProfile = {
    id,
    name: `User #${randomSuffix}`,
    email: '',
    role: 'Collaborator',
    color: COLLABORATOR_COLORS[Math.floor(Math.random() * COLLABORATOR_COLORS.length)],
    isRegistered: false,
    avatarInitials: 'U',
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(LOCAL_USER_ID_KEY, id);
  localStorage.setItem(LOCAL_USER_NAME_KEY, defaultProfile.name);
  localStorage.setItem(LOCAL_USER_COLOR_KEY, defaultProfile.color);
  return defaultProfile;
}

export function updateUserProfile(updates: Partial<UserProfile>): UserProfile {
  const current = getCurrentUser();
  const updated: UserProfile = {
    ...current,
    ...updates,
    avatarInitials: updates.name ? getInitials(updates.name) : current.avatarInitials,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  if (updated.name) localStorage.setItem(LOCAL_USER_NAME_KEY, updated.name);
  if (updated.color) localStorage.setItem(LOCAL_USER_COLOR_KEY, updated.color);

  return updated;
}
