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
      title: 'Mobile App Wireframe & UI Flow',
      description: 'Dual-screen iOS 18 wireframe flow with Dynamic Island, discovery feed, interactive specs card, bottom navigation dock, and handoff tokens.',
      category: 'Design & Prototyping',
      icon: <Smartphone size={20} className="text-[#059669]" />,
      generate: (ox, oy, origin) => {
        const els: WhiteboardElement[] = [];
        let seq = 1;
        const now = Date.now();
        const nextZ = () => now + seq++;
        const uid = (tag: string) => `wf_${tag}_${now}_${seq}`;

        // Top Frame Banner
        els.push({
          id: uid('banner_bg'),
          type: 'rect',
          x: ox,
          y: oy - 64,
          width: 730,
          height: 44,
          borderRadius: 12,
          color: '#e2e8f0',
          strokeWidth: 1,
          fillColor: '#ffffff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('banner_title'),
          type: 'text',
          x: ox + 18,
          y: oy - 51,
          content: '📱 Mobile Prototype: Discovery Feed & Handoff Specs Flow',
          fontSize: 14,
          color: '#0f172a',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('banner_badge'),
          type: 'text',
          x: ox + 550,
          y: oy - 49,
          content: '• Dual iOS Frames',
          fontSize: 11,
          color: '#8169ff',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // ==========================================
        // SCREEN 1: Discovery & Feed (ox, oy)
        // ==========================================
        const s1X = ox;
        const s1Y = oy;
        const phoneW = 320;
        const phoneH = 640;

        // Device Frame Outer Bezel
        els.push({
          id: uid('s1_bezel'),
          type: 'rect',
          x: s1X,
          y: s1Y,
          width: phoneW,
          height: phoneH,
          borderRadius: 44,
          color: '#0f172a',
          strokeWidth: 3.5,
          fillColor: '#f8fafc',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Dynamic Island
        els.push({
          id: uid('s1_island'),
          type: 'rect',
          x: s1X + 114,
          y: s1Y + 14,
          width: 92,
          height: 26,
          borderRadius: 13,
          color: '#0f172a',
          strokeWidth: 1,
          fillColor: '#0f172a',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        // Sensor Dot
        els.push({
          id: uid('s1_sensor'),
          type: 'circle',
          x: s1X + 180,
          y: s1Y + 27,
          radiusX: 4,
          radiusY: 4,
          color: '#1e293b',
          strokeWidth: 1,
          fillColor: '#1e293b',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Status Bar Time
        els.push({
          id: uid('s1_time'),
          type: 'text',
          x: s1X + 32,
          y: s1Y + 19,
          content: '9:41',
          fontSize: 12,
          color: '#0f172a',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        // Status Bar Indicators
        els.push({
          id: uid('s1_status'),
          type: 'text',
          x: s1X + 226,
          y: s1Y + 19,
          content: '5G 100% 🔋',
          fontSize: 10,
          color: '#475569',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // App User Greeting
        els.push({
          id: uid('s1_greet'),
          type: 'text',
          x: s1X + 22,
          y: s1Y + 54,
          content: 'Welcome back,',
          fontSize: 11,
          color: '#64748b',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s1_user'),
          type: 'text',
          x: s1X + 22,
          y: s1Y + 70,
          content: 'Alex Rivera 👋',
          fontSize: 16,
          color: '#0f172a',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        // User Avatar Circle
        els.push({
          id: uid('s1_avatar_bg'),
          type: 'circle',
          x: s1X + 282,
          y: s1Y + 72,
          radiusX: 16,
          radiusY: 16,
          color: '#8169ff',
          strokeWidth: 1.5,
          fillColor: '#ede9fe',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s1_avatar_txt'),
          type: 'text',
          x: s1X + 274,
          y: s1Y + 65,
          content: 'AR',
          fontSize: 11,
          color: '#6d28d9',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Modern Search Bar
        els.push({
          id: uid('s1_search_bg'),
          type: 'rect',
          x: s1X + 18,
          y: s1Y + 102,
          width: 284,
          height: 36,
          borderRadius: 18,
          color: '#e2e8f0',
          strokeWidth: 1.5,
          fillColor: '#ffffff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s1_search_txt'),
          type: 'text',
          x: s1X + 32,
          y: s1Y + 112,
          content: '🔍 Search canvases, tokens...',
          fontSize: 11,
          color: '#94a3b8',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Filter Pills
        els.push({
          id: uid('s1_pill1_bg'),
          type: 'rect',
          x: s1X + 18,
          y: s1Y + 148,
          width: 54,
          height: 28,
          borderRadius: 14,
          color: '#8169ff',
          strokeWidth: 1,
          fillColor: '#8169ff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s1_pill1_txt'),
          type: 'text',
          x: s1X + 34,
          y: s1Y + 155,
          content: 'All',
          fontSize: 11,
          color: '#ffffff',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        els.push({
          id: uid('s1_pill2_bg'),
          type: 'rect',
          x: s1X + 80,
          y: s1Y + 148,
          width: 90,
          height: 28,
          borderRadius: 14,
          color: '#e2e8f0',
          strokeWidth: 1,
          fillColor: '#ffffff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s1_pill2_txt'),
          type: 'text',
          x: s1X + 96,
          y: s1Y + 155,
          content: 'Canvases',
          fontSize: 11,
          color: '#475569',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        els.push({
          id: uid('s1_pill3_bg'),
          type: 'rect',
          x: s1X + 178,
          y: s1Y + 148,
          width: 92,
          height: 28,
          borderRadius: 14,
          color: '#e2e8f0',
          strokeWidth: 1,
          fillColor: '#ffffff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s1_pill3_txt'),
          type: 'text',
          x: s1X + 192,
          y: s1Y + 155,
          content: 'Prototypes',
          fontSize: 11,
          color: '#475569',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Featured Hero Card
        els.push({
          id: uid('s1_hero_bg'),
          type: 'rect',
          x: s1X + 18,
          y: s1Y + 188,
          width: 284,
          height: 136,
          borderRadius: 18,
          color: '#4338ca',
          strokeWidth: 1.5,
          fillColor: '#1e1b4b',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s1_hero_badge'),
          type: 'rect',
          x: s1X + 32,
          y: s1Y + 202,
          width: 96,
          height: 20,
          borderRadius: 6,
          color: '#312e81',
          strokeWidth: 1,
          fillColor: '#312e81',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s1_hero_badge_txt'),
          type: 'text',
          x: s1X + 38,
          y: s1Y + 206,
          content: '⭐ FEATURED V2',
          fontSize: 9,
          color: '#a5b4fc',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s1_hero_h'),
          type: 'text',
          x: s1X + 32,
          y: s1Y + 230,
          content: 'Design System Hub',
          fontSize: 15,
          color: '#ffffff',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s1_hero_sub'),
          type: 'text',
          x: s1X + 32,
          y: s1Y + 252,
          content: '36 modular iOS components',
          fontSize: 11,
          color: '#c7d2fe',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s1_hero_btn'),
          type: 'rect',
          x: s1X + 32,
          y: s1Y + 280,
          width: 118,
          height: 28,
          borderRadius: 8,
          color: '#8169ff',
          strokeWidth: 1,
          fillColor: '#8169ff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s1_hero_btn_txt'),
          type: 'text',
          x: s1X + 44,
          y: s1Y + 287,
          content: 'Explore Flow →',
          fontSize: 11,
          color: '#ffffff',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Section Title
        els.push({
          id: uid('s1_sec_title'),
          type: 'text',
          x: s1X + 22,
          y: s1Y + 338,
          content: 'Recent Workspaces',
          fontSize: 13,
          color: '#0f172a',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s1_sec_more'),
          type: 'text',
          x: s1X + 242,
          y: s1Y + 340,
          content: 'See all →',
          fontSize: 11,
          color: '#8169ff',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Recent Project Card 1
        els.push({
          id: uid('s1_card1_bg'),
          type: 'rect',
          x: s1X + 18,
          y: s1Y + 360,
          width: 284,
          height: 58,
          borderRadius: 14,
          color: '#e2e8f0',
          strokeWidth: 1,
          fillColor: '#ffffff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s1_card1_icon_bg'),
          type: 'rect',
          x: s1X + 28,
          y: s1Y + 370,
          width: 38,
          height: 38,
          borderRadius: 10,
          color: '#10b981',
          strokeWidth: 1,
          fillColor: '#ecfdf5',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s1_card1_icon_t'),
          type: 'text',
          x: s1X + 40,
          y: s1Y + 380,
          content: '📱',
          fontSize: 14,
          color: '#059669',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s1_card1_t'),
          type: 'text',
          x: s1X + 76,
          y: s1Y + 372,
          content: 'Checkout Flow v2',
          fontSize: 12,
          color: '#1e293b',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s1_card1_sub'),
          type: 'text',
          x: s1X + 76,
          y: s1Y + 392,
          content: 'Updated 2m ago • 4 active',
          fontSize: 10,
          color: '#94a3b8',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Recent Project Card 2
        els.push({
          id: uid('s1_card2_bg'),
          type: 'rect',
          x: s1X + 18,
          y: s1Y + 428,
          width: 284,
          height: 58,
          borderRadius: 14,
          color: '#e2e8f0',
          strokeWidth: 1,
          fillColor: '#ffffff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s1_card2_icon_bg'),
          type: 'rect',
          x: s1X + 28,
          y: s1Y + 438,
          width: 38,
          height: 38,
          borderRadius: 10,
          color: '#3b82f6',
          strokeWidth: 1,
          fillColor: '#eff6ff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s1_card2_icon_t'),
          type: 'text',
          x: s1X + 40,
          y: s1Y + 448,
          content: '⚡',
          fontSize: 14,
          color: '#2563eb',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s1_card2_t'),
          type: 'text',
          x: s1X + 76,
          y: s1Y + 440,
          content: 'Mind Map Architecture',
          fontSize: 12,
          color: '#1e293b',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s1_card2_sub'),
          type: 'text',
          x: s1X + 76,
          y: s1Y + 460,
          content: 'Updated 1h ago • 2 active',
          fontSize: 10,
          color: '#94a3b8',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Floating Bottom Dock
        els.push({
          id: uid('s1_dock_bg'),
          type: 'rect',
          x: s1X + 22,
          y: s1Y + 544,
          width: 276,
          height: 48,
          borderRadius: 24,
          color: '#1e293b',
          strokeWidth: 1,
          fillColor: '#0f172a',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s1_dock_active'),
          type: 'rect',
          x: s1X + 36,
          y: s1Y + 552,
          width: 38,
          height: 32,
          borderRadius: 16,
          color: '#3b0764',
          strokeWidth: 1,
          fillColor: '#2e1065',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s1_dock_icons'),
          type: 'text',
          x: s1X + 46,
          y: s1Y + 560,
          content: '🏠      🔍      ➕      🔔      👤',
          fontSize: 13,
          color: '#ffffff',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Home Gesture Bar
        els.push({
          id: uid('s1_home_bar'),
          type: 'rect',
          x: s1X + 115,
          y: s1Y + 620,
          width: 90,
          height: 4,
          borderRadius: 2,
          color: '#cbd5e1',
          strokeWidth: 1,
          fillColor: '#cbd5e1',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // ==========================================
        // FLOW CONNECTOR ARROW (Between screens)
        // ==========================================
        els.push({
          id: uid('flow_arrow'),
          type: 'arrow',
          x: s1X + phoneW - 18,
          y: s1Y + 389,
          x2: s1X + phoneW + 68,
          y2: s1Y + 389,
          color: '#8169ff',
          strokeWidth: 2,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('flow_badge_bg'),
          type: 'rect',
          x: s1X + phoneW + 8,
          y: s1Y + 358,
          width: 60,
          height: 22,
          borderRadius: 6,
          color: '#c4b5fd',
          strokeWidth: 1,
          fillColor: '#ede9fe',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('flow_badge_txt'),
          type: 'text',
          x: s1X + phoneW + 14,
          y: s1Y + 363,
          content: 'Tap card',
          fontSize: 10,
          color: '#6d28d9',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // ==========================================
        // SCREEN 2: Detail & Handoff Screen
        // ==========================================
        const s2X = ox + 390;
        const s2Y = oy;

        // Outer Bezel
        els.push({
          id: uid('s2_bezel'),
          type: 'rect',
          x: s2X,
          y: s2Y,
          width: phoneW,
          height: phoneH,
          borderRadius: 44,
          color: '#0f172a',
          strokeWidth: 3.5,
          fillColor: '#f8fafc',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Dynamic Island
        els.push({
          id: uid('s2_island'),
          type: 'rect',
          x: s2X + 114,
          y: s2Y + 14,
          width: 92,
          height: 26,
          borderRadius: 13,
          color: '#0f172a',
          strokeWidth: 1,
          fillColor: '#0f172a',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Status Bar
        els.push({
          id: uid('s2_time'),
          type: 'text',
          x: s2X + 32,
          y: s2Y + 19,
          content: '9:41',
          fontSize: 12,
          color: '#0f172a',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s2_status'),
          type: 'text',
          x: s2X + 226,
          y: s2Y + 19,
          content: '5G 100% 🔋',
          fontSize: 10,
          color: '#475569',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Top Navigation Bar
        els.push({
          id: uid('s2_back'),
          type: 'text',
          x: s2X + 22,
          y: s2Y + 58,
          content: '‹ Back',
          fontSize: 13,
          color: '#64748b',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s2_nav_title'),
          type: 'text',
          x: s2X + 96,
          y: s2Y + 58,
          content: 'Checkout Flow v2',
          fontSize: 13,
          color: '#0f172a',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s2_nav_actions'),
          type: 'text',
          x: s2X + 268,
          y: s2Y + 58,
          content: '↗  ⋯',
          fontSize: 13,
          color: '#64748b',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Segmented Control Tabs
        els.push({
          id: uid('s2_seg_bg'),
          type: 'rect',
          x: s2X + 18,
          y: s2Y + 90,
          width: 284,
          height: 32,
          borderRadius: 10,
          color: '#e2e8f0',
          strokeWidth: 1,
          fillColor: '#e2e8f0',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s2_seg_active'),
          type: 'rect',
          x: s2X + 20,
          y: s2Y + 92,
          width: 92,
          height: 28,
          borderRadius: 8,
          color: '#ffffff',
          strokeWidth: 1,
          fillColor: '#ffffff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s2_seg_t1'),
          type: 'text',
          x: s2X + 46,
          y: s2Y + 99,
          content: 'Specs',
          fontSize: 11,
          color: '#0f172a',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s2_seg_t2'),
          type: 'text',
          x: s2X + 138,
          y: s2Y + 99,
          content: 'Assets',
          fontSize: 11,
          color: '#64748b',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s2_seg_t3'),
          type: 'text',
          x: s2X + 230,
          y: s2Y + 99,
          content: 'History',
          fontSize: 11,
          color: '#64748b',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Visual Mockup Preview Card
        els.push({
          id: uid('s2_prev_card_bg'),
          type: 'rect',
          x: s2X + 18,
          y: s2Y + 134,
          width: 284,
          height: 160,
          borderRadius: 16,
          color: '#e2e8f0',
          strokeWidth: 1.5,
          fillColor: '#ffffff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s2_pay_card'),
          type: 'rect',
          x: s2X + 32,
          y: s2Y + 148,
          width: 256,
          height: 74,
          borderRadius: 12,
          color: '#4338ca',
          strokeWidth: 1.5,
          fillColor: '#312e81',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s2_pay_label'),
          type: 'text',
          x: s2X + 44,
          y: s2Y + 158,
          content: '💳  CREDIT CARD',
          fontSize: 10,
          color: '#a5b4fc',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s2_pay_num'),
          type: 'text',
          x: s2X + 44,
          y: s2Y + 178,
          content: '••••  ••••  ••••  4242',
          fontSize: 13,
          color: '#ffffff',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s2_pay_holder'),
          type: 'text',
          x: s2X + 44,
          y: s2Y + 198,
          content: 'ALEX RIVERA  •  EXP 09/29',
          fontSize: 9,
          color: '#c7d2fe',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Toggle Switch Row
        els.push({
          id: uid('s2_toggle_bg'),
          type: 'rect',
          x: s2X + 32,
          y: s2Y + 234,
          width: 256,
          height: 44,
          borderRadius: 10,
          color: '#e2e8f0',
          strokeWidth: 1,
          fillColor: '#f8fafc',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s2_toggle_txt'),
          type: 'text',
          x: s2X + 44,
          y: s2Y + 248,
          content: '1-Click Express Checkout',
          fontSize: 11,
          color: '#1e293b',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s2_toggle_switch'),
          type: 'rect',
          x: s2X + 244,
          y: s2Y + 245,
          width: 32,
          height: 18,
          borderRadius: 9,
          color: '#8169ff',
          strokeWidth: 1,
          fillColor: '#8169ff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Design System Tokens Section
        els.push({
          id: uid('s2_tok_sec'),
          type: 'text',
          x: s2X + 20,
          y: s2Y + 310,
          content: 'Design System Tokens',
          fontSize: 13,
          color: '#0f172a',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        els.push({
          id: uid('s2_tok1_bg'),
          type: 'rect',
          x: s2X + 18,
          y: s2Y + 332,
          width: 138,
          height: 38,
          borderRadius: 8,
          color: '#e2e8f0',
          strokeWidth: 1,
          fillColor: '#ffffff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s2_tok1_txt'),
          type: 'text',
          x: s2X + 26,
          y: s2Y + 344,
          content: '🎨 Brand: #8169FF',
          fontSize: 10,
          color: '#4338ca',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        els.push({
          id: uid('s2_tok2_bg'),
          type: 'rect',
          x: s2X + 164,
          y: s2Y + 332,
          width: 138,
          height: 38,
          borderRadius: 8,
          color: '#e2e8f0',
          strokeWidth: 1,
          fillColor: '#ffffff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s2_tok2_txt'),
          type: 'text',
          x: s2X + 172,
          y: s2Y + 344,
          content: '📐 Radius: 18px',
          fontSize: 10,
          color: '#334155',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        els.push({
          id: uid('s2_tok3_bg'),
          type: 'rect',
          x: s2X + 18,
          y: s2Y + 380,
          width: 284,
          height: 38,
          borderRadius: 8,
          color: '#e2e8f0',
          strokeWidth: 1,
          fillColor: '#ffffff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s2_tok3_txt'),
          type: 'text',
          x: s2X + 26,
          y: s2Y + 392,
          content: '🔤 Font: Inter 600 / 500 (Auto Scale)',
          fontSize: 10,
          color: '#334155',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Bottom CTA Button
        els.push({
          id: uid('s2_cta_btn'),
          type: 'rect',
          x: s2X + 18,
          y: s2Y + 538,
          width: 284,
          height: 46,
          borderRadius: 14,
          color: '#7052f5',
          strokeWidth: 1.5,
          fillColor: '#8169ff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('s2_cta_txt'),
          type: 'text',
          x: s2X + 54,
          y: s2Y + 552,
          content: 'Export Spec to Figma / Code ⚡',
          fontSize: 12,
          color: '#ffffff',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Screen 2 Home Bar
        els.push({
          id: uid('s2_home_bar'),
          type: 'rect',
          x: s2X + 115,
          y: s2Y + 620,
          width: 90,
          height: 4,
          borderRadius: 2,
          color: '#cbd5e1',
          strokeWidth: 1,
          fillColor: '#cbd5e1',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // ==========================================
        // DESIGNER STICKY NOTE ANNOTATION
        // ==========================================
        els.push({
          id: uid('spec_sticky'),
          type: 'sticky',
          x: s2X + phoneW + 24,
          y: s2Y + 110,
          width: 210,
          height: 180,
          content: '📱 Wireframe Specs:\n• iOS 18 Squircle Curves\n• Handoff tokens synced\n• Dynamic Island animations\n• Zero-latency live preview',
          color: '#181818',
          fillColor: '#fef08a',
          fontSize: 13,
          fontFamily: 'Inter, sans-serif',
          strokeWidth: 1,
          businessTag: 'approved',
          author: 'Design Lead',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        return els;
      },
    },
    {
      id: 'mindmap',
      title: 'Brainstorming Mind Map',
      description: 'Central vision core hub with 4 color-coded thematic pillars, idea vectors, and actionable sticky notes with status tags.',
      category: 'Ideation',
      icon: <Network size={20} className="text-[#d97706]" />,
      generate: (ox, oy, origin) => {
        const els: WhiteboardElement[] = [];
        let seq = 1;
        const now = Date.now();
        const nextZ = () => now + seq++;
        const uid = (tag: string) => `mm_${tag}_${now}_${seq}`;

        // Banner Header
        els.push({
          id: uid('banner_bg'),
          type: 'rect',
          x: ox + 140,
          y: oy - 50,
          width: 680,
          height: 44,
          borderRadius: 12,
          color: '#e2e8f0',
          strokeWidth: 1,
          fillColor: '#ffffff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('banner_txt'),
          type: 'text',
          x: ox + 160,
          y: oy - 37,
          content: '🧠 Strategic Product Brainstorming & Alignment Mind Map',
          fontSize: 14,
          color: '#0f172a',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('banner_badge'),
          type: 'text',
          x: ox + 660,
          y: oy - 35,
          content: '• 4 Focus Pillars • 12 Vectors',
          fontSize: 11,
          color: '#8169ff',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Center Origin
        const cx = ox + 480;
        const cy = oy + 360;

        // ==========================================
        // CENTRAL ROOT HUB
        // ==========================================
        els.push({
          id: uid('hub_outer_ring'),
          type: 'circle',
          x: cx,
          y: cy,
          radiusX: 98,
          radiusY: 98,
          color: '#8169ff',
          strokeWidth: 3,
          fillColor: '#f5f3ff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('hub_inner_ring'),
          type: 'circle',
          x: cx,
          y: cy,
          radiusX: 78,
          radiusY: 78,
          color: '#c4b5fd',
          strokeWidth: 2,
          fillColor: '#ffffff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('hub_icon'),
          type: 'text',
          x: cx - 14,
          y: cy - 42,
          content: '🚀',
          fontSize: 24,
          color: '#4c1d95',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('hub_title'),
          type: 'text',
          x: cx - 50,
          y: cy - 10,
          content: 'Vision 2026',
          fontSize: 17,
          color: '#4c1d95',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('hub_sub'),
          type: 'text',
          x: cx - 58,
          y: cy + 16,
          content: 'Collaborative Canvas',
          fontSize: 10,
          color: '#7c3aed',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // ==========================================
        // PILLAR 1: Top-Right (AI & Intelligence - Blue)
        // ==========================================
        els.push({
          id: uid('p1_line'),
          type: 'arrow',
          x: cx + 70,
          y: cy - 70,
          x2: cx + 180,
          y2: cy - 150,
          color: '#2563eb',
          strokeWidth: 3,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('p1_hub_bg'),
          type: 'rect',
          x: cx + 180,
          y: cy - 180,
          width: 200,
          height: 54,
          borderRadius: 16,
          color: '#3b82f6',
          strokeWidth: 2,
          fillColor: '#eff6ff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('p1_hub_t'),
          type: 'text',
          x: cx + 198,
          y: cy - 162,
          content: '✨ AI & Smart Tools',
          fontSize: 14,
          color: '#1e40af',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Pillar 1 Sub-branches
        els.push({
          id: uid('p1_sub1_line'),
          type: 'line',
          x: cx + 380,
          y: cy - 165,
          x2: cx + 430,
          y2: cy - 200,
          color: '#93c5fd',
          strokeWidth: 1.5,
          strokeStyle: 'dashed',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('p1_sub1_bg'),
          type: 'rect',
          x: cx + 430,
          y: cy - 220,
          width: 170,
          height: 38,
          borderRadius: 10,
          color: '#93c5fd',
          strokeWidth: 1.5,
          fillColor: '#ffffff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('p1_sub1_txt'),
          type: 'text',
          x: cx + 444,
          y: cy - 208,
          content: 'Auto-Layout Engine',
          fontSize: 11,
          color: '#1e40af',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        els.push({
          id: uid('p1_sub2_line'),
          type: 'line',
          x: cx + 380,
          y: cy - 140,
          x2: cx + 430,
          y2: cy - 130,
          color: '#93c5fd',
          strokeWidth: 1.5,
          strokeStyle: 'dashed',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('p1_sub2_bg'),
          type: 'rect',
          x: cx + 430,
          y: cy - 148,
          width: 170,
          height: 38,
          borderRadius: 10,
          color: '#93c5fd',
          strokeWidth: 1.5,
          fillColor: '#ffffff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('p1_sub2_txt'),
          type: 'text',
          x: cx + 444,
          y: cy - 136,
          content: 'Voice-to-Diagram Flow',
          fontSize: 11,
          color: '#1e40af',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Pillar 1 Sticky Note
        els.push({
          id: uid('p1_sticky'),
          type: 'sticky',
          x: cx + 240,
          y: cy - 350,
          width: 195,
          height: 140,
          content: 'Contextual layout recommendations based on rough sketches and wireframe tokens.',
          color: '#0369a1',
          fillColor: '#bae6fd',
          fontSize: 12,
          fontFamily: 'Inter, sans-serif',
          strokeWidth: 1,
          businessTag: 'idea',
          author: 'AI Research',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // ==========================================
        // PILLAR 2: Top-Left (Realtime Engine - Emerald)
        // ==========================================
        els.push({
          id: uid('p2_line'),
          type: 'arrow',
          x: cx - 70,
          y: cy - 70,
          x2: cx - 180,
          y2: cy - 150,
          color: '#059669',
          strokeWidth: 3,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('p2_hub_bg'),
          type: 'rect',
          x: cx - 390,
          y: cy - 180,
          width: 210,
          height: 54,
          borderRadius: 16,
          color: '#10b981',
          strokeWidth: 2,
          fillColor: '#ecfdf5',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('p2_hub_t'),
          type: 'text',
          x: cx - 370,
          y: cy - 162,
          content: '⚡ Realtime Engine',
          fontSize: 14,
          color: '#065f46',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Pillar 2 Sub-branches
        els.push({
          id: uid('p2_sub1_line'),
          type: 'line',
          x: cx - 390,
          y: cy - 165,
          x2: cx - 440,
          y2: cy - 200,
          color: '#6ee7b7',
          strokeWidth: 1.5,
          strokeStyle: 'dashed',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('p2_sub1_bg'),
          type: 'rect',
          x: cx - 610,
          y: cy - 220,
          width: 170,
          height: 38,
          borderRadius: 10,
          color: '#6ee7b7',
          strokeWidth: 1.5,
          fillColor: '#ffffff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('p2_sub1_txt'),
          type: 'text',
          x: cx - 594,
          y: cy - 208,
          content: '<25ms CRDT Sync',
          fontSize: 11,
          color: '#065f46',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        els.push({
          id: uid('p2_sub2_line'),
          type: 'line',
          x: cx - 390,
          y: cy - 140,
          x2: cx - 440,
          y2: cy - 130,
          color: '#6ee7b7',
          strokeWidth: 1.5,
          strokeStyle: 'dashed',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('p2_sub2_bg'),
          type: 'rect',
          x: cx - 610,
          y: cy - 148,
          width: 170,
          height: 38,
          borderRadius: 10,
          color: '#6ee7b7',
          strokeWidth: 1.5,
          fillColor: '#ffffff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('p2_sub2_txt'),
          type: 'text',
          x: cx - 594,
          y: cy - 136,
          content: 'Local-First Storage',
          fontSize: 11,
          color: '#065f46',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Pillar 2 Sticky Note
        els.push({
          id: uid('p2_sticky'),
          type: 'sticky',
          x: cx - 470,
          y: cy - 350,
          width: 195,
          height: 140,
          content: 'Lossless offline caching with automatic multi-peer reconciliation upon reconnect.',
          color: '#15803d',
          fillColor: '#bbf7d0',
          fontSize: 12,
          fontFamily: 'Inter, sans-serif',
          strokeWidth: 1,
          businessTag: 'approved',
          author: 'Core Engine',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // ==========================================
        // PILLAR 3: Bottom-Left (Enterprise & Security - Rose)
        // ==========================================
        els.push({
          id: uid('p3_line'),
          type: 'arrow',
          x: cx - 70,
          y: cy + 70,
          x2: cx - 180,
          y2: cy + 150,
          color: '#e11d48',
          strokeWidth: 3,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('p3_hub_bg'),
          type: 'rect',
          x: cx - 390,
          y: cy + 130,
          width: 210,
          height: 54,
          borderRadius: 16,
          color: '#f43f5e',
          strokeWidth: 2,
          fillColor: '#fff1f2',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('p3_hub_t'),
          type: 'text',
          x: cx - 370,
          y: cy + 148,
          content: '🛡️ Enterprise & Trust',
          fontSize: 14,
          color: '#9f1239',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Pillar 3 Sub-branches
        els.push({
          id: uid('p3_sub1_line'),
          type: 'line',
          x: cx - 390,
          y: cy + 150,
          x2: cx - 440,
          y2: cy + 185,
          color: '#fda4af',
          strokeWidth: 1.5,
          strokeStyle: 'dashed',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('p3_sub1_bg'),
          type: 'rect',
          x: cx - 610,
          y: cy + 168,
          width: 170,
          height: 38,
          borderRadius: 10,
          color: '#fda4af',
          strokeWidth: 1.5,
          fillColor: '#ffffff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('p3_sub1_txt'),
          type: 'text',
          x: cx - 594,
          y: cy + 180,
          content: 'Role-Based Access',
          fontSize: 11,
          color: '#9f1239',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        els.push({
          id: uid('p3_sub2_line'),
          type: 'line',
          x: cx - 390,
          y: cy + 175,
          x2: cx - 440,
          y2: cy + 240,
          color: '#fda4af',
          strokeWidth: 1.5,
          strokeStyle: 'dashed',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('p3_sub2_bg'),
          type: 'rect',
          x: cx - 610,
          y: cy + 224,
          width: 170,
          height: 38,
          borderRadius: 10,
          color: '#fda4af',
          strokeWidth: 1.5,
          fillColor: '#ffffff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('p3_sub2_txt'),
          type: 'text',
          x: cx - 594,
          y: cy + 236,
          content: 'Element Protection 🛡️',
          fontSize: 11,
          color: '#9f1239',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Pillar 3 Sticky Note
        els.push({
          id: uid('p3_sticky'),
          type: 'sticky',
          x: cx - 470,
          y: cy + 295,
          width: 195,
          height: 140,
          content: 'Fine-grained element locking and session watermarking for confidential board reviews.',
          color: '#be123c',
          fillColor: '#fecdd3',
          fontSize: 12,
          fontFamily: 'Inter, sans-serif',
          strokeWidth: 1,
          businessTag: 'in_review',
          author: 'Security Team',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // ==========================================
        // PILLAR 4: Bottom-Right (Growth & Sharing - Amber)
        // ==========================================
        els.push({
          id: uid('p4_line'),
          type: 'arrow',
          x: cx + 70,
          y: cy + 70,
          x2: cx + 180,
          y2: cy + 150,
          color: '#d97706',
          strokeWidth: 3,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('p4_hub_bg'),
          type: 'rect',
          x: cx + 180,
          y: cy + 130,
          width: 200,
          height: 54,
          borderRadius: 16,
          color: '#f59e0b',
          strokeWidth: 2,
          fillColor: '#fffbeb',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('p4_hub_t'),
          type: 'text',
          x: cx + 198,
          y: cy + 148,
          content: '🚀 Growth & Sharing',
          fontSize: 14,
          color: '#92400e',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Pillar 4 Sub-branches
        els.push({
          id: uid('p4_sub1_line'),
          type: 'line',
          x: cx + 380,
          y: cy + 150,
          x2: cx + 430,
          y2: cy + 185,
          color: '#fde68a',
          strokeWidth: 1.5,
          strokeStyle: 'dashed',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('p4_sub1_bg'),
          type: 'rect',
          x: cx + 430,
          y: cy + 168,
          width: 170,
          height: 38,
          borderRadius: 10,
          color: '#fde68a',
          strokeWidth: 1.5,
          fillColor: '#ffffff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('p4_sub1_txt'),
          type: 'text',
          x: cx + 444,
          y: cy + 180,
          content: '1-Click Guest Invites',
          fontSize: 11,
          color: '#92400e',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        els.push({
          id: uid('p4_sub2_line'),
          type: 'line',
          x: cx + 380,
          y: cy + 175,
          x2: cx + 430,
          y2: cy + 240,
          color: '#fde68a',
          strokeWidth: 1.5,
          strokeStyle: 'dashed',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('p4_sub2_bg'),
          type: 'rect',
          x: cx + 430,
          y: cy + 224,
          width: 170,
          height: 38,
          borderRadius: 10,
          color: '#fde68a',
          strokeWidth: 1.5,
          fillColor: '#ffffff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('p4_sub2_txt'),
          type: 'text',
          x: cx + 444,
          y: cy + 236,
          content: 'Interactive SVG Export',
          fontSize: 11,
          color: '#92400e',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // Pillar 4 Sticky Note
        els.push({
          id: uid('p4_sticky'),
          type: 'sticky',
          x: cx + 240,
          y: cy + 295,
          width: 195,
          height: 140,
          content: 'Community canvas marketplace with upvoting and instant template cloning.',
          color: '#854d0e',
          fillColor: '#fef08a',
          fontSize: 12,
          fontFamily: 'Inter, sans-serif',
          strokeWidth: 1,
          businessTag: 'idea',
          author: 'Growth Lead',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });

        // ==========================================
        // CROSS-PILLAR SYNERGY LINK
        // ==========================================
        els.push({
          id: uid('synergy_link'),
          type: 'line',
          x: cx - 440,
          y: cy - 130,
          x2: cx + 430,
          y2: cy + 185,
          color: '#cbd5e1',
          strokeWidth: 1.5,
          strokeStyle: 'dotted',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('synergy_badge_bg'),
          type: 'rect',
          x: cx - 80,
          y: cy + 115,
          width: 160,
          height: 24,
          borderRadius: 12,
          color: '#e2e8f0',
          strokeWidth: 1,
          fillColor: '#ffffff',
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
        });
        els.push({
          id: uid('synergy_badge_txt'),
          type: 'text',
          x: cx - 72,
          y: cy + 120,
          content: '⚡ Offline-Ready Collaboration',
          fontSize: 9,
          color: '#64748b',
          strokeWidth: 1,
          zOrder: nextZ(),
          createdBy: origin,
          createdAt: now,
          updatedAt: now,
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
