export type Tool =
  | 'select'
  | 'hand'
  | 'pen'
  | 'highlighter'
  | 'line'
  | 'rect'
  | 'circle'
  | 'diamond'
  | 'star'
  | 'arrow'
  | 'text'
  | 'sticky'
  | 'image'
  | 'laser'
  | 'eraser';

export type ElementType =
  | 'pen'
  | 'highlighter'
  | 'line'
  | 'rect'
  | 'circle'
  | 'diamond'
  | 'star'
  | 'arrow'
  | 'text'
  | 'sticky'
  | 'image';

export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  color: string;
  strokeWidth: number;
  fillColor?: string;
  zOrder: number;
  createdBy: string;
  createdByName?: string;
  createdByColor?: string;
  createdAt: number;
  updatedAt: number;
  isLocked?: boolean;
  isProtected?: boolean; // When true, other users must request permission to edit
  allowedEditors?: string[]; // IDs of users granted edit permission by creator
  opacity?: number;
  strokeStyle?: StrokeStyle;
  groupId?: string; // Group identifier to group multiple shapes together
}

export interface PenElement extends BaseElement {
  type: 'pen';
  points: number[]; // flat [x1, y1, x2, y2, ...]
}

export interface HighlighterElement extends BaseElement {
  type: 'highlighter';
  points: number[];
}

export interface LineElement extends BaseElement {
  type: 'line';
  x2: number;
  y2: number;
}

export interface RectElement extends BaseElement {
  type: 'rect';
  width: number;
  height: number;
  borderRadius?: number;
}

export interface CircleElement extends BaseElement {
  type: 'circle';
  radiusX: number;
  radiusY: number;
}

export interface DiamondElement extends BaseElement {
  type: 'diamond';
  width: number;
  height: number;
}

export interface StarElement extends BaseElement {
  type: 'star';
  width: number;
  height: number;
}

export interface ArrowElement extends BaseElement {
  type: 'arrow';
  x2: number;
  y2: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily?: string;
  width?: number;
  height?: number;
}

export type BusinessTag = 'idea' | 'approved' | 'in_review' | 'blocked' | 'done';

export interface StickyElement extends BaseElement {
  type: 'sticky';
  content: string;
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: string;
  author?: string;
  businessTag?: BusinessTag;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string; // Base64 or URL
  width: number;
  height: number;
  aspectRatio: number;
  naturalWidth?: number;
  naturalHeight?: number;
  fileName?: string;
}

export type WhiteboardElement =
  | PenElement
  | HighlighterElement
  | LineElement
  | RectElement
  | CircleElement
  | DiamondElement
  | StarElement
  | ArrowElement
  | TextElement
  | StickyElement
  | ImageElement;

export interface PermissionRequest {
  id: string;
  elementId: string;
  elementType: ElementType;
  elementTitle?: string;
  ownerId: string;
  ownerName: string;
  requesterId: string;
  requesterName: string;
  requesterColor: string;
  status: 'pending' | 'granted' | 'denied';
  createdAt: number;
  respondedAt?: number;
}

export type BoardPermissionMode = 'open' | 'creator_protected';

export type GridStyle = 'dots' | 'lines' | 'isometric' | 'none';
export type CanvasBgTone = 'white' | 'warm' | 'blueprint' | 'dark';

export interface CanvasSettings {
  gridStyle: GridStyle;
  snapToGrid: boolean;
  gridSize: number;
  bgTone: CanvasBgTone;
}

export interface UserPresence {
  id: string;
  name: string;
  color: string;
  cursor: { x: number; y: number } | null;
  activeTool?: Tool;
  selection: string[]; // element IDs
  lastSeen?: number;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface BoardMetadata {
  id: string;
  created_at: string;
  updated_at: string;
  last_active_at: string;
  is_archived?: boolean;
  name?: string;
  elementCount?: number;
  previewSnippet?: string;
  elementsSummary?: {
    stickies?: number;
    shapes?: number;
    images?: number;
    drawings?: number;
    texts?: number;
  };
}

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}
