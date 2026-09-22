import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useYjsDoc } from './hooks/useYjsDoc';
import { useAwareness } from './hooks/useAwareness';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useCanvasTools } from './hooks/useCanvasTools';
import { Canvas } from './components/Canvas/Canvas';
import { Toolbar } from './components/Toolbar/Toolbar';
import { PropertiesBar } from './components/Toolbar/PropertiesBar';
import { ParticipantList } from './components/Presence/ParticipantList';
import { LobbyModal } from './components/BoardLobby/LobbyModal';
import { ExportMenu } from './components/Export/ExportMenu';
import { BoardSettingsModal } from './components/Settings/BoardSettingsModal';
import { PermissionManager } from './components/Permissions/PermissionManager';
import { ImageImportModal } from './components/ImageImport/ImageImportModal';
import { KeyboardHelpModal } from './components/Help/KeyboardHelpModal';
import { CollaboratorSimulator } from './components/CollaboratorSimulator/CollaboratorSimulator';
import { LandingPage } from './components/Landing/LandingPage';
import { RegisterModal } from './components/Auth/RegisterModal';
import { CanvasSettingsBar } from './components/Canvas/CanvasSettingsBar';
import { CanvasContextMenu } from './components/Canvas/CanvasContextMenu';
import { CanvasHistorySidebar } from './components/Sidebar/CanvasHistorySidebar';
import { hitTestElement } from './components/Canvas/ElementRenderer';
import { TemplatesModal } from './components/Templates/TemplatesModal';
import { generateBoardCode, saveLocalBoard } from './lib/supabase';
import { getCurrentUser, UserProfile } from './lib/auth';
import { addPermissionRequest } from './lib/yjsSchema';
import { UserPresence, CanvasSettings, WhiteboardElement } from './types';
import {
  Download,
  Share2,
  HelpCircle,
  ChevronDown,
  Home,
  User,
  History,
} from 'lucide-react';

function getInitialBoardCode(): string {
  const urlParams = new URLSearchParams(window.location.search);
  const boardParam = urlParams.get('board');
  if (boardParam && boardParam.trim()) {
    return boardParam.trim().toUpperCase();
  }

  const pathMatch = window.location.pathname.match(/\/board\/([a-zA-Z0-9]+)/);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1].toUpperCase();
  }

  return generateBoardCode();
}

function getInitialView(): 'landing' | 'canvas' {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('view') === 'canvas') {
    return 'canvas';
  }
  return 'landing';
}

export default function App() {
  const [view, setView] = useState<'landing' | 'canvas'>(getInitialView);
  const [boardCode, setBoardCode] = useState<string>(getInitialBoardCode);
  const [userProfile, setUserProfile] = useState<UserProfile>(getCurrentUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');

  // Canvas View & Grid Customization settings
  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>(() => {
    try {
      const stored = localStorage.getItem('protocanvas_settings');
      if (stored) return JSON.parse(stored);
    } catch (err) {
      console.error(err);
    }
    return {
      gridStyle: 'dots',
      snapToGrid: false,
      gridSize: 20,
      bgTone: 'white',
    };
  });

  // Save settings change
  const handleUpdateSettings = (newSettings: CanvasSettings) => {
    setCanvasSettings(newSettings);
    try {
      localStorage.setItem('protocanvas_settings', JSON.stringify(newSettings));
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Setup Yjs Doc and Supabase Realtime Provider (only connect when in canvas view)
  const {
    doc,
    provider,
    status,
    isSupabaseConnected,
    elements,
    reconnect,
    latencyMs,
  } = useYjsDoc(view === 'canvas' ? boardCode : null);

  // 2. Setup Awareness (Presence, Cursors)
  const {
    currentUser,
    collaborators: realCollaborators,
    updateCursor,
    updateSelection,
    updateProfile,
  } = useAwareness(provider, boardCode);

  // Simulated Collaborators (for instant multiplayer testing)
  const [isSimulatorActive, setIsSimulatorActive] = useState(false);
  const [simCollaborators, setSimCollaborators] = useState<UserPresence[]>([]);

  const combinedCollaborators = useMemo(() => {
    return [...realCollaborators, ...simCollaborators];
  }, [realCollaborators, simCollaborators]);

  // 3. Setup Per-User Undo/Redo (FR-5)
  const { undo, redo, canUndo, canRedo } = useUndoRedo(doc, currentUser.id);

  // 4. Setup Canvas Tools & Interactions
  const {
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
    draftElement,
    viewport,
    setViewport,
    isPanning,
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
    handleSelectIds,
    hoveredId,
    hoveredHandle,
  } = useCanvasTools({
    doc,
    userOrigin: currentUser.id,
    elements,
    onCursorMove: (pos, tool) => updateCursor(pos, tool || activeTool),
    onSelectionChange: updateSelection,
    undo,
    redo,
    settings: canvasSettings,
  });

  // Sync board in local history with rich content metadata
  useEffect(() => {
    let preview = '';
    const firstTextOrSticky = elements.find(
      (e) => (e.type === 'text' || e.type === 'sticky') && (e as any).content && (e as any).content.trim()
    );
    if (firstTextOrSticky && (firstTextOrSticky as any).content) {
      preview = (firstTextOrSticky as any).content.trim().slice(0, 80);
    }

    const stickies = elements.filter((e) => e.type === 'sticky').length;
    const shapes = elements.filter((e) =>
      ['rect', 'circle', 'diamond', 'star', 'arrow', 'line'].includes(e.type)
    ).length;
    const images = elements.filter((e) => e.type === 'image').length;
    const drawings = elements.filter((e) => ['pen', 'highlighter'].includes(e.type)).length;
    const texts = elements.filter((e) => e.type === 'text').length;

    saveLocalBoard({
      id: boardCode,
      last_active_at: new Date().toISOString(),
      elementCount: elements.length,
      previewSnippet: preview,
      elementsSummary: {
        stickies,
        shapes,
        images,
        drawings,
        texts,
      },
    });
  }, [boardCode, elements]);

  // Selected elements array for properties bar
  const selectedElements = useMemo(() => {
    return elements.filter((e) => selectedIds.includes(e.id));
  }, [elements, selectedIds]);

  // Modals state
  const [isLobbyOpen, setIsLobbyOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isImageImportOpen, setIsImageImportOpen] = useState(false);

  // Business Right-Click Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    canvasX: number;
    canvasY: number;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    canvasX: 0,
    canvasY: 0,
  });

  const handleCanvasContextMenu = useCallback(
    (
      _e: React.MouseEvent<HTMLElement>,
      coords: { x: number; y: number; canvasX: number; canvasY: number }
    ) => {
      // Hit test elements from top to bottom
      const hit = [...elements]
        .reverse()
        .find((el) => hitTestElement(el, { x: coords.canvasX, y: coords.canvasY }));

      if (hit) {
        // If right-clicked element is not already selected, select it or its group
        if (!selectedIds.includes(hit.id)) {
          if (hit.groupId) {
            const groupMembers = elements
              .filter((el) => el.groupId === hit.groupId)
              .map((el) => el.id);
            handleSelectIds(groupMembers);
          } else {
            handleSelectIds([hit.id]);
          }
        }
      }

      setContextMenu({
        isOpen: true,
        x: coords.x,
        y: coords.y,
        canvasX: coords.canvasX,
        canvasY: coords.canvasY,
      });
    },
    [elements, selectedIds, handleSelectIds]
  );

  // Send edit permission request to drawing creator
  const handleRequestPermission = useCallback(
    (targetElement: WhiteboardElement) => {
      const reqId = 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      addPermissionRequest(
        doc,
        {
          id: reqId,
          elementId: targetElement.id,
          elementType: targetElement.type,
          requesterId: currentUser.id,
          requesterName: currentUser.name || userProfile.name,
          requesterColor: currentUser.color || userProfile.color || '#8169ff',
          ownerId: targetElement.createdBy,
          ownerName: targetElement.createdByName || 'Collaborator',
          status: 'pending',
          createdAt: Date.now(),
        },
        currentUser.id
      );
    },
    [doc, currentUser, userProfile]
  );

  // Navigate to Canvas
  const handleLaunchCanvas = useCallback((targetRoomCode?: string) => {
    const code = targetRoomCode ? targetRoomCode.toUpperCase() : boardCode;
    setBoardCode(code);
    setView('canvas');
    const newUrl = `${window.location.pathname}?view=canvas&board=${code}`;
    window.history.replaceState({}, '', newUrl);
    window.scrollTo(0, 0);
  }, [boardCode]);

  // Navigate to Landing
  const handleReturnToLanding = useCallback(() => {
    setView('landing');
    const newUrl = `${window.location.pathname}?view=landing`;
    window.history.replaceState({}, '', newUrl);
  }, []);

  // Switch boards handler
  const handleSelectBoard = useCallback((newCode: string) => {
    const clean = newCode.toUpperCase();
    setBoardCode(clean);
    const newUrl = `${window.location.pathname}?view=canvas&board=${clean}`;
    window.history.replaceState({}, '', newUrl);
  }, []);

  // Handle Auth completion
  const handleAuthSuccess = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
    updateProfile(profile.name, profile.color);
    handleLaunchCanvas();
  }, [updateProfile, handleLaunchCanvas]);

  // Open Auth modal
  const handleOpenAuth = useCallback((mode: 'register' | 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  // Global shortcut for export (Ctrl+E) and Help (?) only while in canvas mode
  useEffect(() => {
    if (view !== 'canvas') return;

    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement | null;
      const activeTag = (activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeElement?.isContentEditable) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        setIsExportOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        setIsHistoryOpen((prev) => !prev);
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsHelpOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [view]);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* 1. View Switcher: Landing Page vs Fullscreen Collaborative Canvas */}
      {view === 'landing' ? (
        <LandingPage
          currentUser={userProfile}
          onOpenAuth={handleOpenAuth}
          onLaunchCanvas={handleLaunchCanvas}
        />
      ) : (
        <div className="relative w-screen h-screen overflow-hidden bg-white select-none">
          {/* Top Canvas Navigation Bar */}
          <header
            id="top-nav"
            className="fixed top-0 left-0 right-0 h-16 z-30 flex items-center justify-between px-4 sm:px-6 bg-white/95 backdrop-blur-md border-b border-[#e5e5ea]"
          >
            {/* Left Cluster: Return Home Button + Logo + Room Pill */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Return to Landing Page Button */}
              <button
                type="button"
                id="btn-return-home"
                onClick={handleReturnToLanding}
                className="p-2 rounded-xl text-gray-500 hover:text-[#8169ff] hover:bg-[#f3f1ff] transition-all"
                title="Return to Home Landing Page"
              >
                <Home size={18} />
              </button>

              {/* Violet 'P' Studio Brand Icon */}
              <div
                className="flex items-center gap-2 select-none cursor-pointer group"
                onClick={handleReturnToLanding}
                title="ProtoCanvas Studio Home"
              >
                <div className="w-8 h-8 rounded-xl bg-[#8169ff] group-hover:bg-[#6d4ff0] flex items-center justify-center text-white font-display font-extrabold text-lg shadow-xs transition-colors">
                  P
                </div>
                <span className="font-display font-bold text-base tracking-tight text-[#181818] hidden sm:inline">
                  ProtoCanvas
                </span>
              </div>

              {/* Current Board Code Dropdown Button */}
              <button
                type="button"
                id="btn-room-selector"
                onClick={() => setIsLobbyOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100/80 hover:bg-[#f3f1ff] hover:text-[#8169ff] text-xs font-mono font-bold text-gray-700 transition-all border border-transparent hover:border-[#8169ff]/20 cursor-pointer"
                title="Switch board or view rooms"
              >
                <span>Room: {boardCode}</span>
                <ChevronDown size={14} className="opacity-60" />
              </button>

              {/* Previous Whiteboards History Drawer Button */}
              <button
                type="button"
                id="btn-open-canvas-history"
                onClick={() => setIsHistoryOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e5e5ea] hover:bg-[#f3f1ff] hover:text-[#8169ff] hover:border-[#8169ff]/30 text-xs font-semibold text-[#181818] transition-all cursor-pointer"
                title="Canvas History (saved & previous whiteboards)"
              >
                <History size={14} className="text-[#8169ff]" />
                <span className="hidden sm:inline">History</span>
              </button>
            </div>

            {/* Center: Hand-drawn script badge accent */}
            <div className="hidden lg:flex items-center gap-2">
              <span className="font-handwriting text-lg text-[#8169ff] -rotate-3 select-none">
                CRDT Collaboration Live
              </span>
              <span className="text-[11px] text-[#999999] font-medium select-none">
                · {elements.length} {elements.length === 1 ? 'element' : 'elements'}
              </span>
            </div>

            {/* Right Cluster: Export, Share, Shortcuts, Participants */}
            <div className="flex items-center gap-2">
              {/* User Profile Pill with Proper Guest ID / Account Indicator */}
              <button
                type="button"
                id="btn-user-profile-header"
                onClick={() => handleOpenAuth('register')}
                className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition-colors border border-[#e5e5ea]"
                title={
                  userProfile.isRegistered
                    ? `Logged in as ${userProfile.name} (${userProfile.role}). Click to edit profile.`
                    : `Assigned ID: ${userProfile.name}. Click to claim username or sign in.`
                }
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: userProfile.color }}
                >
                  {userProfile.avatarInitials}
                </div>
                <span className="text-xs font-semibold text-gray-700 max-w-[100px] truncate">
                  {userProfile.name}
                </span>
                {!userProfile.isRegistered && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium border border-gray-200">
                    Guest
                  </span>
                )}
              </button>

              {/* Export Button */}
              <button
                type="button"
                id="btn-open-export"
                onClick={() => setIsExportOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e5e5ea] hover:bg-[#f3f1ff] hover:text-[#8169ff] hover:border-[#8169ff]/30 text-xs font-semibold text-[#181818] transition-all"
                title="Export PNG or SVG (Ctrl+E)"
              >
                <Download size={14} className="text-[#8169ff]" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {/* Share Board Button */}
              <button
                type="button"
                id="btn-open-share"
                onClick={() => setIsLobbyOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8169ff] hover:bg-[#6d4ff0] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                title="Share board URL or switch rooms"
              >
                <Share2 size={13} />
                <span>Share</span>
              </button>

              {/* Help Button */}
              <button
                type="button"
                id="btn-open-help"
                onClick={() => setIsHelpOpen(true)}
                className="p-2 rounded-xl text-gray-400 hover:text-[#8169ff] hover:bg-[#f3f1ff] transition-colors"
                title="Keyboard shortcuts (?)"
              >
                <HelpCircle size={17} />
              </button>

              {/* Vertical Divider */}
              <div className="w-[1px] h-6 bg-[#e5e5ea] mx-1" />

              {/* Participants Cluster & Supabase Status Badge */}
              <ParticipantList
                currentUser={currentUser}
                collaborators={combinedCollaborators}
                status={status}
                isSupabaseConnected={isSupabaseConnected}
                latencyMs={latencyMs}
                onUpdateProfile={updateProfile}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onToggleSimulator={() => setIsSimulatorActive((prev) => !prev)}
                isSimulatorActive={isSimulatorActive}
              />
            </div>
          </header>

          {/* Fullscreen Infinite HTML5 Canvas */}
          <main className="w-full h-full pt-16">
            <Canvas
              doc={doc}
              userOrigin={currentUser.id}
              elements={elements}
              draftElement={draftElement}
              activeTool={activeTool}
              selectedIds={selectedIds}
              hoveredId={hoveredId}
              hoveredHandle={hoveredHandle}
              collaborators={combinedCollaborators}
              viewport={viewport}
              setViewport={setViewport}
              editingTextId={editingTextId}
              setEditingTextId={setEditingTextId}
              laserPoints={laserPoints}
              settings={canvasSettings}
              isPanning={isPanning}
              marqueeRect={marqueeRect}
              onImportImage={insertImageElement}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerLeave}
              onDoubleClick={handleDoubleClick}
              onWheel={handleWheel}
              zoomIn={zoomIn}
              zoomOut={zoomOut}
              resetZoom={resetZoom}
              onContextMenu={handleCanvasContextMenu}
            />
          </main>

          {/* Floating Properties Dock (Top-Left under nav) */}
          <PropertiesBar
            activeTool={activeTool}
            strokeColor={strokeColor}
            onChangeStrokeColor={setStrokeColor}
            strokeWidth={strokeWidth}
            onChangeStrokeWidth={setStrokeWidth}
            fillColor={fillColor}
            onChangeFillColor={setFillColor}
            fontSize={fontSize}
            onChangeFontSize={setFontSize}
            selectedElements={selectedElements}
            allElements={elements}
            doc={doc}
            userOrigin={currentUser.id}
            canGroup={canGroup}
            canUngroup={canUngroup}
            onGroupSelected={groupSelected}
            onUngroupSelected={ungroupSelected}
          />

          {/* Real-time Collaborative Permission Manager Banner & Floating HUD */}
          <PermissionManager
            doc={doc}
            currentUserId={currentUser.id}
            currentUserName={currentUser.name || userProfile.name}
            selectedElements={selectedElements}
            onRequestPermission={handleRequestPermission}
            canEditSelected={canEditSelected}
          />

          {/* Top-Right Canvas Settings & Templates Bar */}
          <CanvasSettingsBar
            settings={canvasSettings}
            onChangeSettings={handleUpdateSettings}
            onOpenTemplates={() => setIsTemplatesOpen(true)}
          />

          {/* Bottom Main Floating Toolbar */}
          <Toolbar
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            onImportImage={() => setIsImageImportOpen(true)}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            hasSelection={selectedIds.length > 0}
            onDeleteSelected={deleteSelected}
            onDuplicateSelected={duplicateSelected}
            canGroup={canGroup}
            canUngroup={canUngroup}
            onGroupSelected={groupSelected}
            onUngroupSelected={ungroupSelected}
          />

          {/* Professional Business Context Menu on Right Click */}
          <CanvasContextMenu
            isOpen={contextMenu.isOpen}
            position={{
              x: contextMenu.x,
              y: contextMenu.y,
              canvasX: contextMenu.canvasX,
              canvasY: contextMenu.canvasY,
            }}
            onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
            selectedElements={selectedElements}
            allElements={elements}
            canGroup={canGroup}
            canUngroup={canUngroup}
            canPaste={hasClipboardContent}
            canEditSelected={canEditSelected}
            onCopy={copySelected}
            onCut={cutSelected}
            onPaste={(pos) => pasteClipboard(pos)}
            onDuplicate={duplicateSelected}
            onDelete={deleteSelected}
            onGroup={groupSelected}
            onUngroup={ungroupSelected}
            onBringToFront={bringToFront}
            onSendToBack={sendToBack}
            onBringForward={bringForward}
            onSendBackward={sendBackward}
            onToggleLock={toggleLockSelected}
            onToggleProtection={toggleProtectionSelected}
            onSelectAll={selectAll}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onResetZoom={resetZoom}
            onInsertShape={(type, pos) => insertShapeAt(type, pos)}
            onUpdateStickyTag={(tag) => updateStickyTag(tag)}
            onEditText={() => {
              if (selectedIds.length === 1) setEditingTextId(selectedIds[0]);
            }}
            onOpenHistory={() => setIsHistoryOpen(true)}
          />

          {/* Canvas History Slide-out Sidebar Drawer */}
          <CanvasHistorySidebar
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            currentBoardCode={boardCode}
            onSelectBoard={handleSelectBoard}
            activeBoardElementCount={elements.length}
          />

          {/* Modals for Whiteboard Canvas */}
          <LobbyModal
            currentBoardCode={boardCode}
            isOpen={isLobbyOpen}
            onClose={() => setIsLobbyOpen(false)}
            onSelectBoard={handleSelectBoard}
            onOpenHistory={() => {
              setIsLobbyOpen(false);
              setIsHistoryOpen(true);
            }}
          />

          <ExportMenu
            elements={elements}
            boardCode={boardCode}
            isOpen={isExportOpen}
            onClose={() => setIsExportOpen(false)}
          />

          {/* Board Governance & Security Dashboard Modal */}
          <BoardSettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            boardCode={boardCode}
            isSupabaseConnected={isSupabaseConnected}
            latencyMs={latencyMs}
            onReconnect={reconnect}
            doc={doc}
            elements={elements}
            userOrigin={currentUser.id}
          />

          {/* High-fidelity Image Import (Files, URLs, Clipboard) */}
          <ImageImportModal
            isOpen={isImageImportOpen}
            onClose={() => setIsImageImportOpen(false)}
            onImport={insertImageElement}
          />

          <KeyboardHelpModal
            isOpen={isHelpOpen}
            onClose={() => setIsHelpOpen(false)}
          />

          {/* Starter Canvas Templates Modal */}
          <TemplatesModal
            isOpen={isTemplatesOpen}
            onClose={() => setIsTemplatesOpen(false)}
            doc={doc}
            userOrigin={currentUser.id}
            viewport={viewport}
          />

          {/* Background Simulated Collaborator Bot */}
          <CollaboratorSimulator
            isActive={isSimulatorActive}
            doc={doc}
            onSimulatedPresence={setSimCollaborators}
          />
        </div>
      )}

      {/* Global Registration / Sign-In Modal */}
      <RegisterModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authMode}
      />
    </div>
  );
}
