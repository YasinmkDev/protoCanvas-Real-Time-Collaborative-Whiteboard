import { WhiteboardElement, UserPresence, BoundingBox, ResizeHandle } from '../../types';

export const RESIZE_HANDLE_SIZE = 8;

const imageCache = new Map<string, HTMLImageElement>();
let repaintCallback: (() => void) | null = null;

export function setImageRepaintCallback(cb: (() => void) | null) {
  repaintCallback = cb;
}

export function getImageFromCache(src: string): HTMLImageElement {
  let img = imageCache.get(src);
  if (!img) {
    img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (repaintCallback) repaintCallback();
    };
    img.src = src;
    imageCache.set(src, img);
  }
  return img;
}

/**
 * Computes bounding box for a single element
 */
export function getElementBounds(el: WhiteboardElement): BoundingBox {
  switch (el.type) {
    case 'pen':
    case 'highlighter': {
      if (!el.points || el.points.length < 2) {
        return { minX: el.x, minY: el.y, maxX: el.x + 10, maxY: el.y + 10, width: 10, height: 10 };
      }
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let i = 0; i < el.points.length; i += 2) {
        const px = el.points[i];
        const py = el.points[i + 1];
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
      return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
    }

    case 'line':
    case 'arrow': {
      const minX = Math.min(el.x, el.x2);
      const minY = Math.min(el.y, el.y2);
      const maxX = Math.max(el.x, el.x2);
      const maxY = Math.max(el.y, el.y2);
      return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
    }

    case 'rect':
    case 'diamond':
    case 'star':
    case 'image': {
      const minX = Math.min(el.x, el.x + el.width);
      const minY = Math.min(el.y, el.y + el.height);
      const maxX = Math.max(el.x, el.x + el.width);
      const maxY = Math.max(el.y, el.y + el.height);
      return { minX, minY, maxX, maxY, width: Math.abs(el.width), height: Math.abs(el.height) };
    }

    case 'sticky': {
      const minX = Math.min(el.x, el.x + el.width);
      const minY = Math.min(el.y, el.y + el.height);
      const maxX = Math.max(el.x, el.x + el.width);
      const maxY = Math.max(el.y, el.y + el.height);
      return { minX, minY, maxX, maxY, width: Math.abs(el.width), height: Math.abs(el.height) };
    }

    case 'circle': {
      const rx = Math.abs(el.radiusX);
      const ry = Math.abs(el.radiusY);
      return {
        minX: el.x - rx,
        minY: el.y - ry,
        maxX: el.x + rx,
        maxY: el.y + ry,
        width: rx * 2,
        height: ry * 2,
      };
    }

    case 'text': {
      const width = el.width || Math.max(40, (el.content?.length || 1) * (el.fontSize * 0.6));
      const height = el.height || el.fontSize * 1.35;
      return {
        minX: el.x,
        minY: el.y,
        maxX: el.x + width,
        maxY: el.y + height,
        width,
        height,
      };
    }
  }
}

/**
 * Computes combined bounding box for multiple elements
 */
export function getCombinedBounds(elements: WhiteboardElement[]): BoundingBox | null {
  if (elements.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach((el) => {
    const b = getElementBounds(el);
    if (b.minX < minX) minX = b.minX;
    if (b.minY < minY) minY = b.minY;
    if (b.maxX > maxX) maxX = b.maxX;
    if (b.maxY > maxY) maxY = b.maxY;
  });

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

/**
 * Point to line segment distance
 */
function distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

/**
 * Hit testing for an element with tolerance
 */
export function hitTestElement(
  el: WhiteboardElement,
  pt: { x: number; y: number },
  tolerance = 8
): boolean {
  const t = Math.max(tolerance, (el.strokeWidth || 2) / 2 + 4);

  switch (el.type) {
    case 'pen':
    case 'highlighter': {
      if (!el.points || el.points.length < 2) return false;
      const tPen = el.type === 'highlighter' ? Math.max(t, (el.strokeWidth || 16) / 2) : t;
      for (let i = 0; i < el.points.length - 2; i += 2) {
        const d = distanceToSegment(
          pt.x,
          pt.y,
          el.points[i],
          el.points[i + 1],
          el.points[i + 2],
          el.points[i + 3]
        );
        if (d <= tPen) return true;
      }
      return false;
    }

    case 'line':
    case 'arrow': {
      return distanceToSegment(pt.x, pt.y, el.x, el.y, el.x2, el.y2) <= t;
    }

    case 'rect':
    case 'diamond':
    case 'star':
    case 'sticky':
    case 'image': {
      const minX = Math.min(el.x, el.x + el.width);
      const maxX = Math.max(el.x, el.x + el.width);
      const minY = Math.min(el.y, el.y + el.height);
      const maxY = Math.max(el.y, el.y + el.height);

      // Check if inside or near border
      const isInside = pt.x >= minX && pt.x <= maxX && pt.y >= minY && pt.y <= maxY;
      if ((el.fillColor && el.fillColor !== 'transparent') || el.type === 'sticky' || el.type === 'image') {
        if (isInside) return true;
      }

      const nearLeft = Math.abs(pt.x - minX) <= t && pt.y >= minY - t && pt.y <= maxY + t;
      const nearRight = Math.abs(pt.x - maxX) <= t && pt.y >= minY - t && pt.y <= maxY + t;
      const nearTop = Math.abs(pt.y - minY) <= t && pt.x >= minX - t && pt.x <= maxX + t;
      const nearBottom = Math.abs(pt.y - maxY) <= t && pt.x >= minX - t && pt.x <= maxX + t;
      return nearLeft || nearRight || nearTop || nearBottom || isInside;
    }

    case 'circle': {
      const rx = Math.max(1, Math.abs(el.radiusX));
      const ry = Math.max(1, Math.abs(el.radiusY));
      const normalizedDist = ((pt.x - el.x) ** 2) / (rx ** 2) + ((pt.y - el.y) ** 2) / (ry ** 2);

      if (el.fillColor && el.fillColor !== 'transparent' && normalizedDist <= 1.05) {
        return true;
      }
      // Edge distance
      const borderTol = t / Math.min(rx, ry);
      return Math.abs(normalizedDist - 1) <= borderTol;
    }

    case 'text': {
      const bounds = getElementBounds(el);
      return (
        pt.x >= bounds.minX - 4 &&
        pt.x <= bounds.maxX + 4 &&
        pt.y >= bounds.minY - 4 &&
        pt.y <= bounds.maxY + 4
      );
    }
  }
}

/**
 * Hit testing for resize handles
 */
export function hitTestResizeHandle(
  bbox: BoundingBox,
  pt: { x: number; y: number },
  zoom: number
): ResizeHandle | null {
  const pad = 6 / zoom;
  const size = (RESIZE_HANDLE_SIZE + 6) / zoom;
  const minX = bbox.minX - pad;
  const maxX = bbox.maxX + pad;
  const minY = bbox.minY - pad;
  const maxY = bbox.maxY + pad;
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  const handles: { handle: ResizeHandle; x: number; y: number }[] = [
    { handle: 'nw', x: minX, y: minY },
    { handle: 'ne', x: maxX, y: minY },
    { handle: 'se', x: maxX, y: maxY },
    { handle: 'sw', x: minX, y: maxY },
    { handle: 'n', x: midX, y: minY },
    { handle: 's', x: midX, y: maxY },
    { handle: 'w', x: minX, y: midY },
    { handle: 'e', x: maxX, y: midY },
  ];

  for (const h of handles) {
    if (Math.abs(pt.x - h.x) <= size && Math.abs(pt.y - h.y) <= size) {
      return h.handle;
    }
  }
  return null;
}

/**
 * Helper to draw 5-pointed star
 */
function drawStarPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, outerR: number, innerR: number) {
  ctx.beginPath();
  let angle = -Math.PI / 2;
  const step = Math.PI / 5;
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    angle += step;
  }
  ctx.closePath();
}

/**
 * Helper to wrap text into lines fitting maxWidth
 */
function wrapTextLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const rawLines = text.split('\n');
  const result: string[] = [];

  for (const raw of rawLines) {
    const words = raw.split(' ');
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        result.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    result.push(currentLine);
  }
  return result;
}

/**
 * Draws single element onto 2D canvas
 */
export function drawElement(ctx: CanvasRenderingContext2D, el: WhiteboardElement) {
  ctx.save();

  // Opacity
  if (typeof el.opacity === 'number' && el.opacity >= 0 && el.opacity <= 1) {
    ctx.globalAlpha = el.opacity;
  }

  // Stroke Dash
  if (el.strokeStyle === 'dashed') {
    ctx.setLineDash([8, 6]);
  } else if (el.strokeStyle === 'dotted') {
    ctx.setLineDash([3, 4]);
  } else {
    ctx.setLineDash([]);
  }

  ctx.strokeStyle = el.color;
  ctx.fillStyle = el.fillColor || 'transparent';
  ctx.lineWidth = el.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (el.type) {
    case 'pen': {
      if (el.points && el.points.length >= 2) {
        ctx.beginPath();
        if (el.points.length === 2) {
          ctx.arc(el.points[0], el.points[1], el.strokeWidth / 2, 0, Math.PI * 2);
          ctx.fillStyle = el.color;
          ctx.fill();
        } else {
          ctx.moveTo(el.points[0], el.points[1]);
          for (let i = 2; i < el.points.length - 2; i += 2) {
            const xc = (el.points[i] + el.points[i + 2]) / 2;
            const yc = (el.points[i + 1] + el.points[i + 3]) / 2;
            ctx.quadraticCurveTo(el.points[i], el.points[i + 1], xc, yc);
          }
          const lastX = el.points[el.points.length - 2];
          const lastY = el.points[el.points.length - 1];
          ctx.lineTo(lastX, lastY);
          ctx.stroke();
        }
      }
      break;
    }

    case 'highlighter': {
      if (el.points && el.points.length >= 2) {
        ctx.save();
        ctx.globalAlpha = (el.opacity ?? 0.38) * 0.9;
        ctx.strokeStyle = el.color;
        ctx.lineWidth = el.strokeWidth || 18;
        ctx.lineCap = 'square';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(el.points[0], el.points[1]);
        for (let i = 2; i < el.points.length - 2; i += 2) {
          const xc = (el.points[i] + el.points[i + 2]) / 2;
          const yc = (el.points[i + 1] + el.points[i + 3]) / 2;
          ctx.quadraticCurveTo(el.points[i], el.points[i + 1], xc, yc);
        }
        const lastX = el.points[el.points.length - 2];
        const lastY = el.points[el.points.length - 1];
        ctx.lineTo(lastX, lastY);
        ctx.stroke();
        ctx.restore();
      }
      break;
    }

    case 'line': {
      ctx.beginPath();
      ctx.moveTo(el.x, el.y);
      ctx.lineTo(el.x2, el.y2);
      ctx.stroke();
      break;
    }

    case 'rect': {
      ctx.beginPath();
      const rx = el.borderRadius || 6;
      if (rx > 0 && typeof ctx.roundRect === 'function') {
        ctx.roundRect(el.x, el.y, el.width, el.height, rx);
      } else {
        ctx.rect(el.x, el.y, el.width, el.height);
      }
      if (el.fillColor && el.fillColor !== 'transparent') {
        ctx.fill();
      }
      if (el.strokeWidth > 0) {
        ctx.stroke();
      }
      break;
    }

    case 'diamond': {
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;
      ctx.beginPath();
      ctx.moveTo(cx, el.y); // top
      ctx.lineTo(el.x + el.width, cy); // right
      ctx.lineTo(cx, el.y + el.height); // bottom
      ctx.lineTo(el.x, cy); // left
      ctx.closePath();
      if (el.fillColor && el.fillColor !== 'transparent') {
        ctx.fill();
      }
      if (el.strokeWidth > 0) {
        ctx.stroke();
      }
      break;
    }

    case 'star': {
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;
      const outerR = Math.min(Math.abs(el.width), Math.abs(el.height)) / 2;
      const innerR = outerR * 0.42;
      drawStarPath(ctx, cx, cy, outerR, innerR);
      if (el.fillColor && el.fillColor !== 'transparent') {
        ctx.fill();
      }
      if (el.strokeWidth > 0) {
        ctx.stroke();
      }
      break;
    }

    case 'circle': {
      ctx.beginPath();
      ctx.ellipse(el.x, el.y, Math.abs(el.radiusX), Math.abs(el.radiusY), 0, 0, Math.PI * 2);
      if (el.fillColor && el.fillColor !== 'transparent') {
        ctx.fill();
      }
      if (el.strokeWidth > 0) {
        ctx.stroke();
      }
      break;
    }

    case 'arrow': {
      ctx.beginPath();
      ctx.moveTo(el.x, el.y);
      ctx.lineTo(el.x2, el.y2);
      ctx.stroke();

      const angle = Math.atan2(el.y2 - el.y, el.x2 - el.x);
      const headlen = Math.max(12, el.strokeWidth * 3.5);

      ctx.beginPath();
      ctx.moveTo(el.x2, el.y2);
      ctx.lineTo(
        el.x2 - headlen * Math.cos(angle - Math.PI / 6),
        el.y2 - headlen * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(el.x2, el.y2);
      ctx.lineTo(
        el.x2 - headlen * Math.cos(angle + Math.PI / 6),
        el.y2 - headlen * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
      break;
    }

    case 'sticky': {
      const w = el.width || 180;
      const h = el.height || 180;
      const bg = el.fillColor || '#fef08a';

      // Soft realistic paper drop shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = bg;

      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(el.x, el.y, w, h, 10);
      } else {
        ctx.rect(el.x, el.y, w, h);
      }
      ctx.fill();
      ctx.restore();

      // Subtle border
      ctx.strokeStyle = el.color && el.strokeWidth > 1 ? el.color : 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = Math.max(1, el.strokeWidth || 1);
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(el.x, el.y, w, h, 10);
        ctx.stroke();
      } else {
        ctx.strokeRect(el.x, el.y, w, h);
      }

      // Text inside sticky note
      const fontSize = el.fontSize || 15;
      ctx.font = `500 ${fontSize}px ${el.fontFamily || 'Inter, sans-serif'}`;
      ctx.fillStyle = el.color || '#181818';
      ctx.textBaseline = 'top';

      // Business tag badge at top of sticky note
      if (el.businessTag) {
        const tagMap: Record<string, { label: string; bg: string; text: string }> = {
          idea: { label: '💡 Idea', bg: '#fef3c7', text: '#92400e' },
          approved: { label: '✅ Approved', bg: '#d1fae5', text: '#065f46' },
          in_review: { label: '⏳ In Review', bg: '#e0e7ff', text: '#3730a3' },
          blocked: { label: '🚧 Blocked', bg: '#fee2e2', text: '#991b1b' },
          done: { label: '🎯 Goal', bg: '#f3e8ff', text: '#6b21a8' },
        };
        const tag = tagMap[el.businessTag] || { label: el.businessTag, bg: '#e5e7eb', text: '#374151' };
        ctx.save();
        ctx.font = 'bold 10px Inter, sans-serif';
        const tagW = ctx.measureText(tag.label).width + 12;
        ctx.fillStyle = tag.bg;
        if (typeof ctx.roundRect === 'function') {
          ctx.beginPath();
          ctx.roundRect(el.x + 12, el.y + 10, tagW, 18, 4);
          ctx.fill();
        } else {
          ctx.fillRect(el.x + 12, el.y + 10, tagW, 18);
        }
        ctx.fillStyle = tag.text;
        ctx.textBaseline = 'middle';
        ctx.fillText(tag.label, el.x + 18, el.y + 19);
        ctx.restore();
      }

      const padding = 16;
      const topOffset = el.businessTag ? 32 : 16;
      const maxWidth = w - padding * 2;
      const wrapped = wrapTextLines(ctx, el.content || '', maxWidth);
      const lineHeight = fontSize * 1.35;

      wrapped.slice(0, Math.floor((h - topOffset - padding) / lineHeight)).forEach((line, idx) => {
        ctx.fillText(line, el.x + padding, el.y + topOffset + idx * lineHeight);
      });

      // Author tag if present
      if (el.author) {
        ctx.font = `600 10px Inter, sans-serif`;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.textAlign = 'right';
        ctx.fillText(`— ${el.author}`, el.x + w - padding, el.y + h - 14);
        ctx.textAlign = 'left';
      }
      break;
    }

    case 'image': {
      const w = el.width || 240;
      const h = el.height || 180;
      const img = getImageFromCache(el.src);

      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();
        // Rounded clip
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(el.x, el.y, w, h, 8);
        } else {
          ctx.rect(el.x, el.y, w, h);
        }
        ctx.clip();
        ctx.drawImage(img, el.x, el.y, w, h);
        ctx.restore();

        // Border if requested
        if (el.strokeWidth > 0 && el.color && el.color !== 'transparent') {
          ctx.strokeStyle = el.color;
          ctx.lineWidth = el.strokeWidth;
          if (typeof ctx.roundRect === 'function') {
            ctx.beginPath();
            ctx.roundRect(el.x, el.y, w, h, 8);
            ctx.stroke();
          } else {
            ctx.strokeRect(el.x, el.y, w, h);
          }
        }
      } else {
        // Placeholder loading card
        ctx.save();
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        if (typeof ctx.roundRect === 'function') {
          ctx.beginPath();
          ctx.roundRect(el.x, el.y, w, h, 8);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(el.x, el.y, w, h);
          ctx.strokeRect(el.x, el.y, w, h);
        }
        ctx.fillStyle = '#64748b';
        ctx.font = '500 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🖼️ Loading image...', el.x + w / 2, el.y + h / 2);
        ctx.restore();
      }
      break;
    }

    case 'text': {
      const fontSize = el.fontSize || 20;
      ctx.font = `600 ${fontSize}px ${el.fontFamily || 'Inter, sans-serif'}`;
      ctx.fillStyle = el.color;
      ctx.textBaseline = 'top';

      const lines = (el.content || 'Text').split('\n');
      const lineHeight = fontSize * 1.35;
      lines.forEach((line, idx) => {
        ctx.fillText(line, el.x, el.y + idx * lineHeight);
      });
      break;
    }
  }

  // Draw small Lock or Protection Badge
  if (el.isLocked || el.isProtected) {
    const bounds = getElementBounds(el);
    const badgeX = bounds.maxX - 6;
    const badgeY = bounds.minY - 6;
    ctx.save();
    ctx.fillStyle = el.isLocked ? '#64748b' : '#8169ff';
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(el.isLocked ? '🔒' : '🛡️', badgeX, badgeY);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draws selection bounding box and resize handles
 */
export function drawSelectionBox(
  ctx: CanvasRenderingContext2D,
  bounds: BoundingBox,
  zoom: number,
  color = '#8169ff',
  groupLabel?: string
) {
  ctx.save();
  const padding = 6 / zoom;
  const x = bounds.minX - padding;
  const y = bounds.minY - padding;
  const w = bounds.width + padding * 2;
  const h = bounds.height + padding * 2;

  // Dashed outline
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5 / zoom;
  ctx.setLineDash([4 / zoom, 4 / zoom]);
  ctx.strokeRect(x, y, w, h);

  // Group pill tag above bounding box
  if (groupLabel) {
    ctx.save();
    ctx.setLineDash([]);
    ctx.font = `bold ${Math.max(10, 11 / zoom)}px Plus Jakarta Sans, sans-serif`;
    const labelText = groupLabel;
    const textMetrics = ctx.measureText(labelText);
    const tagW = textMetrics.width + 12 / zoom;
    const tagH = 18 / zoom;
    const tagX = x;
    const tagY = y - tagH - 4 / zoom;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(tagX, tagY, tagW, tagH, 4 / zoom);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, tagX + 6 / zoom, tagY + tagH / 2);
    ctx.restore();
  }

  // Solid resize handles
  ctx.setLineDash([]);
  const handleSize = RESIZE_HANDLE_SIZE / zoom;
  const half = handleSize / 2;

  const points = [
    { x: x, y: y }, // nw
    { x: x + w, y: y }, // ne
    { x: x + w, y: y + h }, // se
    { x: x, y: y + h }, // sw
    { x: x + w / 2, y: y }, // n
    { x: x + w / 2, y: y + h }, // s
    { x: x, y: y + h / 2 }, // w
    { x: x + w, y: y + h / 2 }, // e
  ];

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 / zoom;

  points.forEach((pt) => {
    ctx.beginPath();
    ctx.rect(pt.x - half, pt.y - half, handleSize, handleSize);
    ctx.fill();
    ctx.stroke();
  });

  ctx.restore();
}

/**
 * Draws marquee selection rectangle when dragging on empty canvas
 */
export function drawMarqueeBox(
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number; width: number; height: number },
  zoom: number,
  color = '#8169ff'
) {
  ctx.save();
  ctx.fillStyle = 'rgba(129, 105, 255, 0.08)';
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2 / zoom;
  ctx.setLineDash([4 / zoom, 3 / zoom]);
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
}

/**
 * Draws collaborator ghost selection outlines with name badge (FR-3)
 */
export function drawCollaboratorSelections(
  ctx: CanvasRenderingContext2D,
  collaborators: UserPresence[],
  elementsMap: Map<string, WhiteboardElement>,
  zoom: number
) {
  collaborators.forEach((peer) => {
    if (!peer.selection || peer.selection.length === 0) return;

    const peerEls = peer.selection
      .map((id) => elementsMap.get(id))
      .filter(Boolean) as WhiteboardElement[];

    const bounds = getCombinedBounds(peerEls);
    if (!bounds) return;

    ctx.save();
    const padding = 6 / zoom;
    const x = bounds.minX - padding;
    const y = bounds.minY - padding;
    const w = bounds.width + padding * 2;
    const h = bounds.height + padding * 2;

    // Collab border
    ctx.strokeStyle = peer.color || '#8169ff';
    ctx.lineWidth = 1.5 / zoom;
    ctx.strokeRect(x, y, w, h);

    // Collab user tag
    const tagHeight = 18 / zoom;
    const text = peer.name || 'Peer';
    ctx.font = `600 ${Math.max(10, 11 / zoom)}px Inter, sans-serif`;
    const textWidth = ctx.measureText(text).width;
    const tagWidth = textWidth + 12 / zoom;

    ctx.fillStyle = peer.color || '#8169ff';
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(x, y - tagHeight - 2 / zoom, tagWidth, tagHeight, 4 / zoom);
      ctx.fill();
    } else {
      ctx.fillRect(x, y - tagHeight - 2 / zoom, tagWidth, tagHeight);
    }

    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + 6 / zoom, y - tagHeight / 2 - 2 / zoom);

    ctx.restore();
  });
}
