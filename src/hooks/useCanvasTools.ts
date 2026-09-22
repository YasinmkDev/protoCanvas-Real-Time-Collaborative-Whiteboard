import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import * as Y from 'yjs';
import {
  Tool,
  WhiteboardElement,
  Viewport,
  ResizeHandle,
  BoundingBox,
  CanvasSettings,
  BusinessTag,
} from '../types';
import {
  setElementInDoc,
  deleteElementFromDoc,
  deleteElementsFromDoc,
  groupElementsInDoc,
  ungroupElementsInDoc,
  updateElementProps,
  canUserEditElement,
} from '../lib/yjsSchema';
import {
  hitTestElement,
  hitTestResizeHandle,
  getCombinedBounds,
  getElementBounds,
} from '../components/Canvas/ElementRenderer';

interface UseCanvasToolsProps {
  doc: Y.Doc;
  userOrigin: string;
  elements: WhiteboardElement[];
  onCursorMove: (pos: { x: number; y: number } | null, tool?: Tool) => void;
  onSelectionChange: (selection: string[]) => void;
  undo: () => void;
  redo: () => void;
  settings?: CanvasSettings;
}

export function useCanvasTools({
  doc,
  userOrigin,
  elements,
  onCursorMove,
  onSelectionChange,
  undo,
  redo,
  settings = { gridStyle: 'dots', snapToGrid: false, gridSize: 20, bgTone: 'white' },
}: UseCanvasToolsProps) {
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [strokeColor, setStrokeColor] = useState<string>('#8169ff'); // Electric Violet default
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [fillColor, setFillColor] = useState<string>('transparent');
  const [fontSize, setFontSize] = useState<number>(20);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [draftElement, setDraftElement] = useState<WhiteboardElement | null>(null);

  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const isSpacePressedRef = useRef(false);

  // Active editing text element
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Laser pointer trail
  const [laserPoints, setLaserPoints] = useState<{ x: number; y: number; time: number }[]>([]);

  // Hovered resize handle
  const [hoveredHandle, setHoveredHandle] = useState<ResizeHandle | null>(null);

  // Marquee selection rectangle
  const [marqueeRect, setMarqueeRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Drag interaction state
  const dragInteractionRef = useRef<{
    mode: 'none' | 'drawing' | 'moving' | 'resizing' | 'panning' | 'lasering' | 'marquee';
    startX: number;
    startY: number;
    startViewport: Viewport;
    activeHandle?: ResizeHandle | null;
    initialElements?: Map<string, WhiteboardElement>;
    initialBounds?: BoundingBox | null;
  }>({
    mode: 'none',
    startX: 0,
    startY: 0,
    startViewport: { x: 0, y: 0, zoom: 1 },
  });

  const elementsMap = useRef<Map<string, WhiteboardElement>>(new Map());
  useEffect(() => {
    const map = new Map<string, WhiteboardElement>();
    elements.forEach((el) => map.set(el.id, el));
    elementsMap.current = map;
  }, [elements]);

  // Laser point fade decay loop
  useEffect(() => {
    if (laserPoints.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setLaserPoints((prev) => prev.filter((p) => now - p.time < 1200));
    }, 40);
    return () => clearInterval(interval);
  }, [laserPoints.length]);

  // Coordinate transforms
  const screenToWorld = useCallback(
    (screenX: number, screenY: number): { x: number; y: number } => {
      return {
        x: (screenX - viewport.x) / viewport.zoom,
        y: (screenY - viewport.y) / viewport.zoom,
      };
    },
    [viewport]
  );

  const worldToScreen = useCallback(
    (worldX: number, worldY: number): { x: number; y: number } => {
      return {
        x: worldX * viewport.zoom + viewport.x,
        y: worldY * viewport.zoom + viewport.y,
      };
    },
    [viewport]
  );

  // Snap helper
  const snapCoord = useCallback(
    (val: number): number => {
      if (!settings.snapToGrid) return val;
      const step = settings.gridSize || 20;
      return Math.round(val / step) * step;
    },
    [settings.snapToGrid, settings.gridSize]
  );

  // Update selection callback
  const handleSelectIds = useCallback(
    (ids: string[]) => {
      setSelectedIds(ids);
      onSelectionChange(ids);
    },
    [onSelectionChange]
  );

  // Delete selected (only unlocked and authorized elements)
  const deleteSelected = useCallback(() => {
    if (selectedIds.length > 0) {
      let boardMode: 'creator_protected' | 'open' = 'creator_protected';
      try {
        const m = doc.getText('board_permission_mode').toString();
        if (m === 'open') boardMode = 'open';
      } catch {
        // fallback
      }

      const deletableIds = selectedIds.filter((id) => {
        const el = elementsMap.current.get(id);
        return el && !el.isLocked && canUserEditElement(el, userOrigin, boardMode);
      });
      if (deletableIds.length > 0) {
        deleteElementsFromDoc(doc, deletableIds, userOrigin);
        handleSelectIds(selectedIds.filter((id) => !deletableIds.includes(id)));
      }
    }
  }, [doc, selectedIds, userOrigin, handleSelectIds]);

  // Duplicate selected (Ctrl+D)
  const duplicateSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const newSelected: string[] = [];

    // Map existing groupIds so duplicated groups become their own distinct group
    const groupMapping = new Map<string, string>();
    selectedIds.forEach((id) => {
      const el = elementsMap.current.get(id);
      if (el?.groupId && !groupMapping.has(el.groupId)) {
        groupMapping.set(
          el.groupId,
          'grp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
        );
      }
    });

    selectedIds.forEach((id) => {
      const el = elementsMap.current.get(id);
      if (el) {
        const newId = 'el_' + Math.random().toString(36).substring(2, 9);
        const dup: WhiteboardElement = {
          ...el,
          id: newId,
          x: el.x + 24,
          y: el.y + 24,
          groupId: el.groupId ? groupMapping.get(el.groupId) : undefined,
          zOrder: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        if (dup.type === 'line' || dup.type === 'arrow') {
          dup.x2 += 24;
          dup.y2 += 24;
        } else if ((dup.type === 'pen' || dup.type === 'highlighter') && dup.points) {
          dup.points = dup.points.map((p, idx) => p + (idx % 2 === 0 ? 24 : 24));
        }
        setElementInDoc(doc, dup, userOrigin);
        newSelected.push(newId);
      }
    });
    handleSelectIds(newSelected);
  }, [doc, selectedIds, userOrigin, handleSelectIds]);

  // Group selected elements
  const groupSelected = useCallback(() => {
    if (selectedIds.length < 2) return;
    groupElementsInDoc(doc, selectedIds, userOrigin);
    handleSelectIds(selectedIds);
  }, [doc, selectedIds, userOrigin, handleSelectIds]);

  // Ungroup selected elements
  const ungroupSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const targetGroupIds = new Set<string>();
    selectedIds.forEach((id) => {
      const el = elementsMap.current.get(id);
      if (el?.groupId) targetGroupIds.add(el.groupId);
    });
    if (targetGroupIds.size === 0) return;

    // Find all elements in doc that belong to any of these groups
    const elementIdsToUngroup = elements
      .filter((el) => el.groupId && targetGroupIds.has(el.groupId))
      .map((el) => el.id);

    ungroupElementsInDoc(doc, elementIdsToUngroup, userOrigin);
  }, [doc, elements, selectedIds, userOrigin]);

  // Internal Clipboard & Clipboard State
  const clipboardRef = useRef<WhiteboardElement[]>([]);
  const [hasClipboardContent, setHasClipboardContent] = useState(false);

  // Copy selected to clipboard
  const copySelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const copied = selectedIds
      .map((id) => elementsMap.current.get(id))
      .filter((el): el is WhiteboardElement => Boolean(el));
    if (copied.length > 0) {
      clipboardRef.current = copied;
      setHasClipboardContent(true);
      try {
        navigator.clipboard?.writeText(JSON.stringify(copied));
      } catch {
        // Safe ignore
      }
    }
  }, [selectedIds]);

  // Cut selected
  const cutSelected = useCallback(() => {
    copySelected();
    deleteSelected();
  }, [copySelected, deleteSelected]);

  // Paste clipboard elements
  const pasteClipboard = useCallback(
    (pasteAt?: { x: number; y: number }) => {
      if (clipboardRef.current.length === 0) return;
      const copied = clipboardRef.current;
      const newSelected: string[] = [];

      let minX = Infinity;
      let minY = Infinity;
      copied.forEach((el) => {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
      });

      const offsetX = pasteAt ? pasteAt.x - minX : 24;
      const offsetY = pasteAt ? pasteAt.y - minY : 24;

      const groupMapping = new Map<string, string>();
      copied.forEach((el) => {
        if (el.groupId && !groupMapping.has(el.groupId)) {
          groupMapping.set(
            el.groupId,
            'grp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
          );
        }
      });

      copied.forEach((el) => {
        const newId = 'el_' + Math.random().toString(36).substring(2, 9);
        const pasted: WhiteboardElement = {
          ...el,
          id: newId,
          x: pasteAt ? el.x + offsetX : el.x + 24,
          y: pasteAt ? el.y + offsetY : el.y + 24,
          groupId: el.groupId ? groupMapping.get(el.groupId) : undefined,
          zOrder: Date.now(),
          createdBy: userOrigin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        if (pasted.type === 'line' || pasted.type === 'arrow') {
          pasted.x2 += pasteAt ? offsetX : 24;
          pasted.y2 += pasteAt ? offsetY : 24;
        } else if ((pasted.type === 'pen' || pasted.type === 'highlighter') && pasted.points) {
          const dx = pasteAt ? offsetX : 24;
          const dy = pasteAt ? offsetY : 24;
          pasted.points = pasted.points.map((p, idx) => p + (idx % 2 === 0 ? dx : dy));
        }

        setElementInDoc(doc, pasted, userOrigin);
        newSelected.push(newId);
      });

      handleSelectIds(newSelected);
    },
    [doc, userOrigin, handleSelectIds]
  );

  // Select All elements
  const selectAll = useCallback(() => {
    const allIds = elements.map((e) => e.id);
    handleSelectIds(allIds);
  }, [elements, handleSelectIds]);

  // Bring to Front
  const bringToFront = useCallback(() => {
    if (selectedIds.length === 0) return;
    const maxZ = elements.reduce((acc, el) => Math.max(acc, el.zOrder || 0), 0);
    selectedIds.forEach((id, idx) => {
      updateElementProps(doc, id, { zOrder: maxZ + 1 + idx }, userOrigin);
    });
  }, [doc, elements, selectedIds, userOrigin]);

  // Send to Back
  const sendToBack = useCallback(() => {
    if (selectedIds.length === 0) return;
    const minZ = elements.reduce((acc, el) => Math.min(acc, el.zOrder || 0), 0);
    selectedIds.forEach((id, idx) => {
      updateElementProps(doc, id, { zOrder: minZ - (selectedIds.length - idx) }, userOrigin);
    });
  }, [doc, elements, selectedIds, userOrigin]);

  // Bring Forward
  const bringForward = useCallback(() => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach((id) => {
      const el = elementsMap.current.get(id);
      if (el) {
        updateElementProps(doc, id, { zOrder: (el.zOrder || 0) + 2 }, userOrigin);
      }
    });
  }, [doc, selectedIds, userOrigin]);

  // Send Backward
  const sendBackward = useCallback(() => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach((id) => {
      const el = elementsMap.current.get(id);
      if (el) {
        updateElementProps(doc, id, { zOrder: (el.zOrder || 0) - 2 }, userOrigin);
      }
    });
  }, [doc, selectedIds, userOrigin]);

  // Toggle Lock
  const toggleLockSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const anyUnlocked = selectedIds.some((id) => !elementsMap.current.get(id)?.isLocked);
    selectedIds.forEach((id) => {
      updateElementProps(doc, id, { isLocked: anyUnlocked }, userOrigin);
    });
  }, [doc, selectedIds, userOrigin]);

  // Toggle Protection
  const toggleProtectionSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const anyProtected = selectedIds.some(
      (id) => elementsMap.current.get(id)?.isProtected !== false
    );
    selectedIds.forEach((id) => {
      updateElementProps(doc, id, { isProtected: !anyProtected }, userOrigin);
    });
  }, [doc, selectedIds, userOrigin]);

  // Insert shape at specific world coordinate
  const insertShapeAt = useCallback(
    (tool: Tool, pos: { x: number; y: number }) => {
      const newId = 'el_' + Math.random().toString(36).substring(2, 9);
      let newElement: WhiteboardElement;

      if (tool === 'sticky') {
        newElement = {
          id: newId,
          type: 'sticky',
          x: Math.round(pos.x - 90),
          y: Math.round(pos.y - 80),
          width: 180,
          height: 160,
          color: strokeColor,
          fillColor: '#fef08a',
          strokeWidth: 1,
          content: 'New Note',
          fontSize: 16,
          zOrder: Date.now(),
          createdBy: userOrigin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          businessTag: 'idea',
        };
      } else if (tool === 'text') {
        newElement = {
          id: newId,
          type: 'text',
          x: Math.round(pos.x - 50),
          y: Math.round(pos.y - 15),
          width: 120,
          height: 32,
          color: strokeColor,
          strokeWidth: 1,
          content: 'Text here',
          fontSize: 20,
          zOrder: Date.now(),
          createdBy: userOrigin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      } else if (tool === 'arrow' || tool === 'line') {
        newElement = {
          id: newId,
          type: tool,
          x: Math.round(pos.x - 60),
          y: Math.round(pos.y),
          x2: Math.round(pos.x + 60),
          y2: Math.round(pos.y),
          color: strokeColor,
          strokeWidth,
          zOrder: Date.now(),
          createdBy: userOrigin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      } else if (tool === 'circle') {
        newElement = {
          id: newId,
          type: 'circle',
          x: Math.round(pos.x),
          y: Math.round(pos.y),
          radiusX: 60,
          radiusY: 60,
          color: strokeColor,
          fillColor,
          strokeWidth,
          zOrder: Date.now(),
          createdBy: userOrigin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      } else if (tool === 'diamond') {
        newElement = {
          id: newId,
          type: 'diamond',
          x: Math.round(pos.x - 70),
          y: Math.round(pos.y - 50),
          width: 140,
          height: 100,
          color: strokeColor,
          fillColor,
          strokeWidth,
          zOrder: Date.now(),
          createdBy: userOrigin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      } else if (tool === 'star') {
        newElement = {
          id: newId,
          type: 'star',
          x: Math.round(pos.x - 60),
          y: Math.round(pos.y - 50),
          width: 120,
          height: 100,
          color: strokeColor,
          fillColor,
          strokeWidth,
          zOrder: Date.now(),
          createdBy: userOrigin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      } else {
        newElement = {
          id: newId,
          type: 'rect',
          x: Math.round(pos.x - 60),
          y: Math.round(pos.y - 45),
          width: 120,
          height: 90,
          color: strokeColor,
          fillColor,
          strokeWidth,
          zOrder: Date.now(),
          createdBy: userOrigin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      }

      setElementInDoc(doc, newElement, userOrigin);
      handleSelectIds([newId]);
    },
    [doc, userOrigin, strokeColor, fillColor, strokeWidth, handleSelectIds]
  );

  // Update sticky note business status tag
  const updateStickyTag = useCallback(
    (tag: BusinessTag) => {
      selectedIds.forEach((id) => {
        const el = elementsMap.current.get(id);
        if (el?.type === 'sticky') {
          updateElementProps(doc, id, { businessTag: tag } as any, userOrigin);
        }
      });
    },
    [doc, selectedIds, userOrigin]
  );

  // Check if selection can be grouped
  const canGroup = useMemo(() => {
    if (selectedIds.length < 2) return false;
    const groupIds = new Set(
      selectedIds
        .map((id) => elementsMap.current.get(id)?.groupId)
        .filter(Boolean)
    );
    const hasUngrouped = selectedIds.some(
      (id) => !elementsMap.current.get(id)?.groupId
    );
    return hasUngrouped || groupIds.size > 1;
  }, [selectedIds]);

  // Check if selection can be ungrouped
  const canUngroup = useMemo(() => {
    return selectedIds.some((id) => Boolean(elementsMap.current.get(id)?.groupId));
  }, [selectedIds]);

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement | null;
      const activeTag = (activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeElement?.isContentEditable) {
        return;
      }

      if (e.code === 'Space' && !e.repeat) {
        isSpacePressedRef.current = true;
      } else if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      } else if (e.key === 'h' || e.key === 'H') {
        setActiveTool('hand');
      } else if (e.key === 'k' || e.key === 'K') {
        setActiveTool('laser');
      } else if (e.key === 'p' || e.key === 'P') {
        setActiveTool('pen');
      } else if (e.key === 'm' || e.key === 'M') {
        setActiveTool('highlighter');
      } else if (e.key === 'l' || e.key === 'L') {
        setActiveTool('line');
      } else if (e.key === 'r' || e.key === 'R') {
        setActiveTool('rect');
      } else if (e.key === 'o' || e.key === 'O') {
        setActiveTool('circle');
      } else if (e.key === 'd' || e.key === 'D') {
        if (!e.ctrlKey && !e.metaKey) setActiveTool('diamond');
      } else if (e.key === 's' || e.key === 'S') {
        if (!e.ctrlKey && !e.metaKey) setActiveTool('star');
      } else if (e.key === 'a' || e.key === 'A') {
        setActiveTool('arrow');
      } else if (e.key === 't' || e.key === 'T') {
        setActiveTool('text');
      } else if (e.key === 'n' || e.key === 'N') {
        setActiveTool('sticky');
      } else if (e.key === 'e' || e.key === 'E') {
        setActiveTool('eraser');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        copySelected();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'x' || e.key === 'X')) {
        cutSelected();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        pasteClipboard();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        selectAll();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        toggleLockSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key === ']') {
        e.preventDefault();
        bringToFront();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '[') {
        e.preventDefault();
        sendToBack();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        if (e.shiftKey) {
          ungroupSelected();
        } else {
          groupSelected();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        duplicateSelected();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [deleteSelected, duplicateSelected, groupSelected, ungroupSelected, undo, redo]);

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Ignore right click for drawing/selection interactions (reserved for context menu)
    if (e.button === 2) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const world = screenToWorld(screenX, screenY);

    // Hand tool or Space / middle click pan
    if (activeTool === 'hand' || isSpacePressedRef.current || e.button === 1) {
      dragInteractionRef.current = {
        mode: 'panning',
        startX: e.clientX,
        startY: e.clientY,
        startViewport: { ...viewport },
      };
      setIsPanning(true);
      return;
    }

    // Laser pointer
    if (activeTool === 'laser') {
      dragInteractionRef.current = {
        mode: 'lasering',
        startX: world.x,
        startY: world.y,
        startViewport: viewport,
      };
      setLaserPoints((prev) => [...prev, { x: world.x, y: world.y, time: Date.now() }]);
      return;
    }

    const boardMode: 'creator_protected' | 'open' = (() => {
      try {
        return doc.getText('board_permission_mode').toString() === 'open' ? 'open' : 'creator_protected';
      } catch {
        return 'creator_protected';
      }
    })();

    // Eraser Tool
    if (activeTool === 'eraser') {
      const hit = [...elements].reverse().find(
        (el) => !el.isLocked && canUserEditElement(el, userOrigin, boardMode) && hitTestElement(el, world)
      );
      if (hit) {
        deleteElementFromDoc(doc, hit.id, userOrigin);
        if (selectedIds.includes(hit.id)) {
          handleSelectIds(selectedIds.filter((id) => id !== hit.id));
        }
      }
      dragInteractionRef.current = { mode: 'drawing', startX: world.x, startY: world.y, startViewport: viewport };
      return;
    }

    // Select Tool
    if (activeTool === 'select') {
      const selectedEls = selectedIds.map((id) => elementsMap.current.get(id)).filter(Boolean) as WhiteboardElement[];
      const combinedBounds = getCombinedBounds(selectedEls);

      // Check resize handle
      if (combinedBounds && selectedIds.length > 0) {
        const handle = hitTestResizeHandle(combinedBounds, world, viewport.zoom);
        if (handle) {
          // Check if any selected is locked or user lacks edit permission
          const canEditAll = selectedEls.every(
            (el) => !el.isLocked && canUserEditElement(el, userOrigin, boardMode)
          );
          if (canEditAll) {
            const initMap = new Map<string, WhiteboardElement>();
            selectedEls.forEach((el) => initMap.set(el.id, JSON.parse(JSON.stringify(el))));

            dragInteractionRef.current = {
              mode: 'resizing',
              startX: world.x,
              startY: world.y,
              startViewport: viewport,
              activeHandle: handle,
              initialElements: initMap,
              initialBounds: combinedBounds,
            };
            return;
          }
        }
      }

      // Hit test existing elements
      const hit = [...elements].reverse().find((el) => hitTestElement(el, world));

      if (hit) {
        // If element belongs to a group, resolve all member IDs of this group
        const groupMemberIds = hit.groupId
          ? elements.filter((el) => el.groupId === hit.groupId).map((el) => el.id)
          : [hit.id];

        let newSelection = selectedIds;
        if (e.shiftKey) {
          const isAnyMemberSelected = groupMemberIds.some((id) => selectedIds.includes(id));
          newSelection = isAnyMemberSelected
            ? selectedIds.filter((id) => !groupMemberIds.includes(id))
            : Array.from(new Set([...selectedIds, ...groupMemberIds]));
        } else {
          // If not holding shift, and current selection doesn't already contain this group
          const containsAll = groupMemberIds.every((id) => selectedIds.includes(id));
          if (!containsAll) {
            newSelection = groupMemberIds;
          }
        }
        handleSelectIds(newSelection);

        // Prepare moving if not locked and user has permission
        const currentSelected = newSelection
          .map((id) => elementsMap.current.get(id))
          .filter(Boolean) as WhiteboardElement[];

        const movableEls = currentSelected.filter(
          (el) => !el.isLocked && canUserEditElement(el, userOrigin, boardMode)
        );
        if (movableEls.length > 0) {
          const initMap = new Map<string, WhiteboardElement>();
          movableEls.forEach((el) => initMap.set(el.id, JSON.parse(JSON.stringify(el))));

          dragInteractionRef.current = {
            mode: 'moving',
            startX: world.x,
            startY: world.y,
            startViewport: viewport,
            initialElements: initMap,
            initialBounds: getCombinedBounds(movableEls),
          };
        }
        return;
      } else {
        // Click on empty canvas: start Marquee selection
        if (!e.shiftKey) {
          handleSelectIds([]);
        }
        dragInteractionRef.current = {
          mode: 'marquee',
          startX: world.x,
          startY: world.y,
          startViewport: viewport,
        };
        setMarqueeRect({ x: world.x, y: world.y, width: 0, height: 0 });
        return;
      }
    }

    // Sticky Note Creation
    if (activeTool === 'sticky') {
      const newId = 'el_' + Math.random().toString(36).substring(2, 9);
      const stickyW = 180;
      const stickyH = 150;
      const newElement: WhiteboardElement = {
        id: newId,
        type: 'sticky',
        x: snapCoord(world.x - stickyW / 2),
        y: snapCoord(world.y - stickyH / 2),
        width: stickyW,
        height: stickyH,
        content: 'New sticky note',
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        color: '#181818',
        fillColor: fillColor === 'transparent' ? '#fef08a' : fillColor,
        strokeWidth: 1,
        zOrder: Date.now(),
        createdBy: userOrigin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setElementInDoc(doc, newElement, userOrigin);
      handleSelectIds([newId]);
      setEditingTextId(newId);
      setActiveTool('select');
      return;
    }

    // Text Creation
    if (activeTool === 'text') {
      const newId = 'el_' + Math.random().toString(36).substring(2, 9);
      const newElement: WhiteboardElement = {
        id: newId,
        type: 'text',
        x: snapCoord(world.x),
        y: snapCoord(world.y),
        content: 'Type text here...',
        fontSize,
        fontFamily: 'Inter, sans-serif',
        color: strokeColor,
        strokeWidth: 1,
        zOrder: Date.now(),
        createdBy: userOrigin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setElementInDoc(doc, newElement, userOrigin);
      handleSelectIds([newId]);
      setEditingTextId(newId);
      setActiveTool('select');
      return;
    }

    // Shape / Drawing Tools
    const newId = 'el_' + Math.random().toString(36).substring(2, 9);
    let newElement: WhiteboardElement | null = null;
    const startX = snapCoord(world.x);
    const startY = snapCoord(world.y);

    if (activeTool === 'pen') {
      newElement = {
        id: newId,
        type: 'pen',
        x: world.x,
        y: world.y,
        color: strokeColor,
        strokeWidth,
        points: [world.x, world.y],
        zOrder: Date.now(),
        createdBy: userOrigin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    } else if (activeTool === 'highlighter') {
      newElement = {
        id: newId,
        type: 'highlighter',
        x: world.x,
        y: world.y,
        color: strokeColor === '#181818' ? '#fef08a' : strokeColor,
        strokeWidth: 20,
        opacity: 0.38,
        points: [world.x, world.y],
        zOrder: Date.now(),
        createdBy: userOrigin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    } else if (activeTool === 'line') {
      newElement = {
        id: newId,
        type: 'line',
        x: startX,
        y: startY,
        x2: startX,
        y2: startY,
        color: strokeColor,
        strokeWidth,
        zOrder: Date.now(),
        createdBy: userOrigin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    } else if (activeTool === 'arrow') {
      newElement = {
        id: newId,
        type: 'arrow',
        x: startX,
        y: startY,
        x2: startX,
        y2: startY,
        color: strokeColor,
        strokeWidth,
        zOrder: Date.now(),
        createdBy: userOrigin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    } else if (activeTool === 'rect') {
      newElement = {
        id: newId,
        type: 'rect',
        x: startX,
        y: startY,
        width: 0,
        height: 0,
        borderRadius: 8,
        color: strokeColor,
        strokeWidth,
        fillColor,
        zOrder: Date.now(),
        createdBy: userOrigin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    } else if (activeTool === 'diamond') {
      newElement = {
        id: newId,
        type: 'diamond',
        x: startX,
        y: startY,
        width: 0,
        height: 0,
        color: strokeColor,
        strokeWidth,
        fillColor,
        zOrder: Date.now(),
        createdBy: userOrigin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    } else if (activeTool === 'star') {
      newElement = {
        id: newId,
        type: 'star',
        x: startX,
        y: startY,
        width: 0,
        height: 0,
        color: strokeColor,
        strokeWidth,
        fillColor,
        zOrder: Date.now(),
        createdBy: userOrigin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    } else if (activeTool === 'circle') {
      newElement = {
        id: newId,
        type: 'circle',
        x: startX,
        y: startY,
        radiusX: 0,
        radiusY: 0,
        color: strokeColor,
        strokeWidth,
        fillColor,
        zOrder: Date.now(),
        createdBy: userOrigin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    if (newElement) {
      setDraftElement(newElement);
      dragInteractionRef.current = {
        mode: 'drawing',
        startX,
        startY,
        startViewport: viewport,
      };
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const world = screenToWorld(screenX, screenY);

    // Broadcast live cursor
    onCursorMove(world, activeTool);

    // Hover detection for select/eraser and resize handles
    if (dragInteractionRef.current.mode === 'none') {
      const hit = [...elements].reverse().find((el) => hitTestElement(el, world));
      setHoveredId(hit ? hit.id : null);

      if (activeTool === 'select' && selectedIds.length > 0) {
        const selectedEls = selectedIds
          .map((id) => elementsMap.current.get(id))
          .filter(Boolean) as WhiteboardElement[];
        const combinedBounds = getCombinedBounds(selectedEls);
        if (combinedBounds) {
          const handle = hitTestResizeHandle(combinedBounds, world, viewport.zoom);
          setHoveredHandle(handle);
        } else {
          setHoveredHandle(null);
        }
      } else {
        setHoveredHandle(null);
      }
    }

    // Laser move
    if (activeTool === 'laser' && dragInteractionRef.current.mode === 'lasering') {
      setLaserPoints((prev) => [...prev, { x: world.x, y: world.y, time: Date.now() }]);
      return;
    }

    // Marquee Selection dragging
    if (dragInteractionRef.current.mode === 'marquee') {
      const x = Math.min(dragInteractionRef.current.startX, world.x);
      const y = Math.min(dragInteractionRef.current.startY, world.y);
      const width = Math.abs(world.x - dragInteractionRef.current.startX);
      const height = Math.abs(world.y - dragInteractionRef.current.startY);
      setMarqueeRect({ x, y, width, height });
      return;
    }

    // Panning
    if (dragInteractionRef.current.mode === 'panning') {
      const dx = e.clientX - dragInteractionRef.current.startX;
      const dy = e.clientY - dragInteractionRef.current.startY;
      setViewport({
        ...dragInteractionRef.current.startViewport,
        x: dragInteractionRef.current.startViewport.x + dx,
        y: dragInteractionRef.current.startViewport.y + dy,
      });
      return;
    }

    // Eraser dragging
    if (activeTool === 'eraser' && dragInteractionRef.current.mode === 'drawing') {
      const hit = [...elements].reverse().find((el) => !el.isLocked && hitTestElement(el, world));
      if (hit) {
        deleteElementFromDoc(doc, hit.id, userOrigin);
        if (selectedIds.includes(hit.id)) {
          handleSelectIds(selectedIds.filter((id) => id !== hit.id));
        }
      }
      return;
    }

    // Moving elements
    if (dragInteractionRef.current.mode === 'moving' && dragInteractionRef.current.initialElements) {
      let dx = world.x - dragInteractionRef.current.startX;
      let dy = world.y - dragInteractionRef.current.startY;

      if (settings.snapToGrid) {
        dx = snapCoord(dx);
        dy = snapCoord(dy);
      }

      dragInteractionRef.current.initialElements.forEach((orig, id) => {
        if ((orig.type === 'pen' || orig.type === 'highlighter') && orig.points) {
          const newPoints = orig.points.map((p, idx) => p + (idx % 2 === 0 ? dx : dy));
          updateElementProps(doc, id, { points: newPoints, x: orig.x + dx, y: orig.y + dy }, userOrigin);
        } else if (orig.type === 'line' || orig.type === 'arrow') {
          updateElementProps(
            doc,
            id,
            { x: orig.x + dx, y: orig.y + dy, x2: orig.x2 + dx, y2: orig.y2 + dy },
            userOrigin
          );
        } else {
          updateElementProps(doc, id, { x: orig.x + dx, y: orig.y + dy }, userOrigin);
        }
      });
      return;
    }

    // Resizing elements
    if (
      dragInteractionRef.current.mode === 'resizing' &&
      dragInteractionRef.current.initialElements &&
      dragInteractionRef.current.initialBounds &&
      dragInteractionRef.current.activeHandle
    ) {
      const handle = dragInteractionRef.current.activeHandle;
      const bounds = dragInteractionRef.current.initialBounds;
      const dx = world.x - dragInteractionRef.current.startX;
      const dy = world.y - dragInteractionRef.current.startY;

      let newMinX = bounds.minX;
      let newMaxX = bounds.maxX;
      let newMinY = bounds.minY;
      let newMaxY = bounds.maxY;

      if (handle.includes('w')) newMinX += dx;
      if (handle.includes('e')) newMaxX += dx;
      if (handle.includes('n')) newMinY += dy;
      if (handle.includes('s')) newMaxY += dy;

      const newWidth = Math.max(12, newMaxX - newMinX);
      const newHeight = Math.max(12, newMaxY - newMinY);
      let scaleX = newWidth / bounds.width;
      let scaleY = newHeight / bounds.height;

      // Lock proportional aspect ratio if Shift is held on corner handles
      if (e.shiftKey && ['nw', 'ne', 'se', 'sw'].includes(handle) && bounds.width > 0 && bounds.height > 0) {
        const uniformScale = (scaleX + scaleY) / 2;
        scaleX = uniformScale;
        scaleY = uniformScale;
      }

      dragInteractionRef.current.initialElements.forEach((orig, id) => {
        if (
          orig.type === 'rect' ||
          orig.type === 'diamond' ||
          orig.type === 'star' ||
          orig.type === 'sticky' ||
          orig.type === 'image'
        ) {
          const relX = (orig.x - bounds.minX) * scaleX;
          const relY = (orig.y - bounds.minY) * scaleY;
          const newW = Math.max(16, Math.round(orig.width * scaleX));
          const newH = Math.max(16, Math.round(orig.height * scaleY));
          updateElementProps(
            doc,
            id,
            {
              x: Math.round(newMinX + relX),
              y: Math.round(newMinY + relY),
              width: newW,
              height: newH,
              ...(orig.type === 'image' ? { aspectRatio: newW / newH } : {}),
            },
            userOrigin
          );
        } else if (orig.type === 'text') {
          const relX = (orig.x - bounds.minX) * scaleX;
          const relY = (orig.y - bounds.minY) * scaleY;
          const newFontSize = Math.max(10, Math.round((orig.fontSize || 16) * Math.min(scaleX, scaleY)));
          updateElementProps(
            doc,
            id,
            {
              x: Math.round(newMinX + relX),
              y: Math.round(newMinY + relY),
              fontSize: newFontSize,
              width: orig.width ? Math.round(orig.width * scaleX) : undefined,
              height: orig.height ? Math.round(orig.height * scaleY) : undefined,
            },
            userOrigin
          );
        } else if (orig.type === 'circle') {
          const relX = (orig.x - bounds.minX) * scaleX;
          const relY = (orig.y - bounds.minY) * scaleY;
          updateElementProps(
            doc,
            id,
            {
              x: newMinX + relX,
              y: newMinY + relY,
              radiusX: orig.radiusX * scaleX,
              radiusY: orig.radiusY * scaleY,
            },
            userOrigin
          );
        } else if (orig.type === 'line' || orig.type === 'arrow') {
          const relX1 = (orig.x - bounds.minX) * scaleX;
          const relY1 = (orig.y - bounds.minY) * scaleY;
          const relX2 = (orig.x2 - bounds.minX) * scaleX;
          const relY2 = (orig.y2 - bounds.minY) * scaleY;
          updateElementProps(
            doc,
            id,
            {
              x: newMinX + relX1,
              y: newMinY + relY1,
              x2: newMinX + relX2,
              y2: newMinY + relY2,
            },
            userOrigin
          );
        } else if ((orig.type === 'pen' || orig.type === 'highlighter') && orig.points) {
          const newPoints: number[] = [];
          for (let i = 0; i < orig.points.length; i += 2) {
            const px = newMinX + (orig.points[i] - bounds.minX) * scaleX;
            const py = newMinY + (orig.points[i + 1] - bounds.minY) * scaleY;
            newPoints.push(px, py);
          }
          updateElementProps(doc, id, { points: newPoints, x: newPoints[0], y: newPoints[1] }, userOrigin);
        }
      });
      return;
    }

    // Drawing new draft element
    if (draftElement && dragInteractionRef.current.mode === 'drawing') {
      if (draftElement.type === 'pen' || draftElement.type === 'highlighter') {
        setDraftElement({
          ...draftElement,
          points: [...(draftElement.points || []), world.x, world.y],
        });
      } else if (draftElement.type === 'line' || draftElement.type === 'arrow') {
        setDraftElement({
          ...draftElement,
          x2: snapCoord(world.x),
          y2: snapCoord(world.y),
        });
      } else if (
        draftElement.type === 'rect' ||
        draftElement.type === 'diamond' ||
        draftElement.type === 'star'
      ) {
        const startX = dragInteractionRef.current.startX;
        const startY = dragInteractionRef.current.startY;
        const currentX = snapCoord(world.x);
        const currentY = snapCoord(world.y);
        const x = Math.min(startX, currentX);
        const y = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        setDraftElement({
          ...draftElement,
          x,
          y,
          width,
          height,
        });
      } else if (draftElement.type === 'circle') {
        const startX = dragInteractionRef.current.startX;
        const startY = dragInteractionRef.current.startY;
        const currentX = snapCoord(world.x);
        const currentY = snapCoord(world.y);
        const radiusX = Math.abs(currentX - startX);
        const radiusY = Math.abs(currentY - startY);
        setDraftElement({
          ...draftElement,
          x: startX,
          y: startY,
          radiusX,
          radiusY,
        });
      }
    }
  };

  // Pointer Up
  const handlePointerUp = () => {
    // Commit Marquee selection
    if (dragInteractionRef.current.mode === 'marquee' && marqueeRect) {
      if (marqueeRect.width > 3 || marqueeRect.height > 3) {
        const marqueeBox = {
          minX: marqueeRect.x,
          minY: marqueeRect.y,
          maxX: marqueeRect.x + marqueeRect.width,
          maxY: marqueeRect.y + marqueeRect.height,
        };

        const intersected = elements.filter((el) => {
          const bounds = getElementBounds(el);
          return !(
            bounds.maxX < marqueeBox.minX ||
            bounds.minX > marqueeBox.maxX ||
            bounds.maxY < marqueeBox.minY ||
            bounds.minY > marqueeBox.maxY
          );
        });

        // Expand to include all members of any groups intersected
        const groupIds = new Set<string>();
        intersected.forEach((el) => {
          if (el.groupId) groupIds.add(el.groupId);
        });

        const finalSelectedIds = elements
          .filter(
            (el) =>
              intersected.some((i) => i.id === el.id) ||
              (el.groupId && groupIds.has(el.groupId))
          )
          .map((el) => el.id);

        handleSelectIds(finalSelectedIds);
      }
      setMarqueeRect(null);
    }

    if (draftElement) {
      let shouldCommit = true;

      if (
        (draftElement.type === 'rect' ||
          draftElement.type === 'diamond' ||
          draftElement.type === 'star') &&
        (draftElement.width < 5 || draftElement.height < 5)
      ) {
        shouldCommit = false;
      } else if (
        draftElement.type === 'circle' &&
        (draftElement.radiusX < 4 || draftElement.radiusY < 4)
      ) {
        shouldCommit = false;
      } else if (
        (draftElement.type === 'line' || draftElement.type === 'arrow') &&
        Math.hypot(draftElement.x2 - draftElement.x, draftElement.y2 - draftElement.y) < 4
      ) {
        shouldCommit = false;
      } else if (
        (draftElement.type === 'pen' || draftElement.type === 'highlighter') &&
        (!draftElement.points || draftElement.points.length < 4)
      ) {
        shouldCommit = false;
      }

      if (shouldCommit) {
        setElementInDoc(doc, draftElement, userOrigin);
        handleSelectIds([draftElement.id]);
      }
      setDraftElement(null);
    }

    dragInteractionRef.current = {
      mode: 'none',
      startX: 0,
      startY: 0,
      startViewport: viewport,
    };
    setIsPanning(false);
  };

  // Pointer Leave
  const handlePointerLeave = () => {
    onCursorMove(null);
    setHoveredHandle(null);
    setHoveredId(null);
    if (dragInteractionRef.current.mode === 'drawing' && draftElement) {
      handlePointerUp();
    }
  };

  // Double click on element to edit text/sticky
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const world = screenToWorld(screenX, screenY);

    const hit = [...elements].reverse().find((el) => hitTestElement(el, world));
    if (hit && (hit.type === 'text' || hit.type === 'sticky')) {
      setEditingTextId(hit.id);
      handleSelectIds([hit.id]);
    }
  };

  // Wheel Zoom / Pan
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const newZoom = Math.min(4, Math.max(0.2, viewport.zoom * zoomFactor));

      const worldX = (mouseX - viewport.x) / viewport.zoom;
      const worldY = (mouseY - viewport.y) / viewport.zoom;

      setViewport({
        zoom: newZoom,
        x: mouseX - worldX * newZoom,
        y: mouseY - worldY * newZoom,
      });
    } else {
      setViewport((prev) => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  // Zoom helpers
  const zoomIn = () => {
    setViewport((prev) => ({
      ...prev,
      zoom: Math.min(4, prev.zoom * 1.2),
    }));
  };

  const zoomOut = () => {
    setViewport((prev) => ({
      ...prev,
      zoom: Math.max(0.2, prev.zoom / 1.2),
    }));
  };

  const resetZoom = () => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  };

  // Helper to insert imported image onto canvas
  const insertImageElement = useCallback(
    (imgData: {
      src: string;
      width: number;
      height: number;
      fileName?: string;
      x?: number;
      y?: number;
    }) => {
      const centerX =
        imgData.x !== undefined
          ? imgData.x
          : (-viewport.x + window.innerWidth / 2) / viewport.zoom;
      const centerY =
        imgData.y !== undefined
          ? imgData.y
          : (-viewport.y + window.innerHeight / 2) / viewport.zoom;
      const w = imgData.width || 320;
      const h = imgData.height || 240;

      const newId = 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const newElement: WhiteboardElement = {
        id: newId,
        type: 'image',
        x: Math.round(centerX - w / 2),
        y: Math.round(centerY - h / 2),
        width: w,
        height: h,
        aspectRatio: w / h,
        naturalWidth: w,
        naturalHeight: h,
        src: imgData.src,
        fileName: imgData.fileName || 'image.png',
        color: 'transparent',
        strokeWidth: 0,
        zOrder: Date.now(),
        createdBy: userOrigin,
        createdByName: 'User',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isProtected: false,
      };

      setElementInDoc(doc, newElement, userOrigin);
      handleSelectIds([newId]);
    },
    [doc, userOrigin, viewport, handleSelectIds]
  );

  // Global Clipboard Image Paste (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const activeElement = document.activeElement as HTMLElement | null;
      const activeTag = (activeElement?.tagName || '').toLowerCase();
      if (
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeElement?.isContentEditable
      ) {
        return;
      }

      if (!e.clipboardData || !e.clipboardData.items) return;

      for (let i = 0; i < e.clipboardData.items.length; i++) {
        const item = e.clipboardData.items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
              const dataUrl = evt.target?.result as string;
              const img = new Image();
              img.onload = () => {
                const maxDim = 450;
                let w = img.naturalWidth || 300;
                let h = img.naturalHeight || 200;
                if (w > maxDim || h > maxDim) {
                  const r = w / h;
                  if (w > h) {
                    w = maxDim;
                    h = Math.round(maxDim / r);
                  } else {
                    h = maxDim;
                    w = Math.round(maxDim * r);
                  }
                }
                insertImageElement({
                  src: dataUrl,
                  width: w,
                  height: h,
                  fileName: 'Pasted Image',
                });
              };
              img.src = dataUrl;
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [insertImageElement]);

  // Compute if all selected elements can be edited by current user
  const canEditSelected = (() => {
    if (selectedIds.length === 0) return true;
    const boardMode: 'creator_protected' | 'open' = (() => {
      try {
        return doc.getText('board_permission_mode').toString() === 'open'
          ? 'open'
          : 'creator_protected';
      } catch {
        return 'creator_protected';
      }
    })();
    return selectedIds.every((id) => {
      const el = elementsMap.current.get(id);
      return !el || canUserEditElement(el, userOrigin, boardMode);
    });
  })();

  return {
    activeTool,
    setActiveTool,
    strokeColor,
    setStrokeColor,
    strokeWidth,
    setStrokeWidth,
    fillColor,
    setFillColor,
    fontSize,
    setFontSize,
    selectedIds,
    handleSelectIds,
    hoveredId,
    hoveredHandle,
    draftElement,
    viewport,
    setViewport,
    isPanning,
    screenToWorld,
    worldToScreen,
    editingTextId,
    setEditingTextId,
    laserPoints,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    handleDoubleClick,
    handleWheel,
    zoomIn,
    zoomOut,
    resetZoom,
    deleteSelected,
    duplicateSelected,
    groupSelected,
    ungroupSelected,
    canGroup,
    canUngroup,
    marqueeRect,
    insertImageElement,
    canEditSelected,
    // Context Menu & Business operations
    copySelected,
    cutSelected,
    pasteClipboard,
    selectAll,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    toggleLockSelected,
    toggleProtectionSelected,
    insertShapeAt,
    updateStickyTag,
    hasClipboardContent,
  };
}
