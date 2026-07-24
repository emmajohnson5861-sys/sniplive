import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, Timestamp,
  arrayUnion, arrayRemove, onSnapshot, increment
} from '@firebase/firestore';

export interface FirestoreUser {
  id: string;
  username?: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: 'SUBSCRIBER' | 'EDITOR' | 'ADMIN';
  isBanned: boolean;
  snippetCount: number;
  storageUsage: number;
  lastActiveAt: Timestamp | null;
  createdAt: Timestamp | null;
}

export interface FirestoreSnippet {
  id: string;
  slug?: string;
  title: string;
  html: string;
  css: string;
  js: string;
  visibility: 'private' | 'unlisted' | 'public';
  allowForking: boolean;
  forkedFromId: string | null;
  viewCount: number;
  likeCount: number;
  ownerId: string;
  ownerName: string | null;
  ownerEmail: string;
  collaborators: string[];
  pendingRequests: string[];
  isReported: boolean;
  reportCount: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface Notification {
  id: string;
  type: 'ACCESS_REQUEST' | 'ACCESS_GRANTED' | 'ACCESS_DENIED' | 'UNBAN_REQUEST';
  fromUserId: string;
  fromUserName: string | null;
  fromUserEmail: string;
  snippetId: string;
  snippetTitle: string;
  read: boolean;
  createdAt: Timestamp | null;
}

export async function sendNotification(data: {
  type: 'ACCESS_REQUEST' | 'ACCESS_GRANTED' | 'ACCESS_DENIED' | 'UNBAN_REQUEST';
  fromUserId: string;
  fromUserName: string | null;
  fromUserEmail: string;
  snippetId?: string;
  snippetTitle?: string;
}) {
  const q = query(collection(db, 'notifications'), 
    where('fromUserId', '==', data.fromUserId),
    where('snippetId', '==', data.snippetId || 'none'),
    where('type', '==', data.type)
  );
  const existing = await getDocs(q);
  if (!existing.empty) return; // already sent

  const notifRef = doc(collection(db, 'notifications'));
  await setDoc(notifRef, {
    ...data,
    snippetId: data.snippetId || 'none',
    snippetTitle: data.snippetTitle || '',
    read: false,
    createdAt: serverTimestamp(),
  });
}

// ─── Users ──────────────────────────────────────────

export async function getUser(uid: string): Promise<FirestoreUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as FirestoreUser;
}

export async function getUserByUsernameOrId(identifier: string): Promise<FirestoreUser | null> {
  // First try by ID
  const snap = await getDoc(doc(db, 'users', identifier));
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as FirestoreUser;
  }
  
  // Then try by username
  const q = query(collection(db, 'users'), where('username', '==', identifier), limit(1));
  const docsSnap = await getDocs(q);
  if (!docsSnap.empty) {
    const docSnap = docsSnap.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as FirestoreUser;
  }
  
  return null;
}

export async function getUsers(options?: { search?: string; page?: number; limitSize?: number }) {
  const { search = '', page = 1, limitSize = 20 } = options || {};
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('createdAt', 'desc'), limit(limitSize));
  const snap = await getDocs(q);

  let all = snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreUser));

  if (search) {
    const lower = search.toLowerCase();
    all = all.filter(u =>
      u.email?.toLowerCase().includes(lower) ||
      u.name?.toLowerCase().includes(lower)
    );
  }

  const start = (page - 1) * limitSize;
  return { users: all.slice(start, start + limitSize), total: all.length };
}

export async function updateUser(uid: string, data: Partial<FirestoreUser>) {
  await updateDoc(doc(db, 'users', uid), data as any);
}

export async function deleteUser(uid: string) {
  const snippetsSnap = await getDocs(query(collection(db, 'snippets'), where('ownerId', '==', uid)));
  const batch = snippetsSnap.docs.map(d => deleteDoc(d.ref));
  await Promise.all(batch);
  await deleteDoc(doc(db, 'users', uid));
}

// ─── Snippets ───────────────────────────────────────

export async function generateUniqueSnippetSlug(userId: string, title: string): Promise<string> {
  const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'snippet';
  let slug = baseSlug;
  const snippetsRef = collection(db, 'snippets');
  let q = query(snippetsRef, where('ownerId', '==', userId), where('slug', '==', slug));
  let snap = await getDocs(q);
  if (snap.empty) return slug;

  while (true) {
    const suffix = Math.floor(Math.random() * 10000).toString();
    const trySlug = `${baseSlug}-${suffix}`;
    const q2 = query(snippetsRef, where('ownerId', '==', userId), where('slug', '==', trySlug));
    const snap2 = await getDocs(q2);
    if (snap2.empty) return trySlug;
  }
}

export async function createSnippet(data: {
  id: string; title: string; html: string; css: string; js: string;
  ownerId: string; ownerName: string | null; ownerEmail: string;
  forkedFromId?: string | null;
}) {
  const slug = await generateUniqueSnippetSlug(data.ownerId, data.title);
  await setDoc(doc(db, 'snippets', data.id), {
    title: data.title, slug, html: data.html, css: data.css, js: data.js,
    visibility: 'private', allowForking: true, forkedFromId: data.forkedFromId || null,
    viewCount: 0, likeCount: 0,
    ownerId: data.ownerId, ownerName: data.ownerName, ownerEmail: data.ownerEmail,
    collaborators: [data.ownerId], pendingRequests: [],
    isReported: false, reportCount: 0,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'users', data.ownerId), { snippetCount: (await getDoc(doc(db, 'users', data.ownerId))).data()?.snippetCount + 1 || 1 } as any);
}

export async function updateSnippet(id: string, data: Partial<FirestoreSnippet>) {
  await setDoc(doc(db, 'snippets', id), { ...data, updatedAt: serverTimestamp() } as any, { merge: true });
}

export async function deleteSnippet(id: string) {
  const snap = await getDoc(doc(db, 'snippets', id));
  if (snap.exists()) {
    const data = snap.data();
    if (data.ownerId) {
      const userSnap = await getDoc(doc(db, 'users', data.ownerId));
      if (userSnap.exists()) {
        const count = Math.max(0, (userSnap.data().snippetCount || 1) - 1);
        await updateDoc(doc(db, 'users', data.ownerId), { snippetCount: count });
      }
    }
  }
  await deleteDoc(doc(db, 'snippets', id));
}

export async function getSnippet(id: string): Promise<FirestoreSnippet | null> {
  const snap = await getDoc(doc(db, 'snippets', id));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (data.visibility === undefined) data.visibility = data.isPublic ? 'public' : 'private';
  if (data.allowForking === undefined) data.allowForking = true;
  if (data.viewCount === undefined) data.viewCount = 0;
  if (data.likeCount === undefined) data.likeCount = 0;
  return { id: snap.id, ...data } as FirestoreSnippet;
}

export async function getUserSnippets(userId: string): Promise<FirestoreSnippet[]> {
  const q = query(
    collection(db, 'snippets'),
    where('ownerId', '==', userId)
  );
  const snap = await getDocs(q);
  const snippets = snap.docs.map(d => {
    const data = d.data();
    if (data.visibility === undefined) data.visibility = data.isPublic ? 'public' : 'private';
    return { id: d.id, ...data } as FirestoreSnippet;
  });
  return snippets.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
}

export async function getPublicSnippet(id: string): Promise<FirestoreSnippet | null> {
  const snap = await getDoc(doc(db, 'snippets', id));
  if (!snap.exists() || !snap.data().isPublic) return null;
  return { id: snap.id, ...snap.data() } as FirestoreSnippet;
}

export function subscribeToUserSnippets(userId: string, callback: (snippets: FirestoreSnippet[]) => void) {
  const q = query(
    collection(db, 'snippets'),
    where('ownerId', '==', userId)
  );
  return onSnapshot(q, (snap) => {
    const snippets = snap.docs.map(d => {
      const data = d.data();
      if (data.visibility === undefined) data.visibility = data.isPublic ? 'public' : 'private';
      return { id: d.id, ...data } as FirestoreSnippet;
    });
    snippets.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
    callback(snippets);
  });
}

export function subscribeToSnippet(id: string, userId: string | null, callback: (snippet: FirestoreSnippet | null) => void) {
  return onSnapshot(doc(db, 'snippets', id), (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    const data = snap.data();
    if (data.visibility === undefined) {
      data.visibility = data.isPublic ? 'public' : 'private';
    }
    const snippet = { ...data, id: snap.id } as FirestoreSnippet;
    
    if (snippet.visibility === 'public' || snippet.visibility === 'unlisted' || (userId && snippet.collaborators.includes(userId))) {
      callback(snippet);
    } else {
      callback(null);
    }
  });
}

// ─── Sharing / Access Requests ──────────────────────

export async function updateSnippetVisibility(id: string, visibility: 'private' | 'unlisted' | 'public', allowForking: boolean) {
  await updateDoc(doc(db, 'snippets', id), { visibility, allowForking, updatedAt: serverTimestamp() });
}

export async function incrementSnippetView(id: string) {
  await updateDoc(doc(db, 'snippets', id), { viewCount: increment(1) });
}

export async function requestAccess(snippetId: string, userId: string) {
  await setDoc(doc(db, 'snippets', snippetId), {
    pendingRequests: arrayUnion(userId),
    updatedAt: serverTimestamp(),
  } as any, { merge: true });

  const user = await getUser(userId);
  const snippet = await getSnippet(snippetId);
  
  if (user && snippet) {
    await createNotification({
      type: 'ACCESS_REQUEST',
      fromUserId: userId,
      fromUserName: user.name,
      fromUserEmail: user.email,
      snippetId: snippetId,
      snippetTitle: snippet.title,
    });
  }
}

export async function cancelAccessRequest(snippetId: string, userId: string) {
  await setDoc(doc(db, 'snippets', snippetId), {
    pendingRequests: arrayRemove(userId),
    updatedAt: serverTimestamp(),
  } as any, { merge: true });
}

export async function approveAccess(snippetId: string, userId: string) {
  await setDoc(doc(db, 'snippets', snippetId), {
    collaborators: arrayUnion(userId),
    pendingRequests: arrayRemove(userId),
    updatedAt: serverTimestamp(),
  } as any, { merge: true });
}

export async function denyAccess(snippetId: string, userId: string) {
  await setDoc(doc(db, 'snippets', snippetId), {
    pendingRequests: arrayRemove(userId),
    updatedAt: serverTimestamp(),
  } as any, { merge: true });
}

export async function removeCollaborator(snippetId: string, userId: string) {
  await setDoc(doc(db, 'snippets', snippetId), {
    collaborators: arrayRemove(userId),
    updatedAt: serverTimestamp(),
  } as any, { merge: true });
}

// ─── Groups ─────────────────────────────────────────

export interface FirestoreGroup {
  id: string;
  slug?: string;
  title: string;
  description: string;
  isPublic: boolean;
  ownerId: string;
  ownerName: string | null;
  snippetIds: string[];
  collaborators: string[];
  pendingRequests: string[];
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export async function generateUniqueGroupSlug(userId: string, title: string): Promise<string> {
  const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'collection';
  let slug = baseSlug;
  const groupsRef = collection(db, 'groups');
  let q = query(groupsRef, where('ownerId', '==', userId), where('slug', '==', slug));
  let snap = await getDocs(q);
  if (snap.empty) return slug;

  while (true) {
    const suffix = Math.floor(Math.random() * 10000).toString();
    const trySlug = `${baseSlug}-${suffix}`;
    const q2 = query(groupsRef, where('ownerId', '==', userId), where('slug', '==', trySlug));
    const snap2 = await getDocs(q2);
    if (snap2.empty) return trySlug;
  }
}

export async function createGroup(data: {
  id: string; title: string; description: string; ownerId: string; ownerName: string | null; snippetIds?: string[];
}) {
  const slug = await generateUniqueGroupSlug(data.ownerId, data.title);
  await setDoc(doc(db, 'groups', data.id), {
    title: data.title, slug, description: data.description,
    isPublic: false, ownerId: data.ownerId, ownerName: data.ownerName,
    snippetIds: data.snippetIds || [],
    collaborators: [data.ownerId], pendingRequests: [],
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
}

export async function updateGroup(id: string, data: Partial<FirestoreGroup>) {
  await setDoc(doc(db, 'groups', id), { ...data, updatedAt: serverTimestamp() } as any, { merge: true });
}

export async function deleteGroup(id: string) {
  await deleteDoc(doc(db, 'groups', id));
}

export async function getGroup(id: string): Promise<FirestoreGroup | null> {
  const snap = await getDoc(doc(db, 'groups', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as FirestoreGroup;
}

export async function getPublicGroup(id: string): Promise<FirestoreGroup | null> {
  const snap = await getDoc(doc(db, 'groups', id));
  if (!snap.exists() || !snap.data().isPublic) return null;
  return { id: snap.id, ...snap.data() } as FirestoreGroup;
}

export async function getUserGroups(userId: string): Promise<FirestoreGroup[]> {
  const q = query(collection(db, 'groups'), where('collaborators', 'array-contains', userId));
  const snap = await getDocs(q);
  const groups = snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreGroup));
  return groups.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
}

export async function getPublicUserGroups(userId: string): Promise<FirestoreGroup[]> {
  const q = query(collection(db, 'groups'), where('ownerId', '==', userId), where('isPublic', '==', true));
  const snap = await getDocs(q);
  const groups = snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreGroup));
  return groups.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
}

export async function getPublicUserSnippets(userId: string): Promise<FirestoreSnippet[]> {
  const q = query(collection(db, 'snippets'), where('ownerId', '==', userId), where('visibility', '==', 'public'));
  const snap = await getDocs(q);
  const snippets = snap.docs.map(d => {
    const data = d.data();
    if (data.visibility === undefined) data.visibility = data.isPublic ? 'public' : 'private';
    return { id: d.id, ...data } as FirestoreSnippet;
  });
  return snippets.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
}

export function subscribeToUserGroups(userId: string, callback: (groups: FirestoreGroup[]) => void) {
  const q = query(collection(db, 'groups'), where('collaborators', 'array-contains', userId));
  return onSnapshot(q, (snap) => {
    const groups = snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreGroup));
    groups.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
    callback(groups);
  });
}

export function subscribeToGroup(id: string, userId: string | null, callback: (group: FirestoreGroup | null) => void) {
  return onSnapshot(doc(db, 'groups', id), (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    const data = snap.data() as FirestoreGroup;
    if (data.isPublic || (userId && data.collaborators.includes(userId))) {
      callback({ ...data, id: snap.id });
    } else {
      callback(null);
    }
  });
}

export async function requestGroupAccess(groupId: string, userId: string) {
  await setDoc(doc(db, 'groups', groupId), { pendingRequests: arrayUnion(userId), updatedAt: serverTimestamp() } as any, { merge: true });
}

export async function approveGroupAccess(groupId: string, userId: string) {
  await setDoc(doc(db, 'groups', groupId), { collaborators: arrayUnion(userId), pendingRequests: arrayRemove(userId), updatedAt: serverTimestamp() } as any, { merge: true });
}

export async function cancelGroupAccessRequest(groupId: string, userId: string) {
  await setDoc(doc(db, 'groups', groupId), { pendingRequests: arrayRemove(userId), updatedAt: serverTimestamp() } as any, { merge: true });
}

// ─── Notifications ──────────────────────────────────

export async function createNotification(data: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
  const ref = doc(collection(db, 'notifications'));
  await setDoc(ref, {
    ...data, read: false, createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getNotifications(limitSize = 50): Promise<Notification[]> {
  const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(limitSize));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
}

export function subscribeToNotifications(limitSize = 50, callback: (notifications: Notification[]) => void) {
  const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(limitSize));
  return onSnapshot(q, (snap) => {
    const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
    callback(notifs);
  });
}

export async function getUnreadNotificationCount(): Promise<number> {
  const q = query(collection(db, 'notifications'), where('read', '==', false));
  const snap = await getDocs(q);
  return snap.size;
}

export async function markNotificationRead(id: string) {
  await updateDoc(doc(db, 'notifications', id), { read: true } as any);
}

export async function markAllNotificationsRead() {
  const q = query(collection(db, 'notifications'), where('read', '==', false));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map(d => updateDoc(d.ref, { read: true } as any)));
}

// ─── Reported / Stats ──────────────────────────────

export async function getReportedSnippets(): Promise<FirestoreSnippet[]> {
  const q = query(collection(db, 'snippets'), where('isReported', '==', true), orderBy('reportCount', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreSnippet));
}

export async function unreportSnippet(id: string) {
  await updateDoc(doc(db, 'snippets', id), { isReported: false, reportCount: 0 } as any);
}

export async function getRecentSnippets(limitSize = 20): Promise<FirestoreSnippet[]> {
  const q = query(collection(db, 'snippets'), orderBy('createdAt', 'desc'), limit(limitSize));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreSnippet));
}

export async function getStats(): Promise<{
  totalUsers: number; totalSnippets: number; reportedSnippets: number;
  newUsersThisMonth: number; snippetsCreatedToday: number; bannedUsers: number;
  unreadNotifications: number; totalViews: number;
}> {
  const [usersSnap, snippetsSnap, reportedSnap, bannedSnap, notifSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'snippets')),
    getDocs(query(collection(db, 'snippets'), where('isReported', '==', true))),
    getDocs(query(collection(db, 'users'), where('isBanned', '==', true))),
    getDocs(query(collection(db, 'notifications'), where('read', '==', false))),
  ]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let newUsersThisMonth = 0;
  let snippetsCreatedToday = 0;
  let totalViews = 0;

  usersSnap.forEach(d => {
    const data = d.data();
    if (data.createdAt?.toDate() >= monthStart) newUsersThisMonth++;
  });
  snippetsSnap.forEach(d => {
    const data = d.data();
    if (data.createdAt?.toDate() >= dayStart) snippetsCreatedToday++;
    totalViews += (data.viewCount || 0);
  });

  return {
    totalUsers: usersSnap.size, totalSnippets: snippetsSnap.size,
    reportedSnippets: reportedSnap.size, newUsersThisMonth,
    snippetsCreatedToday, bannedUsers: bannedSnap.size,
    unreadNotifications: notifSnap.size, totalViews,
  };
}

// ─── Invites ────────────────────────────────────────

export interface FirestoreInvite {
  id: string;
  targetEmail: string;
  resourceType: 'snippet' | 'group';
  resourceId: string;
  inviterId: string;
  status: 'pending' | 'accepted';
  createdAt: Timestamp | null;
}

export async function createInvite(targetEmail: string, resourceType: 'snippet' | 'group', resourceId: string, inviterId: string): Promise<string> {
  const id = Math.random().toString(36).substring(2, 15);
  await setDoc(doc(db, 'invites', id), {
    targetEmail,
    resourceType,
    resourceId,
    inviterId,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return id;
}

export async function getInvite(id: string): Promise<FirestoreInvite | null> {
  const snap = await getDoc(doc(db, 'invites', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as FirestoreInvite;
}

export async function redeemInvite(inviteId: string, currentUserEmail: string, currentUserId: string): Promise<{ success: boolean, message: string }> {
  const invite = await getInvite(inviteId);
  if (!invite) return { success: false, message: 'Invite not found.' };
  if (invite.status === 'accepted') return { success: false, message: 'Invite already redeemed.' };
  if (invite.targetEmail.toLowerCase() !== currentUserEmail.toLowerCase()) {
    return { success: false, message: `This invite was sent to ${invite.targetEmail}, not ${currentUserEmail}.` };
  }

  await updateDoc(doc(db, 'invites', inviteId), { status: 'accepted' });
  
  if (invite.resourceType === 'snippet') {
    await updateDoc(doc(db, 'snippets', invite.resourceId), { collaborators: arrayUnion(currentUserId) });
  } else if (invite.resourceType === 'group') {
    await updateDoc(doc(db, 'groups', invite.resourceId), { collaborators: arrayUnion(currentUserId) });
  }
  return { success: true, message: 'Invite successfully redeemed!' };
}

export async function toggleGroupVisibility(groupId: string, isPublic: boolean) {
  await setDoc(doc(db, 'groups', groupId), { isPublic, updatedAt: serverTimestamp() } as any, { merge: true });
}
export { db, getDocs, query, collection, where };