import { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';

export interface UseUndoRedoReturn {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  stopCapturing: () => void;
}

export function useUndoRedo(doc: Y.Doc, userOrigin: string): UseUndoRedoReturn {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const undoManagerRef = useRef<Y.UndoManager | null>(null);

  useEffect(() => {
    const elementsMap = doc.getMap<Y.Map<any>>('elements');

    // Create UndoManager scoped strictly to our client's origin (FR-5)
    // captureTimeout: 500ms allows coalescing fast continuous drag/draw into single undo step
    const undoManager = new Y.UndoManager(elementsMap, {
      trackedOrigins: new Set([userOrigin]),
      captureTimeout: 500,
    });

    undoManagerRef.current = undoManager;

    const updateStatus = () => {
      setCanUndo(undoManager.canUndo());
      setCanRedo(undoManager.canRedo());
    };

    undoManager.on('stack-item-added', updateStatus);
    undoManager.on('stack-item-popped', updateStatus);
    undoManager.on('stack-cleared', updateStatus);

    updateStatus();

    return () => {
      undoManager.destroy();
      undoManagerRef.current = null;
    };
  }, [doc, userOrigin]);

  const undo = () => {
    if (undoManagerRef.current?.canUndo()) {
      undoManagerRef.current.undo();
    }
  };

  const redo = () => {
    if (undoManagerRef.current?.canRedo()) {
      undoManagerRef.current.redo();
    }
  };

  const stopCapturing = () => {
    undoManagerRef.current?.stopCapturing();
  };

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    stopCapturing,
  };
}
