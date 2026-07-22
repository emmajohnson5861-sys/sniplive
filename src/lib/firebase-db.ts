import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, Timestamp,
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
  isReported: boolean;
  reportCount: number;
  userId: string;
  userName: string | null;
  userEmail: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

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
  const snippetsSnap = await getDocs(query(collection(db, 'snippets'), where('userId', '==', uid)));
  const batch = snippetsSnap.docs.map(d => deleteDoc(d.ref));
  await Promise.all(batch);
  await deleteDoc(doc(db, 'users', uid));
}

export async function getReportedSnippets(): Promise<FirestoreSnippet[]> {
  const q = query(collection(db, 'snippets'), where('isReported', '==', true), orderBy('reportCount', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreSnippet));
}

export async function unreportSnippet(id: string) {
  await updateDoc(doc(db, 'snippets', id), { isReported: false, reportCount: 0 } as any);
}

export async function deleteSnippet(id: string) {
  await deleteDoc(doc(db, 'snippets', id));
}

export async function getRecentSnippets(limitSize = 20): Promise<FirestoreSnippet[]> {
  const q = query(collection(db, 'snippets'), orderBy('createdAt', 'desc'), limit(limitSize));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreSnippet));
}

export async function getStats(): Promise<{
  totalUsers: number;
  totalSnippets: number;
  reportedSnippets: number;
  newUsersThisMonth: number;
  snippetsCreatedToday: number;
  bannedUsers: number;
}> {
  const [usersSnap, snippetsSnap, reportedSnap, bannedSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'snippets')),
    getDocs(query(collection(db, 'snippets'), where('isReported', '==', true))),
    getDocs(query(collection(db, 'users'), where('isBanned', '==', true))),
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
    totalUsers: usersSnap.size,
    totalSnippets: snippetsSnap.size,
    reportedSnippets: reportedSnap.size,
    newUsersThisMonth,
    snippetsCreatedToday,
    bannedUsers: bannedSnap.size,
  };
}
