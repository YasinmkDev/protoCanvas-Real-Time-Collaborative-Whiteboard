import { WhiteboardElement, BoundingBox } from '../types';

/**
 * Calculates the bounding box of a list of elements
 */
export function getElementsBoundingBox(elements: WhiteboardElement[]): BoundingBox {
  if (elements.length === 0) {
    return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach((el) => {
    switch (el.type) {
      case 'pen':
        if (el.points && el.points.length > 0) {
          for (let i = 0; i < el.points.length; i += 2) {
            const px = el.points[i];
            const py = el.points[i + 1];
            if (px < minX) minX = px;
            if (px > maxX) maxX = px;
            if (py < minY) minY = py;
            if (py > maxY) maxY = py;
          }
        } else {
          minX = Math.min(minX, el.x);
          minY = Math.min(minY, el.y);
          maxX = Math.max(maxX, el.x + 10);
          maxY = Math.max(maxY, el.y + 10);
        }
        break;

      case 'line':
      case 'arrow':
        minX = Math.min(minX, el.x, el.x2);
        minY = Math.min(minY, el.y, el.y2);
        maxX = Math.max(maxX, el.x, el.x2);
        maxY = Math.max(maxY, el.y, el.y2);
        break;

      case 'rect':
        minX = Math.min(minX, el.x, el.x + el.width);
        minY = Math.min(minY, el.y, el.y + el.height);
        maxX = Math.max(maxX, el.x, el.x + el.width);
        maxY = Math.max(maxY, el.y, el.y + el.height);
        break;

      case 'circle':
        minX = Math.min(minX, el.x - el.radiusX);
        minY = Math.min(minY, el.y - el.radiusY);
        maxX = Math.max(maxX, el.x + el.radiusX);
        maxY = Math.max(maxY, el.y + el.radiusY);
        break;

      case 'text':
        const textWidth = el.width || (el.content ? el.content.length * (el.fontSize * 0.6) : 60);
        const textHeight = el.height || el.fontSize * 1.3;
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + textWidth);
        maxY = Math.max(maxY, el.y + textHeight);
        break;
    }
  });

  const padding = 40;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(200, maxX - minX),
    height: Math.max(200, maxY - minY),
  };
}

/**
 * Exports elements to high-resolution PNG data URL
 */
export function exportToPNG(
  elements: WhiteboardElement[],
  options: {
    scale?: number;
    transparent?: boolean;
    backgroundColor?: string;
  } = {}
): string {
  const scale = options.scale ?? 2;
  const transparent = options.transparent ?? false;
  const bg = options.backgroundColor ?? '#ffffff';

  const bbox = getElementsBoundingBox(elements);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bbox.width * scale);
  canvas.height = Math.round(bbox.height * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.scale(scale, scale);
  ctx.translate(-bbox.minX, -bbox.minY);

  if (!transparent) {
    ctx.fillStyle = bg;
    ctx.fillRect(bbox.minX, bbox.minY, bbox.width, bbox.height);
  }

  // Draw elements
  elements.forEach((el) => {
    ctx.save();
    ctx.strokeStyle = el.color;
    ctx.fillStyle = el.fillColor || 'transparent';
    ctx.lineWidth = el.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (el.type) {
      case 'pen':
        if (el.points && el.points.length >= 4) {
          ctx.beginPath();
          ctx.moveTo(el.points[0], el.points[1]);
          for (let i = 2; i < el.points.length; i += 2) {
            ctx.lineTo(el.points[i], el.points[i + 1]);
          }
          ctx.stroke();
        }
        break;

      case 'line':
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(el.x2, el.y2);
        ctx.stroke();
        break;

      case 'rect':
        ctx.beginPath();
        const r = el.borderRadius || 0;
        if (r > 0 && ctx.roundRect) {
          ctx.roundRect(el.x, el.y, el.width, el.height, r);
        } else {
          ctx.rect(el.x, el.y, el.width, el.height);
        }
        if (el.fillColor && el.fillColor !== 'transparent') {
          ctx.fill();
        }
        ctx.stroke();
        break;

      case 'circle':
        ctx.beginPath();
        ctx.ellipse(el.x, el.y, Math.abs(el.radiusX), Math.abs(el.radiusY), 0, 0, Math.PI * 2);
        if (el.fillColor && el.fillColor !== 'transparent') {
          ctx.fill();
        }
        ctx.stroke();
        break;

      case 'arrow':
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(el.x2, el.y2);
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(el.y2 - el.y, el.x2 - el.x);
        const headlen = Math.max(10, el.strokeWidth * 3.5);
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

      case 'text':
        ctx.font = `${el.fontSize || 20}px ${el.fontFamily || 'Inter, sans-serif'}`;
        ctx.fillStyle = el.color;
        ctx.textBaseline = 'top';
        const lines = (el.content || '').split('\n');
        const lineHeight = (el.fontSize || 20) * 1.3;
        lines.forEach((line, idx) => {
          ctx.fillText(line, el.x, el.y + idx * lineHeight);
        });
        break;
    }

    ctx.restore();
  });

  return canvas.toDataURL('image/png');
}

/**
 * Exports elements to scalable SVG string
 */
export function exportToSVG(
  elements: WhiteboardElement[],
  options: { transparent?: boolean; backgroundColor?: string } = {}
): string {
  const transparent = options.transparent ?? false;
  const bg = options.backgroundColor ?? '#ffffff';
  const bbox = getElementsBoundingBox(elements);

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bbox.minX} ${bbox.minY} ${bbox.width} ${bbox.height}" width="${bbox.width}" height="${bbox.height}">\n`;

  if (!transparent) {
    svgContent += `  <rect x="${bbox.minX}" y="${bbox.minY}" width="${bbox.width}" height="${bbox.height}" fill="${bg}" />\n`;
  }

  elements.forEach((el) => {
    const stroke = el.color;
    const strokeWidth = el.strokeWidth;
    const fill = el.fillColor && el.fillColor !== 'transparent' ? el.fillColor : 'none';

    switch (el.type) {
      case 'pen':
        if (el.points && el.points.length >= 4) {
          let d = `M ${el.points[0]} ${el.points[1]}`;
          for (let i = 2; i < el.points.length; i += 2) {
            d += ` L ${el.points[i]} ${el.points[i + 1]}`;
          }
          svgContent += `  <path d="${d}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none" />\n`;
        }
        break;

      case 'line':
        svgContent += `  <line x1="${el.x}" y1="${el.y}" x2="${el.x2}" y2="${el.y2}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" />\n`;
        break;

      case 'rect':
        const rx = el.borderRadius || 0;
        const ry = el.borderRadius || 0;
        svgContent += `  <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="${rx}" ry="${ry}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="${fill}" />\n`;
        break;

      case 'circle':
        svgContent += `  <ellipse cx="${el.x}" cy="${el.y}" rx="${Math.abs(el.radiusX)}" ry="${Math.abs(el.radiusY)}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="${fill}" />\n`;
        break;

      case 'arrow':
        const angle = Math.atan2(el.y2 - el.y, el.x2 - el.x);
        const headlen = Math.max(10, strokeWidth * 3.5);
        const a1x = el.x2 - headlen * Math.cos(angle - Math.PI / 6);
        const a1y = el.y2 - headlen * Math.sin(angle - Math.PI / 6);
        const a2x = el.x2 - headlen * Math.cos(angle + Math.PI / 6);
        const a2y = el.y2 - headlen * Math.sin(angle + Math.PI / 6);

        svgContent += `  <line x1="${el.x}" y1="${el.y}" x2="${el.x2}" y2="${el.y2}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" />\n`;
        svgContent += `  <path d="M ${a1x} ${a1y} L ${el.x2} ${el.y2} L ${a2x} ${a2y}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none" />\n`;
        break;

      case 'text':
        const lines = (el.content || '').split('\n');
        const fontSize = el.fontSize || 20;
        const lineHeight = fontSize * 1.3;
        lines.forEach((line, idx) => {
          const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          svgContent += `  <text x="${el.x}" y="${el.y + idx * lineHeight + fontSize}" font-family="Inter, sans-serif" font-size="${fontSize}" fill="${stroke}">${escaped}</text>\n`;
        });
        break;
    }
  });

  svgContent += `</svg>`;
  return svgContent;
}

/**
 * Triggers file download in browser
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob =
    mimeType === 'image/png'
      ? dataURLToBlob(content)
      : new Blob([content], { type: mimeType });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function dataURLToBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}
