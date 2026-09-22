import { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { setElementInDoc } from '../../lib/yjsSchema';
import { UserPresence, WhiteboardElement } from '../../types';

interface CollaboratorSimulatorProps {
  isActive: boolean;
  doc: Y.Doc;
  onSimulatedPresence: (peers: UserPresence[]) => void;
}

export const CollaboratorSimulator: React.FC<CollaboratorSimulatorProps> = ({
  isActive,
  doc,
  onSimulatedPresence,
}) => {
  const simStateRef = useRef<{
    t: number;
    bot1: { x: number; y: number; name: string; color: string };
    bot2: { x: number; y: number; name: string; color: string };
  }>({
    t: 0,
    bot1: { x: 300, y: 250, name: 'Elena (Designer)', color: '#059669' },
    bot2: { x: 500, y: 350, name: 'Morgan (Tech Lead)', color: '#ea580c' },
  });

  const animRef = useRef<number>(0);
  const actionTimerRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) {
      onSimulatedPresence([]);
      return;
    }

    // Bot 1 creates a collaborative sticky note / card on initial activation
    const initialSimShapeId = 'sim_note_' + Math.random().toString(36).substring(2, 7);
    const initialNote: WhiteboardElement = {
      id: initialSimShapeId,
      type: 'rect',
      x: 320,
      y: 200,
      width: 180,
      height: 120,
      borderRadius: 12,
      color: '#059669',
      strokeWidth: 2,
      fillColor: '#ccfbf1',
      zOrder: Date.now(),
      createdBy: 'sim_bot_elena',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setElementInDoc(doc, initialNote, 'sim_bot_elena');

    // Bot 2 adds collaborative text inside
    const initialText: WhiteboardElement = {
      id: 'sim_text_' + Math.random().toString(36).substring(2, 7),
      type: 'text',
      x: 340,
      y: 230,
      content: 'Real-time CRDT\nsynced via Yjs!',
      fontSize: 18,
      fontFamily: 'Inter, sans-serif',
      color: '#0f766e',
      strokeWidth: 1,
      zOrder: Date.now() + 1,
      createdBy: 'sim_bot_morgan',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setElementInDoc(doc, initialText, 'sim_bot_morgan');

    const loop = () => {
      simStateRef.current.t += 0.02;
      const t = simStateRef.current.t;

      // Natural organic orbital cursor movement for Bot 1
      const b1x = 410 + Math.sin(t * 1.5) * 160;
      const b1y = 260 + Math.cos(t * 1.8) * 110;

      // Natural organic movement for Bot 2
      const b2x = 520 + Math.cos(t * 1.2) * 140;
      const b2y = 380 + Math.sin(t * 2.1) * 90;

      simStateRef.current.bot1.x = b1x;
      simStateRef.current.bot1.y = b1y;
      simStateRef.current.bot2.x = b2x;
      simStateRef.current.bot2.y = b2y;

      // Broadcast simulated peer presence to UI
      onSimulatedPresence([
        {
          id: 'sim_bot_1',
          name: simStateRef.current.bot1.name,
          color: simStateRef.current.bot1.color,
          cursor: { x: Math.round(b1x), y: Math.round(b1y) },
          activeTool: 'pen',
          selection: [initialSimShapeId],
          lastSeen: Date.now(),
        },
        {
          id: 'sim_bot_2',
          name: simStateRef.current.bot2.name,
          color: simStateRef.current.bot2.color,
          cursor: { x: Math.round(b2x), y: Math.round(b2y) },
          activeTool: 'select',
          selection: [],
          lastSeen: Date.now(),
        },
      ]);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      clearInterval(actionTimerRef.current);
      onSimulatedPresence([]);
    };
  }, [isActive, doc, onSimulatedPresence]);

  return null;
};
