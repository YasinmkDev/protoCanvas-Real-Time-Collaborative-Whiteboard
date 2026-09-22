import * as Y from 'yjs';
import { WhiteboardElement, PermissionRequest, BoardPermissionMode } from '../types';

/**
 * Converts a JS WhiteboardElement into a Y.Map representation
 */
export function elementToYMap(element: WhiteboardElement): Y.Map<any> {
  const yMap = new Y.Map<any>();
  Object.entries(element).forEach(([key, val]) => {
    if (val !== undefined) {
      if (key === 'points' && Array.isArray(val)) {
        // Points can be stored as normal array or Y.Array; JSON-serializable array in Y.Map is fast and native
        yMap.set(key, val);
      } else {
        yMap.set(key, val);
      }
    }
  });
  return yMap;
}

/**
 * Converts a Y.Map to a JS WhiteboardElement
 */
export function yMapToElement(yMap: Y.Map<any>): WhiteboardElement | null {
  const obj = yMap.toJSON();
  if (!obj || !obj.id || !obj.type) return null;
  return obj as WhiteboardElement;
}

/**
 * Sets or updates an element inside the doc's elements map
 */
export function setElementInDoc(
  doc: Y.Doc,
  element: WhiteboardElement,
  origin?: any
) {
  doc.transact(() => {
    const elementsMap = doc.getMap<Y.Map<any>>('elements');
    const existing = elementsMap.get(element.id);
    if (existing) {
      Object.entries(element).forEach(([key, val]) => {
        if (val !== undefined) {
          existing.set(key, val);
        }
      });
    } else {
      elementsMap.set(element.id, elementToYMap(element));
    }
  }, origin);
}

/**
 * Removes an element from the doc's elements map
 */
export function deleteElementFromDoc(doc: Y.Doc, elementId: string, origin?: any) {
  doc.transact(() => {
    const elementsMap = doc.getMap<Y.Map<any>>('elements');
    elementsMap.delete(elementId);
  }, origin);
}

/**
 * Batch removes elements
 */
export function deleteElementsFromDoc(doc: Y.Doc, elementIds: string[], origin?: any) {
  doc.transact(() => {
    const elementsMap = doc.getMap<Y.Map<any>>('elements');
    elementIds.forEach((id) => elementsMap.delete(id));
  }, origin);
}

/**
 * Groups multiple elements together by assigning a shared groupId
 */
export function groupElementsInDoc(
  doc: Y.Doc,
  elementIds: string[],
  origin?: any
): string {
  const newGroupId = 'grp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  doc.transact(() => {
    const elementsMap = doc.getMap<Y.Map<any>>('elements');
    elementIds.forEach((id) => {
      const el = elementsMap.get(id);
      if (el) {
        el.set('groupId', newGroupId);
        el.set('updatedAt', Date.now());
      }
    });
  }, origin);
  return newGroupId;
}

/**
 * Ungroups elements by removing their groupId
 */
export function ungroupElementsInDoc(
  doc: Y.Doc,
  elementIds: string[],
  origin?: any
) {
  doc.transact(() => {
    const elementsMap = doc.getMap<Y.Map<any>>('elements');
    elementIds.forEach((id) => {
      const el = elementsMap.get(id);
      if (el) {
        el.delete('groupId');
        el.set('updatedAt', Date.now());
      }
    });
  }, origin);
}

/**
 * Updates properties of an existing element
 */
export function updateElementProps(
  doc: Y.Doc,
  elementId: string,
  props: Partial<WhiteboardElement>,
  origin?: any
) {
  doc.transact(() => {
    const elementsMap = doc.getMap<Y.Map<any>>('elements');
    const el = elementsMap.get(elementId);
    if (el) {
      Object.entries(props).forEach(([key, val]) => {
        if (val !== undefined) {
          el.set(key, val);
        }
      });
      el.set('updatedAt', Date.now());
    }
  }, origin);
}

/**
 * Reads all elements from the doc, sorted by zOrder
 */
export function getAllElements(doc: Y.Doc): WhiteboardElement[] {
  const elementsMap = doc.getMap<Y.Map<any>>('elements');
  const result: WhiteboardElement[] = [];

  elementsMap.forEach((yMap) => {
    const el = yMapToElement(yMap);
    if (el) result.push(el);
  });

  return result.sort((a, b) => a.zOrder - b.zOrder);
}

/**
 * Checks if a user has permission to edit, move, or delete a drawing element
 */
export function canUserEditElement(
  element: WhiteboardElement | null | undefined,
  userId: string,
  boardMode: BoardPermissionMode = 'creator_protected'
): boolean {
  if (!element) return false;
  // If permanently locked via lock toggle, no one can move/edit until unlocked
  if (element.isLocked) return false;

  // Creator always has full editing rights
  if (element.createdBy === userId) return true;

  // If creator explicitly granted permission to this user
  if (element.allowedEditors && element.allowedEditors.includes(userId)) {
    return true;
  }

  // If element is explicitly marked not protected
  if (element.isProtected === false) {
    return true;
  }

  // If board is in open collaboration mode and element is not explicitly protected
  if (boardMode === 'open' && !element.isProtected) {
    return true;
  }

  // Otherwise, creator protection is active and requires permission
  return false;
}

/**
 * Grants edit permission on an element to a specific user
 */
export function grantEditPermission(
  doc: Y.Doc,
  elementId: string,
  userId: string,
  origin?: any
) {
  doc.transact(() => {
    const elementsMap = doc.getMap<Y.Map<any>>('elements');
    const el = elementsMap.get(elementId);
    if (el) {
      const allowed: string[] = el.get('allowedEditors') || [];
      if (!allowed.includes(userId)) {
        el.set('allowedEditors', [...allowed, userId]);
        el.set('updatedAt', Date.now());
      }
    }
  }, origin);
}

/**
 * Revokes edit permission on an element from a specific user
 */
export function revokeEditPermission(
  doc: Y.Doc,
  elementId: string,
  userId: string,
  origin?: any
) {
  doc.transact(() => {
    const elementsMap = doc.getMap<Y.Map<any>>('elements');
    const el = elementsMap.get(elementId);
    if (el) {
      const allowed: string[] = el.get('allowedEditors') || [];
      el.set('allowedEditors', allowed.filter((id) => id !== userId));
      el.set('updatedAt', Date.now());
    }
  }, origin);
}

/**
 * Toggles an element's protection state (creator-only vs open)
 */
export function toggleElementProtection(
  doc: Y.Doc,
  elementId: string,
  isProtected: boolean,
  origin?: any
) {
  doc.transact(() => {
    const elementsMap = doc.getMap<Y.Map<any>>('elements');
    const el = elementsMap.get(elementId);
    if (el) {
      el.set('isProtected', isProtected);
      el.set('updatedAt', Date.now());
    }
  }, origin);
}

/**
 * Adds a new permission request to the shared Yjs requests collection
 */
export function addPermissionRequest(
  doc: Y.Doc,
  request: PermissionRequest,
  origin?: any
) {
  doc.transact(() => {
    const requestsMap = doc.getMap<Y.Map<any>>('permission_requests');
    const yReq = new Y.Map<any>();
    Object.entries(request).forEach(([k, v]) => {
      yReq.set(k, v);
    });
    requestsMap.set(request.id, yReq);
  }, origin);
}

/**
 * Updates a permission request status (granted or denied)
 */
export function updatePermissionRequestStatus(
  doc: Y.Doc,
  requestId: string,
  status: 'granted' | 'denied',
  origin?: any
) {
  doc.transact(() => {
    const requestsMap = doc.getMap<Y.Map<any>>('permission_requests');
    const yReq = requestsMap.get(requestId);
    if (yReq) {
      yReq.set('status', status);
      yReq.set('respondedAt', Date.now());
    }
  }, origin);
}

/**
 * Reads all permission requests from Yjs doc
 */
export function getAllPermissionRequests(doc: Y.Doc): PermissionRequest[] {
  const requestsMap = doc.getMap<Y.Map<any>>('permission_requests');
  const list: PermissionRequest[] = [];
  requestsMap.forEach((yReq) => {
    const obj = yReq.toJSON();
    if (obj && obj.id) {
      list.push(obj as PermissionRequest);
    }
  });
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

