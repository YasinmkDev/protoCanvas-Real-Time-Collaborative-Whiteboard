import { useEffect, useState, useRef, useCallback } from 'react';
import { UserPresence, Tool } from '../types';
import { getCurrentUser, updateUserProfile } from '../lib/auth';

// Curated 10-color high-contrast palette (WCAG compliant)
export const COLLABORATOR_COLORS = [
  '#8169ff', // Electric Violet
  '#2563eb', // Royal Blue
  '#059669', // Emerald
  '#d97706', // Amber
  '#dc2626', // Crimson
  '#7c3aed', // Purple
  '#0891b2', // Cyan
  '#db2777', // Pink
  '#ea580c', // Orange
  '#16a34a', // Green
];

export function getOrCreateLocalUser(): { id: string; name: string; color: string } {
  const user = getCurrentUser();
  return { id: user.id, name: user.name, color: user.color };
}

export function saveLocalUserProfile(name: string, color: string) {
  updateUserProfile({ name, color });
}

export interface UseAwarenessReturn {
  currentUser: { id: string; name: string; color: string };
  collaborators: UserPresence[];
  updateCursor: (pos: { x: number; y: number } | null, tool?: Tool) => void;
  updateSelection: (selection: string[]) => void;
  updateProfile: (name: string, color: string) => void;
}

export function useAwareness(provider: any, boardCode: string): UseAwarenessReturn {
  const [currentUser, setCurrentUser] = useState(getOrCreateLocalUser);
  const [collaborators, setCollaborators] = useState<UserPresence[]>([]);
  const lastCursorUpdateRef = useRef<number>(0);
  const currentSelectionRef = useRef<string[]>([]);
  const bcRef = useRef<BroadcastChannel | null>(null);

  // 1. Setup awareness through provider (SupabaseProvider awareness)
  useEffect(() => {
    if (!provider || !provider.awareness) return;

    const awareness = provider.awareness;
    awareness.setLocalStateField('user', {
      id: currentUser.id,
      name: currentUser.name,
      color: currentUser.color,
      cursor: null,
      selection: currentSelectionRef.current,
      lastSeen: Date.now(),
    });

    const handleAwarenessChange = () => {
      const states = awareness.getStates();
      const list: UserPresence[] = [];
      const now = Date.now();

      states.forEach((state: any, clientID: number) => {
        if (!state?.user) return;
        if (state.user.id === currentUser.id) return; // skip self

        // Fade out inactive cursors older than 4s
        const isStale = state.user.lastSeen && now - state.user.lastSeen > 4000;
        list.push({
          id: state.user.id || String(clientID),
          name: state.user.name || 'Anonymous',
          color: state.user.color || '#8169ff',
          cursor: isStale ? null : state.user.cursor,
          activeTool: state.user.activeTool,
          selection: state.user.selection || [],
          lastSeen: state.user.lastSeen,
        });
      });

      setCollaborators(list);
    };

    awareness.on('change', handleAwarenessChange);
    handleAwarenessChange();

    return () => {
      awareness.off('change', handleAwarenessChange);
    };
  }, [provider, currentUser]);

  // 2. BroadcastChannel awareness fallback for local multi-tab testing
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const bc = new BroadcastChannel(`whiteboard_awareness_${boardCode}`);
    bcRef.current = bc;

    const remotePeers = new Map<string, UserPresence>();

    bc.onmessage = (event) => {
      const { type, payload } = event.data || {};
      if (type === 'peer-presence' && payload && payload.id !== currentUser.id) {
        remotePeers.set(payload.id, {
          ...payload,
          lastSeen: Date.now(),
        });
      } else if (type === 'peer-leave' && payload?.id) {
        remotePeers.delete(payload.id);
      }

      // Cleanup stale peers
      const now = Date.now();
      remotePeers.forEach((peer, id) => {
        if (peer.lastSeen && now - peer.lastSeen > 5000) {
          remotePeers.delete(id);
        }
      });

      // If no SupabaseProvider is active, use BroadcastChannel peers
      if (!provider || !provider.awareness) {
        setCollaborators(Array.from(remotePeers.values()));
      }
    };

    // Broadcast join ping
    bc.postMessage({
      type: 'peer-presence',
      payload: {
        id: currentUser.id,
        name: currentUser.name,
        color: currentUser.color,
        cursor: null,
        selection: currentSelectionRef.current,
        lastSeen: Date.now(),
      },
    });

    const interval = setInterval(() => {
      // Periodic ping
      bc.postMessage({
        type: 'peer-presence',
        payload: {
          id: currentUser.id,
          name: currentUser.name,
          color: currentUser.color,
          cursor: null,
          selection: currentSelectionRef.current,
          lastSeen: Date.now(),
        },
      });
    }, 2500);

    return () => {
      clearInterval(interval);
      bc.postMessage({ type: 'peer-leave', payload: { id: currentUser.id } });
      bc.close();
      bcRef.current = null;
    };
  }, [boardCode, currentUser, provider]);

  // Throttle cursor broadcast to 50ms as per NFR-1 & FR-3
  const updateCursor = useCallback(
    (pos: { x: number; y: number } | null, tool?: Tool) => {
      const now = Date.now();
      if (pos !== null && now - lastCursorUpdateRef.current < 45) {
        return;
      }
      lastCursorUpdateRef.current = now;

      const userState = {
        id: currentUser.id,
        name: currentUser.name,
        color: currentUser.color,
        cursor: pos,
        activeTool: tool,
        selection: currentSelectionRef.current,
        lastSeen: now,
      };

      if (provider?.awareness) {
        provider.awareness.setLocalStateField('user', userState);
      }

      if (bcRef.current) {
        bcRef.current.postMessage({
          type: 'peer-presence',
          payload: userState,
        });
      }
    },
    [provider, currentUser]
  );

  const updateSelection = useCallback(
    (selection: string[]) => {
      currentSelectionRef.current = selection;
      if (provider?.awareness) {
        const local = provider.awareness.getLocalState();
        if (local?.user) {
          provider.awareness.setLocalStateField('user', {
            ...local.user,
            selection,
          });
        }
      }
      if (bcRef.current) {
        bcRef.current.postMessage({
          type: 'peer-presence',
          payload: {
            id: currentUser.id,
            name: currentUser.name,
            color: currentUser.color,
            cursor: null,
            selection,
            lastSeen: Date.now(),
          },
        });
      }
    },
    [provider, currentUser]
  );

  const updateProfile = useCallback(
    (name: string, color: string) => {
      saveLocalUserProfile(name, color);
      const updated = { ...currentUser, name, color };
      setCurrentUser(updated);

      if (provider?.awareness) {
        const local = provider.awareness.getLocalState();
        provider.awareness.setLocalStateField('user', {
          ...(local?.user || {}),
          name,
          color,
        });
      }
    },
    [currentUser, provider]
  );

  return {
    currentUser,
    collaborators,
    updateCursor,
    updateSelection,
    updateProfile,
  };
}
