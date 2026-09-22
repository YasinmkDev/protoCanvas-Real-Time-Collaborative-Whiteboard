import React, { useState, useEffect } from 'react';
import * as Y from 'yjs';
import { PermissionRequest, WhiteboardElement } from '../../types';
import {
  getAllPermissionRequests,
  updatePermissionRequestStatus,
  grantEditPermission,
} from '../../lib/yjsSchema';
import { Shield, ShieldAlert, Check, X, Bell, Lock, UserCheck } from 'lucide-react';

interface PermissionManagerProps {
  doc: Y.Doc;
  currentUserId: string;
  currentUserName: string;
  selectedElements: WhiteboardElement[];
  onRequestPermission: (element: WhiteboardElement) => void;
  canEditSelected: boolean;
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({
  doc,
  currentUserId,
  currentUserName,
  selectedElements,
  onRequestPermission,
  canEditSelected,
}) => {
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronize permission requests from shared Yjs doc
  useEffect(() => {
    const updateRequests = () => {
      setRequests(getAllPermissionRequests(doc));
    };

    updateRequests();
    const requestsMap = doc.getMap('permission_requests');
    requestsMap.observeDeep(updateRequests);

    return () => {
      requestsMap.unobserveDeep(updateRequests);
    };
  }, [doc]);

  // Track granted requests for the current user to display success toasts
  useEffect(() => {
    const myGranted = requests.filter(
      (r) =>
        r.requesterId === currentUserId &&
        r.status === 'granted' &&
        r.respondedAt &&
        Date.now() - r.respondedAt < 8000
    );
    if (myGranted.length > 0) {
      const latest = myGranted[0];
      setToastMessage(
        `🎉 ${latest.ownerName} granted you edit access for their ${latest.elementType || 'drawing'}!`
      );
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [requests, currentUserId]);

  // Incoming requests waiting for current user's approval
  const pendingRequestsForMe = requests.filter(
    (r) => r.ownerId === currentUserId && r.status === 'pending'
  );

  const handleGrant = (req: PermissionRequest) => {
    // 1. Grant editor permission on the element
    grantEditPermission(doc, req.elementId, req.requesterId, currentUserId);
    // 2. Mark request as granted
    updatePermissionRequestStatus(doc, req.id, 'granted', currentUserId);
  };

  const handleDeny = (req: PermissionRequest) => {
    updatePermissionRequestStatus(doc, req.id, 'denied', currentUserId);
  };

  // Check if single selected element belongs to someone else and user doesn't have permission
  const selectedProtectedOther =
    selectedElements.length === 1 &&
    selectedElements[0].createdBy !== currentUserId &&
    !canEditSelected;

  const otherElement = selectedProtectedOther ? selectedElements[0] : null;
  const existingPendingRequest = otherElement
    ? requests.find(
        (r) =>
          r.elementId === otherElement.id &&
          r.requesterId === currentUserId &&
          r.status === 'pending'
      )
    : null;

  return (
    <>
      {/* 1. Incoming Permission Requests Toast (Floating Top-Center for Drawing Owner) */}
      {pendingRequestsForMe.length > 0 && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-md px-4 pointer-events-auto">
          {pendingRequestsForMe.map((req) => (
            <div
              key={req.id}
              className="p-4 rounded-2xl bg-white border border-[#8169ff]/30 shadow-2xl flex items-start gap-3.5 animate-in fade-in slide-in-from-top-4 duration-300"
              style={{
                boxShadow: '0 12px 36px -4px rgba(129, 105, 255, 0.25)',
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 font-bold text-xs"
                style={{ backgroundColor: req.requesterColor || '#8169ff' }}
              >
                {req.requesterName ? req.requesterName.slice(0, 2).toUpperCase() : 'PE'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#8169ff]">
                  <Bell size={13} />
                  <span>Edit Permission Request</span>
                </div>
                <p className="text-xs text-gray-800 font-semibold mt-0.5">
                  <span className="text-[#181818] font-bold">{req.requesterName}</span> wants to edit your{' '}
                  <span className="underline decoration-[#8169ff] font-bold">{req.elementType || 'drawing'}</span>
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Grant access to allow moving, editing, or styling this element.
                </p>

                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    type="button"
                    onClick={() => handleGrant(req)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#8169ff] hover:bg-[#6d4ff0] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Check size={13} />
                    <span>Grant Edit Access</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeny(req)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <X size={13} />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Success Toast when permission is granted to current user */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-3.5 rounded-xl bg-emerald-600 text-white shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in duration-200">
          <UserCheck size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 3. Floating Banner when selecting someone else's protected drawing */}
      {selectedProtectedOther && otherElement && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border border-[#8169ff]/30 shadow-xl rounded-2xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Lock size={16} />
          </div>
          <div className="text-xs">
            <p className="font-bold text-gray-900">
              Protected Drawing by {otherElement.createdByName || 'Collaborator'}
            </p>
            <p className="text-gray-500 text-[11px]">
              {existingPendingRequest
                ? '⏳ Permission requested! Awaiting owner confirmation...'
                : 'You need permission from the author to edit or move this drawing.'}
            </p>
          </div>
          {!existingPendingRequest && (
            <button
              type="button"
              onClick={() => onRequestPermission(otherElement)}
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8169ff] hover:bg-[#6d4ff0] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Shield size={13} />
              <span>Request Permission</span>
            </button>
          )}
        </div>
      )}
    </>
  );
};
