import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, Timestamp,
  arrayUnion, arrayRemove,
} from '@firebase/firestore';

export interface FirestoreUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
  isBanned: boolean;
  snippetCount: number;
  storageUsage: number;
  lastActiveAt: Timestamp | null;
  createdAt: Timestamp | null;
}

export interface FirestoreSnippet {
  id: string;
  title: string;
  html: string;
  css: string;
  js: string;
  isPublic: boolean;
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
  type: 'ACCESS_REQUEST' | 'ACCESS_GRANTED' | 'ACCESS_DENIED';
  fromUserId: string;
  fromUserName: string | null;
  fromUserEmail: string;
  snippetId: string;
  snippetTitle: string;
  read: boolean;
  createdAt: Timestamp | null;
}

// ─── Users ──────────────────────────────────────────

export async function getUser(uid: string): Promise<FirestoreUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as FirestoreUser;
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

export async function createSnippet(data: {
  id: string; title: string; html: string; css: string; js: string;
  ownerId: string; ownerName: string | null; ownerEmail: string;
}) {
  await setDoc(doc(db, 'snippets', data.id), {
    title: data.title, html: data.html, css: data.css, js: data.js,
    isPublic: false, ownerId: data.ownerId, ownerName: data.ownerName, ownerEmail: data.ownerEmail,
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
  return { id: snap.id, ...snap.data() } as FirestoreSnippet;
}

export async function getUserSnippets(userId: string): Promise<FirestoreSnippet[]> {
  const q = query(
    collection(db, 'snippets'),
    where('collaborators', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreSnippet));
}

export async function getPublicSnippet(id: string): Promise<FirestoreSnippet | null> {
  const snap = await getDoc(doc(db, 'snippets', id));
  if (!snap.exists() || !snap.data().isPublic) return null;
  return { id: snap.id, ...snap.data() } as FirestoreSnippet;
}

// ─── Sharing / Access Requests ──────────────────────

export async function toggleSnippetVisibility(id: string, isPublic: boolean) {
  await setDoc(doc(db, 'snippets', id), { isPublic, updatedAt: serverTimestamp() } as any, { merge: true });
}

export async function requestAccess(snippetId: string, userId: string) {
  await setDoc(doc(db, 'snippets', snippetId), {
    pendingRequests: arrayUnion(userId),
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
  unreadNotifications: number;
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

  usersSnap.forEach(d => {
    const data = d.data();
    if (data.createdAt?.toDate() >= monthStart) newUsersThisMonth++;
  });
  snippetsSnap.forEach(d => {
    const data = d.data();
    if (data.createdAt?.toDate() >= dayStart) snippetsCreatedToday++;
  });

  return {
    totalUsers: usersSnap.size, totalSnippets: snippetsSnap.size,
    reportedSnippets: reportedSnap.size, newUsersThisMonth,
    snippetsCreatedToday, bannedUsers: bannedSnap.size,
    unreadNotifications: notifSnap.size,
  };
}
