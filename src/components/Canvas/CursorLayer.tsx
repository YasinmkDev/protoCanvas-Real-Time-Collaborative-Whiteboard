import React from 'react';
import { UserPresence, Viewport } from '../../types';
import { Pen, Square, Circle, MoveRight, Type, MousePointer } from 'lucide-react';

interface CursorLayerProps {
  collaborators: UserPresence[];
  viewport: Viewport;
}

export const CursorLayer: React.FC<CursorLayerProps> = ({ collaborators, viewport }) => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
      {collaborators.map((peer) => {
        if (!peer.cursor) return null;

        // Transform world coordinates to screen coordinates
        const screenX = peer.cursor.x * viewport.zoom + viewport.x;
        const screenY = peer.cursor.y * viewport.zoom + viewport.y;

        const getToolIcon = () => {
          switch (peer.activeTool) {
            case 'pen':
              return <Pen size={11} className="text-white" />;
            case 'rect':
              return <Square size={11} className="text-white" />;
            case 'circle':
              return <Circle size={11} className="text-white" />;
            case 'arrow':
              return <MoveRight size={11} className="text-white" />;
            case 'text':
              return <Type size={11} className="text-white" />;
            default:
              return <MousePointer size={11} className="text-white" />;
          }
        };

        return (
          <div
            key={peer.id}
            id={`cursor-${peer.id}`}
            className="absolute transition-transform duration-75 ease-out will-change-transform"
            style={{
              transform: `translate(${screenX}px, ${screenY}px)`,
            }}
          >
            {/* Colored Cursor Arrow */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-sm filter"
              style={{ color: peer.color }}
            >
              <path
                d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                fill={peer.color}
                stroke="#ffffff"
                strokeWidth="1.2"
              />
            </svg>

            {/* Name and Tool Tag */}
            <div
              className="absolute left-3 top-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold text-white shadow-md select-none whitespace-nowrap"
              style={{ backgroundColor: peer.color }}
            >
              <span className="opacity-90">{getToolIcon()}</span>
              <span>{peer.name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
