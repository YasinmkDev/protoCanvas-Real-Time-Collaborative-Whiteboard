# protoCanvas — Real-Time Collaborative Whiteboard

A production-ready, infinite-canvas collaborative whiteboard built with **React 19**, **Yjs CRDTs**, and **Supabase Realtime**. Multiple users draw, create shapes, add text, and manipulate elements simultaneously with zero merge conflicts.

![protoCanvas Demo](https://img.shields.io/badge/status-active-brightgreen) ![React](https://img.shields.io/badge/React-19-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6) ![Yjs](https://img.shields.io/badge/Yjs-CRDT-orange) ![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ecf8e) ![Vite](https://img.shields.io/badge/Vite-6.0-646cff) ![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38bdf8)

---

## ✨ Features

| Category | Capabilities |
|---|---|
| **Drawing Tools** | Pen (smoothed), Highlighter, Line, Arrow, Rectangle, Circle, Diamond, Star |
| **Content** | Rich text editing, Sticky notes, Image import & placement |
| **Collaboration** | Live cursors with names/colors, Presence avatars, Per-user undo/redo |
| **Canvas** | Infinite pan/zoom, Minimap navigation, Grid & background themes |
| **Selection** | Multi-select, Resize/rotate handles, Duplicate, Delete, Context menu |
| **Export** | High-res PNG, Vector SVG with precise bounds |
| **Templates** | Pre-built board templates (Kanban, Flowchart, Wireframe, Retrospective) |
| **Management** | Board lobby (create/join), Permission manager, Board settings, History sidebar |
| **Auth** | Email/password, Guest login, User profiles with roles |

---

## 🏗 Architecture: 3-Layer State Model

```
┌────────────────────────────────────────────────────────────────┐
│  LAYER 1: EPHEMERAL (never persisted)                          │
│  • Live cursor positions (sub-50ms latency)                    │
│  • In-progress drag & ghost selections                         │
│  • Transport: Yjs Awareness → Supabase Realtime Broadcast      │
├────────────────────────────────────────────────────────────────┤
│  LAYER 2: COMMITTED (synced via CRDT)                          │
│  • Shapes, strokes, lines, arrows, text, sticky notes, images  │
│  • Yjs Y.Map<elementId, Y.Map<properties>>                     │
│  • Transport: SupabaseProvider → Realtime Broadcast (<100ms)   │
├────────────────────────────────────────────────────────────────┤
│  LAYER 3: PERSISTED (source of truth)                          │
│  • Yjs binary snapshots (Y.encodeStateAsUpdate)                │
│  • Stored in Supabase Postgres → yjs_documents.state (BYTEA)   │
│  • Managed automatically by SupabasePersistence                │
└────────────────────────────────────────────────────────────────┘
```

**Why Yjs?** Mathematically proven conflict-free convergence. Every edit is an operation that merges automatically—no locking, no last-write-wins, no merge conflicts ever.

---

## 🛠 Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React 19 + TypeScript + Vite 6 | Type safety, rapid HMR, modern component patterns |
| **Canvas** | Raw HTML5 Canvas 2D API | Zero library lock-in, 60 FPS rendering, full transform control |
| **CRDT Engine** | Yjs (`Y.Doc`, `Y.Map`, `Y.UndoManager`) | Battle-tested, offline-first, state-vector sync |
| **Realtime** | `@supabase-labs/y-supabase` (SupabaseProvider) | Official provider: awareness + persistence in one package |
| **Backend** | Supabase (Postgres + Realtime + Edge Functions) | Serverless, durable BYTEA storage, no custom WebSocket server |
| **Styling** | Tailwind CSS 4 + Custom design system | Electric Violet (`#8169ff`) theme, responsive, dark-mode ready |
| **Export** | Canvas → PNG/SVG via `exportUtils.ts` | Vector-perfect SVG, high-DPI PNG |

---

## 📁 Project Structure

```
src/
├── App.tsx                    # App shell, routing, providers
├── main.tsx                   # React bootstrap
├── index.css                  # Global styles, Tailwind, CSS variables
├── types.ts                   # 200+ lines of shared TypeScript types
│
├── components/
│   ├── Canvas/                # Core canvas & rendering
│   │   ├── Canvas.tsx         # Main canvas: viewport, selection, interaction
│   │   ├── ElementRenderer.ts # Rendering engine for all element types
│   │   ├── CanvasSettingsBar.tsx
│   │   ├── CursorLayer.tsx    # Collaborator cursors
│   │   ├── Minimap.tsx
│   │   └── CanvasContextMenu.tsx
│   │
│   ├── Toolbar/               # Tool selection & properties
│   │   ├── Toolbar.tsx
│   │   ├── ToolButton.tsx
│   │   └── PropertiesBar.tsx  # Color, stroke, opacity, font controls
│   │
│   ├── BoardLobby/            # Board management
│   │   ├── CreateBoard.tsx
│   │   ├── JoinBoard.tsx
│   │   └── LobbyModal.tsx
│   │
│   ├── Presence/              # Collaboration UI
│   │   └── ParticipantList.tsx
│   │
│   ├── Export/                # Export to PNG/SVG
│   ├── Templates/             # Template gallery modal
│   ├── Help/                  # Keyboard shortcuts reference
│   ├── Auth/                  # Register/login modal
│   ├── Settings/              # Supabase config, board settings
│   ├── Permissions/           # Role-based access control
│   ├── Sidebar/               # History sidebar (undo/redo)
│   ├── ImageImport/           # Image upload & placement
│   ├── CollaboratorSimulator/ # Simulated users for testing
│   └── Landing/               # Marketing landing page
│
├── hooks/
│   ├── useYjsDoc.ts           # Yjs doc + SupabaseProvider lifecycle
│   ├── useAwareness.ts        # Presence, cursors, local user profile
│   ├── useUndoRedo.ts         # Per-user undo/redo manager
│   └── useCanvasTools.ts      # Tool state & element mutations
│
└── lib/
    ├── auth.ts                # Supabase Auth helpers
    ├── supabase.ts            # Client, board CRUD, config persistence
    ├── yjsSchema.ts           # Element ↔ Y.Map serialization
    └── exportUtils.ts         # PNG/SVG export, bounds, download
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (or Bun 1.1+)
- Supabase project (free tier works)

### Installation

```bash
# Clone & install
git clone https://github.com/YasinmkDev/protoCanvas.git
cd protoCanvas
npm install        # or: bun install
```

### Configuration

```bash
# Copy env template
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=supabase_anon_key
```

> **No Supabase?** The app works locally with a BroadcastChannel fallback for multi-tab testing. Configure Supabase later via the in-app settings modal (⚙️).

### Database Setup

1. Open **Supabase Dashboard → SQL Editor**
2. Run `supabase/migrations/0001_init.sql`
3. Enable **Realtime** for tables: `boards`, `yjs_documents` (Dashboard → Realtime → Replication)

### Development

```bash
npm run dev        # or: bun dev
# Opens http://localhost:5173
```

### Build & Preview

```bash
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
```

---

## ⌨ Keyboard Shortcuts

| Key | Action |
|---|---|
| `V` | Select tool |
| `P` / `B` | Pen / Brush |
| `H` | Highlighter |
| `L` | Line |
| `R` | Rectangle |
| `O` | Circle / Ellipse |
| `D` | Diamond |
| `S` | Star |
| `A` | Arrow |
| `T` | Text |
| `E` | Eraser (object) |
| `I` | Image import |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + D` | Duplicate selection |
| `Delete` / `Backspace` | Delete selection |
| `Ctrl/Cmd + E` | Export modal |
| `Space + Drag` | Pan canvas |
| `Wheel` | Zoom at cursor |
| `?` | Show shortcuts help |

---

## 🔐 Authentication & Roles

| Role | Permissions |
|---|---|
| **Owner** | Full control, delete board, manage members |
| **Editor** | Create/edit/delete elements, export |
| **Viewer** | Read-only, pan/zoom, follow cursors |

Roles are enforced via Supabase RLS policies (see migration) and the in-app **PermissionManager**.

---

## 📤 Deployment

### Vercel (Recommended)
```bash
vercel --prod
```
Set environment variables in Vercel dashboard.

### Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
```

---

## 🧪 Testing Collaboration Locally

1. Open `http://localhost:5173` in **two browser tabs** (or incognito)
2. Create a board in Tab 1 → copy the board code
3. Join with the code in Tab 2
4. Draw in both tabs → watch cursors & elements sync instantly

For simulated collaborators, click the **👥 Collaborator Simulator** button in the toolbar.

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint + TypeScript check |
| `npm run clean` | Remove dist/ and node_modules/ |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit with conventional messages: `git commit -m "feat: add amazing feature"`
4. Push: `git push origin feat/amazing-feature`
5. Open a Pull Request

**Code style:** TypeScript strict, ESLint + Prettier, functional components with hooks.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **[Yjs](https://github.com/yjs/yjs)** — The CRDT engine that makes this possible
- **[Supabase](https://supabase.com)** — Backend & realtime infrastructure
- **[Tailwind CSS](https://tailwindcss.com)** — Utility-first styling
- **[Lucide React](https://lucide.dev)** — Beautiful icons
- **Motion** — Smooth animations

---

**Built with ❤️ for real-time collaboration.**  
If you find this useful, ⭐ the repo and share it!