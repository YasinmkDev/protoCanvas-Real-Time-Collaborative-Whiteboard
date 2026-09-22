import React from 'react';
import { Tool } from '../../types';
import { ToolButton } from './ToolButton';
import {
  MousePointer,
  Hand,
  Pen,
  Highlighter,
  Minus,
  Square,
  Circle,
  Diamond,
  Star,
  MoveRight,
  Type,
  StickyNote,
  Sparkles,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Copy,
  Image as ImageIcon,
  Component,
  Boxes,
} from 'lucide-react';

interface ToolbarProps {
  activeTool: Tool;
  onSelectTool: (tool: Tool) => void;
  onImportImage?: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  hasSelection: boolean;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  canGroup?: boolean;
  canUngroup?: boolean;
  onGroupSelected?: () => void;
  onUngroupSelected?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onSelectTool,
  onImportImage,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  hasSelection,
  onDeleteSelected,
  onDuplicateSelected,
  canGroup = false,
  canUngroup = false,
  onGroupSelected,
  onUngroupSelected,
}) => {
  return (
    <div
      id="main-toolbar"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-1.5 bg-white/95 backdrop-blur-md border border-[#e5e5ea] rounded-2xl shadow-xl transition-all max-w-[95vw] overflow-x-auto"
      style={{
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Navigation & Pointers */}
      <ToolButton
        id="tool-select"
        label="Select"
        shortcut="V"
        isActive={activeTool === 'select'}
        onClick={() => onSelectTool('select')}
        icon={<MousePointer size={17} />}
      />

      <ToolButton
        id="tool-hand"
        label="Hand / Pan"
        shortcut="H"
        isActive={activeTool === 'hand'}
        onClick={() => onSelectTool('hand')}
        icon={<Hand size={17} />}
      />

      <ToolButton
        id="tool-laser"
        label="Laser Pointer"
        shortcut="K"
        isActive={activeTool === 'laser'}
        onClick={() => onSelectTool('laser')}
        icon={<Sparkles size={17} />}
      />

      <div className="w-[1px] h-5 bg-[#e5e5ea] mx-0.5 shrink-0" />

      {/* Freehand & Drawing */}
      <ToolButton
        id="tool-pen"
        label="Pen"
        shortcut="P"
        isActive={activeTool === 'pen'}
        onClick={() => onSelectTool('pen')}
        icon={<Pen size={17} />}
      />

      <ToolButton
        id="tool-highlighter"
        label="Highlighter"
        shortcut="M"
        isActive={activeTool === 'highlighter'}
        onClick={() => onSelectTool('highlighter')}
        icon={<Highlighter size={17} />}
      />

      <ToolButton
        id="tool-eraser"
        label="Eraser"
        shortcut="E"
        isActive={activeTool === 'eraser'}
        onClick={() => onSelectTool('eraser')}
        icon={<Eraser size={17} />}
      />

      <div className="w-[1px] h-5 bg-[#e5e5ea] mx-0.5 shrink-0" />

      {/* Shapes */}
      <ToolButton
        id="tool-rect"
        label="Rectangle"
        shortcut="R"
        isActive={activeTool === 'rect'}
        onClick={() => onSelectTool('rect')}
        icon={<Square size={17} />}
      />

      <ToolButton
        id="tool-circle"
        label="Circle"
        shortcut="O"
        isActive={activeTool === 'circle'}
        onClick={() => onSelectTool('circle')}
        icon={<Circle size={17} />}
      />

      <ToolButton
        id="tool-diamond"
        label="Diamond"
        shortcut="D"
        isActive={activeTool === 'diamond'}
        onClick={() => onSelectTool('diamond')}
        icon={<Diamond size={17} />}
      />

      <ToolButton
        id="tool-star"
        label="Star"
        shortcut="S"
        isActive={activeTool === 'star'}
        onClick={() => onSelectTool('star')}
        icon={<Star size={17} />}
      />

      <ToolButton
        id="tool-line"
        label="Line"
        shortcut="L"
        isActive={activeTool === 'line'}
        onClick={() => onSelectTool('line')}
        icon={<Minus size={17} />}
      />

      <ToolButton
        id="tool-arrow"
        label="Arrow"
        shortcut="A"
        isActive={activeTool === 'arrow'}
        onClick={() => onSelectTool('arrow')}
        icon={<MoveRight size={17} />}
      />

      <div className="w-[1px] h-5 bg-[#e5e5ea] mx-0.5 shrink-0" />

      {/* Content Tools */}
      <ToolButton
        id="tool-sticky"
        label="Sticky Note"
        shortcut="N"
        isActive={activeTool === 'sticky'}
        onClick={() => onSelectTool('sticky')}
        icon={<StickyNote size={17} />}
      />

      <ToolButton
        id="tool-text"
        label="Text"
        shortcut="T"
        isActive={activeTool === 'text'}
        onClick={() => onSelectTool('text')}
        icon={<Type size={17} />}
      />

      {onImportImage && (
        <ToolButton
          id="tool-image"
          label="Import Image"
          shortcut="I"
          isActive={false}
          onClick={onImportImage}
          icon={<ImageIcon size={17} />}
        />
      )}

      <div className="w-[1px] h-5 bg-[#e5e5ea] mx-0.5 shrink-0" />

      {/* Undo / Redo */}
      <ToolButton
        id="btn-undo"
        label="Undo"
        shortcut="Ctrl+Z"
        disabled={!canUndo}
        onClick={onUndo}
        icon={<Undo2 size={17} />}
      />

      <ToolButton
        id="btn-redo"
        label="Redo"
        shortcut="Ctrl+Shift+Z"
        disabled={!canRedo}
        onClick={onRedo}
        icon={<Redo2 size={17} />}
      />

      {/* Contextual Actions (Group / Ungroup / Duplicate / Delete) */}
      {hasSelection && (
        <>
          <div className="w-[1px] h-5 bg-[#e5e5ea] mx-0.5 shrink-0" />
          {canGroup && onGroupSelected && (
            <ToolButton
              id="btn-group"
              label="Group"
              shortcut="Ctrl+G"
              onClick={onGroupSelected}
              icon={<Component size={16} className="text-[#8169ff]" />}
            />
          )}
          {canUngroup && onUngroupSelected && (
            <ToolButton
              id="btn-ungroup"
              label="Ungroup"
              shortcut="Ctrl+Shift+G"
              onClick={onUngroupSelected}
              icon={<Boxes size={16} className="text-gray-700" />}
            />
          )}
          <ToolButton
            id="btn-duplicate"
            label="Duplicate"
            shortcut="Ctrl+D"
            onClick={onDuplicateSelected}
            icon={<Copy size={16} />}
          />
          <ToolButton
            id="btn-delete"
            label="Delete"
            shortcut="Del"
            onClick={onDeleteSelected}
            icon={<Trash2 size={16} className="text-rose-500" />}
          />
        </>
      )}
    </div>
  );
};
