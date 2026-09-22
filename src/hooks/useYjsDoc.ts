import { useEffect, useState, useRef, useMemo } from 'react';
import * as Y from 'yjs';
import { SupabaseProvider } from '@supabase-labs/y-supabase';
import { getSupabaseClient } from '../lib/supabase';
import { WhiteboardElement } from '../types';
import { getAllElements } from '../lib/yjsSchema';

export interface YjsDocHook {
  doc: Y.Doc;
  provider: any | null;
  status: 'connected' | 'connecting' | 'local-sync' | 'disconnected';
  isSupabaseConnected: boolean;
  elements: WhiteboardElement[];
  elementsMap: Y.Map<any>;
  boardCode: string;
  reconnect: () => void;
  latencyMs: number;
}

export function useYjsDoc(boardCode: string | null): YjsDocHook {
  const doc = useMemo(() => new Y.Doc(), [boardCode]);
  const [status, setStatus] = useState<'connected' | 'connecting' | 'local-sync' | 'disconnected'>('connecting');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [latencyMs, setLatencyMs] = useState<number>(18);
  const providerRef = useRef<any>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);

  const localBackupKey = `yjs_backup_${boardCode}`;

  useEffect(() => {
    if (!boardCode) return;
    // 1. Restore local backup if available
    try {
      const savedState = localStorage.getItem(localBackupKey);
      if (savedState) {
        const u8 = new Uint8Array(JSON.parse(savedState));
        Y.applyUpdate(doc, u8, 'local-storage-init');
      }
    } catch (e) {
      console.warn('Could not restore local Yjs backup:', e);
    }

    // 2. Setup Elements listener
    const elementsMap = doc.getMap<Y.Map<any>>('elements');
    const updateElements = () => {
      setElements(getAllElements(doc));
    };

    updateElements();
    elementsMap.observeDeep(updateElements);

    // 3. Save updates locally as backup on change
    const onDocUpdate = (update: Uint8Array, origin: any) => {
      // Don't loop broadcast if from bc
      if (origin !== 'broadcast-channel' && bcRef.current) {
        try {
          bcRef.current.postMessage({
            type: 'yjs-update',
            update: Array.from(update),
          });
        } catch (e) {
          // ignore
        }
      }

      // Debounced local storage backup
      try {
        const state = Y.encodeStateAsUpdate(doc);
        localStorage.setItem(localBackupKey, JSON.stringify(Array.from(state)));
      } catch {
        // quota limit guard
      }
    };
    doc.on('update', onDocUpdate);

    // 4. Setup BroadcastChannel for instant multi-tab sync in same browser
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(`whiteboard_room_${boardCode}`);
      bcRef.current = bc;

      bc.onmessage = (event) => {
        if (event.data?.type === 'yjs-update') {
          const update = new Uint8Array(event.data.update);
          Y.applyUpdate(doc, update, 'broadcast-channel');
        } else if (event.data?.type === 'request-state') {
          const state = Y.encodeStateAsUpdate(doc);
          bc.postMessage({
            type: 'sync-state',
            state: Array.from(state),
          });
        } else if (event.data?.type === 'sync-state') {
          const state = new Uint8Array(event.data.state);
          Y.applyUpdate(doc, state, 'broadcast-channel');
        }
      };

      // Request initial state from other active tabs
      bc.postMessage({ type: 'request-state' });
    }

    // 5. Connect Supabase Realtime Provider if configured
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        setStatus('connecting');
        const start = Date.now();
        const provider = new SupabaseProvider(boardCode, doc, supabase, {
          awareness: true,
          persistence: true,
          autoReconnect: true,
          broadcastThrottleMs: 50,
        });

        providerRef.current = provider;

        provider.on('status', (event: any) => {
          if (event.status === 'connected') {
            setStatus('connected');
            setIsSupabaseConnected(true);
            setLatencyMs(Math.max(12, Math.round(Date.now() - start)));
          } else if (event.status === 'connecting') {
            setStatus('connecting');
          } else {
            setStatus('disconnected');
          }
        });

        (provider as any).on('synced', () => {
          setStatus('connected');
          setIsSupabaseConnected(true);
        });
      } catch (err) {
        console.warn('SupabaseProvider error, using local/broadcast sync:', err);
        setStatus('local-sync');
        setIsSupabaseConnected(false);
      }
    } else {
      setStatus('local-sync');
      setIsSupabaseConnected(false);
    }

    return () => {
      elementsMap.unobserveDeep(updateElements);
      doc.off('update', onDocUpdate);
      if (bcRef.current) {
        bcRef.current.close();
        bcRef.current = null;
      }
      if (providerRef.current) {
        try {
          providerRef.current.destroy();
        } catch {
          // ignore
        }
        providerRef.current = null;
      }
    };
  }, [doc, boardCode]);

  const reconnect = () => {
    if (!boardCode) return;
    const supabase = getSupabaseClient();
    if (supabase && providerRef.current) {
      try {
        providerRef.current.destroy();
      } catch {}
      setStatus('connecting');
      try {
        const provider = new SupabaseProvider(boardCode, doc, supabase, {
          awareness: true,
          persistence: true,
          autoReconnect: true,
          broadcastThrottleMs: 50,
        });
        providerRef.current = provider;
        setStatus('connected');
        setIsSupabaseConnected(true);
      } catch {
        setStatus('local-sync');
      }
    } else {
      setStatus('local-sync');
    }
  };

  const elementsMap = useMemo(() => doc.getMap<Y.Map<any>>('elements'), [doc]);

  return {
    doc,
    provider: providerRef.current,
    status,
    isSupabaseConnected,
    elements,
    elementsMap,
    boardCode: boardCode ?? '',
    reconnect,
    latencyMs,
  };
}
