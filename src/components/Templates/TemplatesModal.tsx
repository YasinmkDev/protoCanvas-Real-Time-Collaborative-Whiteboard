import React from 'react';
import * as Y from 'yjs';
import { WhiteboardElement, Viewport } from '../../types';
import { setElementInDoc } from '../../lib/yjsSchema';
import {
  Sparkles,
  Columns3,
  GitFork,
  Kanban,
  Smartphone,
  Network,
  X,
  Plus,
} from 'lucide-react';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: Y.Doc;
  userOrigin: string;
  viewport: Viewport;
}

interface TemplateDef {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  generate: (originX: number, originY: number, userOrigin: string) => WhiteboardElement[];
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  doc,
  userOrigin,
  viewport,
}) => {
  if (!isOpen) return null;

  // Viewport center in world coordinates
  const worldCenterX = Math.round(-viewport.x / viewport.zoom + 400);
  const worldCenterY = Math.round(-viewport.y / viewport.zoom + 250);

  const templates: TemplateDef[] = [
    {
      id: 'retro',
      title: 'Sprint Retrospective',
      description: '4-column agile board with pastel sticky notes for team feedback and action items.',
      category: 'Agile & Team',
      icon: <Columns3 size={20} className="text-[#8169ff]" />,
      generate: (ox, oy, origin) => {
        const els: WhiteboardElement[] = [];
        const cols = [
          { title: '🟢 What Went Well', color: '#bbf7d0', stickies: ['Fast CI/CD pipeline', 'Clean UI system'] },
          { title: '🟡 Needs Improvement', color: '#fed7aa', stickies: ['Flaky integration tests', 'Docs sync'] },
          { title: '💡 New Ideas', color: '#bae6fd', stickies: ['Add AI summarizer', 'Voice notes'] },
          { title: '🎯 Action Items', color: '#e9d5ff', stickies: ['Refactor state store', 'Release v1.2'] },
        ];

        cols.forEach((col, cIdx) => {
          const colX = ox + cIdx * 220;
          // Column Header Card
          els.push({
            id: `tpl_r_h_${cIdx}_${Date.now()}`,
            type: 'rect',
            x: colX,
            y: oy,
            width: 200,
            height: 48,
            borderRadius: 12,
            color: '#181818',
            strokeWidth: 1,
            fillColor: '#ffffff',
            zOrder: Date.now() + cIdx * 10,
            createdBy: origin,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          // Column Title
          els.push({
            id: `tpl_r_t_${cIdx}_${Date.now()}`,
            type: 'text',
            x: colX + 16,
            y: oy + 14,
            content: col.title,
            fontSize: 14,
            fontFamily: 'Inter, sans-serif',
            color: '#181818',
            strokeWidth: 1,
            zOrder: Date.now() + cIdx * 10 + 1,
            createdBy: origin,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          // Sticky notes
          col.stickies.forEach((stk, sIdx) => {
            els.push({
              id: `tpl_r_s_${cIdx}_${sIdx}_${Date.now()}`,
              type: 'sticky',
              x: colX,
              y: oy + 64 + sIdx * 150,
              width: 200,
              height: 135,
              content: stk,
              color: '#181818',
              fillColor: col.color,
              fontSize: 14,
              fontFamily: 'Inter, sans-serif',
              strokeWidth: 1,
              author: 'Team',
              zOrder: Date.now() + cIdx * 10 + 2 + sIdx,
              createdBy: origin,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          });
        });
        return els;
      },
    },
    {
      id: 'flowchart',
      title: 'User Decision Journey',
      description: 'Flowchart with process steps, diamond decision nodes, and directed connectors.',
      category: 'Architecture & UX',
      icon: <GitFork size={20} className="text-[#2563eb]" />,
      generate: (ox, oy, origin) => {
        const els: WhiteboardElement[] = [];
        // Start node (Rounded Pill)
        els.push({
          id: `flow_start_${Date.now()}`,
          type: 'rect',
          x: ox,
          y: oy + 60,
          width: 140,
          height: 60,
          borderRadius: 30,
          color: '#059669',
          strokeWidth: 2,
          fillColor: '#dcfce7',
          zOrder: Date.now() + 1,
          createdBy: origin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        els.push({
          id: `flow_start_t_${Date.now()}`,
          type: 'text',
          x: ox + 32,
          y: oy + 78,
          content: 'User Lands',
          fontSize: 14,
          color: '#065f46',
          strokeWidth: 1,
          zOrder: Date.now() + 2,
          createdBy: origin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        // Arrow 1
        els.push({
          id: `flow_arr1_${Date.now()}`,
          type: 'arrow',
          x: ox + 140,
          y: oy + 90,
          x2: ox + 220,
          y2: oy + 90,
          color: '#64748b',
          strokeWidth: 2,
          zOrder: Date.now() + 3,
          createdBy: origin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        // Decision Diamond
        els.push({
          id: `flow_diamond_${Date.now()}`,
          type: 'diamond',
          x: ox + 220,
          y: oy + 30,
          width: 130,
          height: 120,
          color: '#8169ff',
          strokeWidth: 2,
          fillColor: '#ede9fe',
          zOrder: Date.now() + 4,
          createdBy: origin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        els.push({
          id: `flow_diamond_t_${Date.now()}`,
          type: 'text',
          x: ox + 248,
          y: oy + 78,
          content: 'Signed In?',
          fontSize: 13,
          color: '#5b21b6',
          strokeWidth: 1,
          zOrder: Date.now() + 5,
          createdBy: origin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        // Path YES -> Dashboard
        els.push({
          id: `flow_arr_yes_${Date.now()}`,
          type: 'arrow',
          x: ox + 350,
          y: oy + 90,
          x2: ox + 430,
          y2: oy + 90,
          color: '#059669',
          strokeWidth: 2,
          zOrder: Date.now() + 6,
          createdBy: origin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        els.push({
          id: `flow_step_yes_${Date.now()}`,
          type: 'rect',
          x: ox + 430,
          y: oy + 60,
          width: 150,
          height: 60,
          borderRadius: 10,
          color: '#2563eb',
          strokeWidth: 2,
          fillColor: '#eff6ff',
          zOrder: Date.now() + 7,
          createdBy: origin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        els.push({
          id: `flow_step_yes_t_${Date.now()}`,
          type: 'text',
          x: ox + 450,
          y: oy + 78,
          content: 'Open Dashboard',
          fontSize: 14,
          color: '#1e40af',
          strokeWidth: 1,
          zOrder: Date.now() + 8,
          createdBy: origin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        // Path NO -> Login Page (Branch Down)
        els.push({
          id: `flow_arr_no_${Date.now()}`,
          type: 'arrow',
          x: ox + 285,
          y: oy + 150,
          x2: ox + 285,
          y2: oy + 210,
          color: '#d97706',
          strokeWidth: 2,
          zOrder: Date.now() + 9,
          createdBy: origin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        els.push({
          id: `flow_step_no_${Date.now()}`,
          type: 'rect',
          x: ox + 210,
          y: oy + 210,
          width: 150,
          height: 60,
          borderRadius: 10,
          color: '#d97706',
          strokeWidth: 2,
          fillColor: '#fffbeb',
          zOrder: Date.now() + 10,
          createdBy: origin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        els.push({
          id: `flow_step_no_t_${Date.now()}`,
          type: 'text',
          x: ox + 235,
          y: oy + 228,
          content: 'Prompt Sign In',
          fontSize: 14,
          color: '#92400e',
          strokeWidth: 1,
          zOrder: Date.now() + 11,
          createdBy: origin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        return els;
      },
    },
    {
      id: 'wireframe',
      title: 'Mobile App Wireframe',
      description: 'Mobile screen frame with notch, navigation bar, hero card, and bottom tabs.',
      category: 'Design & Prototyping',
      icon: <Smartphone size={20} className="text-[#059669]" />,
      generate: (ox, oy, origin) => {
        const els: WhiteboardElement[] = [];
        const phoneW = 280;
        const phoneH = 480;

        // Device Frame
        els.push({
          id: `wire_frame_${Date.now()}`,
          type: 'rect',
          x: ox,
          y: oy,
          width: phoneW,
          height: phoneH,
          borderRadius: 28,
          color: '#181818',
          strokeWidth: 3,
          fillColor: '#ffffff',
          zOrder: Date.now() + 1,
          createdBy: origin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        // Top Notch / Speaker
        els.push({
          id: `wire_notch_${Date.now()}`,
          type: 'rect',
          x: ox + phoneW / 2 - 35,
          y: oy + 12,
          width: 70,
          height: 10,
          borderRadius: 5,
          color: '#181818',
          strokeWidth: 1,
          fillColor: '#181818',
          zOrder: Date.now() + 2,
          createdBy: origin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        // Header Bar
        els.push({
          id: `wire_header_${Date.now()}`,
          type: 'rect',
          x: ox + 16,
          y: oy + 36,
          width: phoneW - 32,
          height: 40,
          borderRadius: 8,
          color: '#e5e5ea',
          strokeWidth: 1,
          fillColor: '#f5f5f7',
          zOrder: Date.now() + 3,
          createdBy: origin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        els.push({
          id: `wire_header_t_${Date.now()}`,
          type: 'text',
          x: ox + 30,
          y: oy + 46,
          content: 'My Workspace',
          fontSize: 14,
          color: '#181818',
          strokeWidth: 1,
          zOrder: Date.now() + 4,
          createdBy: origin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        // Hero Card
        els.push({
          id: `wire_card1_${Date.now()}`,
          type: 'rect',
          x: ox + 16,
          y: oy + 90,
          width: phoneW - 32,
          height: 140,
          borderRadius: 16,
          color: '#8169ff',
          strokeWidth: 2,
          fillColor: '#f3f1ff',
          zOrder: Date.now() + 5,
          createdBy: origin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        els.push({
          id: `wire_card1_t_${Date.now()}`,
          type: 'text',
          x: ox + 32,
          y: oy + 110,
          content: 'Featured Prototype',
          fontSize: 16,
          color: '#8169ff',
          strokeWidth: 1,
          zOrder: Date.now() + 6,
          createdBy: origin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        // Secondary Card
        els.push({
          id: `wire_card2_${Date.now()}`,
          type: 'rect',
          x: ox + 16,
          y: oy + 245,
          width: phoneW - 32,
          height: 120,
          borderRadius: 14,
          color: '#e5e5ea',
          strokeWidth: 1,
          fillColor: '#fafafa',
          zOrder: Date.now() + 7,
          createdBy: origin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        // Bottom Nav Bar
        els.push({
          id: `wire_nav_${Date.now()}`,
          type: 'rect',
          x: ox + 16,
          y: oy + phoneH - 56,
          width: phoneW - 32,
          height: 42,
          borderRadius: 21,
          color: '#181818',
          strokeWidth: 1,
          fillColor: '#181818',
          zOrder: Date.now() + 8,
          createdBy: origin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        els.push({
          id: `wire_nav_t_${Date.now()}`,
          type: 'text',
          x: ox + 45,
          y: oy + phoneH - 44,
          content: '🏠   🔍   ⚡   👤',
          fontSize: 13,
          color: '#ffffff',
          strokeWidth: 1,
          zOrder: Date.now() + 9,
          createdBy: origin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        return els;
      },
    },
    {
      id: 'mindmap',
      title: 'Brainstorming Mind Map',
      description: 'Central concept hub with 4 color-coded branch nodes and idea clusters.',
      category: 'Ideation',
      icon: <Network size={20} className="text-[#d97706]" />,
      generate: (ox, oy, origin) => {
        const els: WhiteboardElement[] = [];
        const cx = ox + 220;
        const cy = oy + 160;

        // Center Node
        els.push({
          id: `mm_center_${Date.now()}`,
          type: 'circle',
          x: cx,
          y: cy,
          radiusX: 70,
          radiusY: 70,
          color: '#8169ff',
          strokeWidth: 3,
          fillColor: '#ede9fe',
          zOrder: Date.now() + 1,
          createdBy: origin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        els.push({
          id: `mm_center_t_${Date.now()}`,
          type: 'text',
          x: cx - 44,
          y: cy - 10,
          content: 'Core Vision',
          fontSize: 16,
          color: '#5b21b6',
          strokeWidth: 1,
          zOrder: Date.now() + 2,
          createdBy: origin,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        // 4 Satellite branches
        const satellites = [
          { name: 'Features', color: '#2563eb', bg: '#eff6ff', dx: -180, dy: -120 },
          { name: 'Users', color: '#059669', bg: '#ecfdf5', dx: 180, dy: -120 },
          { name: 'Growth', color: '#d97706', bg: '#fffbeb', dx: 180, dy: 120 },
          { name: 'Tech Stack', color: '#dc2626', bg: '#fef2f2', dx: -180, dy: 120 },
        ];

        satellites.forEach((sat, idx) => {
          const sx = cx + sat.dx;
          const sy = cy + sat.dy;

          // Connector Line
          els.push({
            id: `mm_line_${idx}_${Date.now()}`,
            type: 'line',
            x: cx,
            y: cy,
            x2: sx,
            y2: sy,
            color: sat.color,
            strokeWidth: 2,
            strokeStyle: 'dashed',
            zOrder: Date.now() + 3 + idx * 3,
            createdBy: origin,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });

          // Node Circle
          els.push({
            id: `mm_node_${idx}_${Date.now()}`,
            type: 'circle',
            x: sx,
            y: sy,
            radiusX: 52,
            radiusY: 52,
            color: sat.color,
            strokeWidth: 2,
            fillColor: sat.bg,
            zOrder: Date.now() + 4 + idx * 3,
            createdBy: origin,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });

          // Text
          els.push({
            id: `mm_node_t_${idx}_${Date.now()}`,
            type: 'text',
            x: sx - 32,
            y: sy - 8,
            content: sat.name,
            fontSize: 13,
            color: sat.color,
            strokeWidth: 1,
            zOrder: Date.now() + 5 + idx * 3,
            createdBy: origin,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        });

        return els;
      },
    },
    {
      id: 'kanban',
      title: 'Kanban Sprint Board',
      description: 'Streamlined 3-stage board (To Do, In Progress, Done) with pre-populated task cards.',
      category: 'Agile & Team',
      icon: <Kanban size={20} className="text-[#8169ff]" />,
      generate: (ox, oy, origin) => {
        const els: WhiteboardElement[] = [];
        const cols = [
          { title: '📋 To Do', cards: ['User Authentication', 'Responsive Layouts'] },
          { title: '⚡ In Progress', cards: ['Real-time Presence', 'Minimap Radar'] },
          { title: '✅ Done', cards: ['Vite 6 Setup', 'Yjs CRDT Store'] },
        ];

        cols.forEach((col, cIdx) => {
          const colX = ox + cIdx * 240;
          // Column Frame Container
          els.push({
            id: `kb_col_${cIdx}_${Date.now()}`,
            type: 'rect',
            x: colX,
            y: oy,
            width: 220,
            height: 380,
            borderRadius: 16,
            color: '#e5e5ea',
            strokeWidth: 1.5,
            fillColor: '#f9f9fb',
            zOrder: Date.now() + cIdx * 10,
            createdBy: origin,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          // Header title
          els.push({
            id: `kb_col_t_${cIdx}_${Date.now()}`,
            type: 'text',
            x: colX + 16,
            y: oy + 16,
            content: col.title,
            fontSize: 15,
            color: '#181818',
            strokeWidth: 1,
            zOrder: Date.now() + cIdx * 10 + 1,
            createdBy: origin,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          // Cards
          col.cards.forEach((card, cdIdx) => {
            const cardY = oy + 54 + cdIdx * 86;
            els.push({
              id: `kb_card_${cIdx}_${cdIdx}_${Date.now()}`,
              type: 'rect',
              x: colX + 12,
              y: cardY,
              width: 196,
              height: 70,
              borderRadius: 10,
              color: '#dcdcde',
              strokeWidth: 1,
              fillColor: '#ffffff',
              zOrder: Date.now() + cIdx * 10 + 2 + cdIdx * 2,
              createdBy: origin,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
            els.push({
              id: `kb_card_t_${cIdx}_${cdIdx}_${Date.now()}`,
              type: 'text',
              x: colX + 24,
              y: cardY + 24,
              content: card,
              fontSize: 13,
              color: '#181818',
              strokeWidth: 1,
              zOrder: Date.now() + cIdx * 10 + 3 + cdIdx * 2,
              createdBy: origin,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          });
        });

        return els;
      },
    },
  ];

  const handleInsert = (template: TemplateDef) => {
    const newElements = template.generate(worldCenterX, worldCenterY, userOrigin);
    doc.transact(() => {
      newElements.forEach((el) => {
        setElementInDoc(doc, el, userOrigin);
      });
    }, userOrigin);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-[#e5e5ea] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f4] bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#8169ff] flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-[#181818]">
                Starter Canvas Templates
              </h3>
              <p className="text-xs text-[#666666]">
                Instant pre-built frameworks designed for collaborative workshops
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-3">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="flex items-center justify-between p-4 rounded-xl border border-[#e5e5ea] hover:border-[#8169ff] hover:bg-[#faf9ff] transition-all group"
            >
              <div className="flex items-start gap-3.5 pr-4">
                <div className="p-2.5 rounded-xl bg-white border border-[#ececf2] shadow-xs group-hover:scale-105 transition-transform">
                  {tpl.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-[#181818]">
                      {tpl.title}
                    </h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-[#555555]">
                      {tpl.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#666666] mt-0.5 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleInsert(tpl)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8169ff] hover:bg-[#6f56f8] text-white font-semibold text-xs shrink-0 shadow-xs transition-all active:scale-95"
              >
                <Plus size={14} />
                <span>Insert</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
