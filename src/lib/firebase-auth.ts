import { auth, db } from './firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from '@firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, query, where, serverTimestamp } from '@firebase/firestore';

const provider = new GoogleAuthProvider();

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    await ensureUserDoc(user);
    return user;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') return null;
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

async function generateUniqueUsername(base: string): Promise<string> {
  const cleanBase = base.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
  let username = cleanBase;
  const usersRef = collection(db, 'users');
  
  let q = query(usersRef, where('username', '==', username));
  let snap = await getDocs(q);
  if (snap.empty) return username;

  while (true) {
    const suffix = Math.floor(Math.random() * 10000).toString();
    const tryUsername = `${cleanBase}${suffix}`;
    const q2 = query(usersRef, where('username', '==', tryUsername));
    const snap2 = await getDocs(q2);
    if (snap2.empty) return tryUsername;
  }
}

export async function ensureUserDoc(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    const q = query(collection(db, 'users'), where('role', '==', 'ADMIN'));
    const adminSnap = await getDocs(q);
    const isFirst = adminSnap.size === 0;

    const baseName = user.displayName || (user.email ? user.email.split('@')[0] : 'user');
    const username = await generateUniqueUsername(baseName);

    await setDoc(userRef, {
      username,
      email: user.email,
      name: user.displayName,
      avatarUrl: user.photoURL,
      role: isFirst ? 'ADMIN' : 'SUBSCRIBER',
      isBanned: false,
      snippetCount: 0,
      storageUsage: 0,
      lastActiveAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  } else {
    const data = snap.data();
    let updates: any = { lastActiveAt: serverTimestamp(), avatarUrl: user.photoURL };
    if (!data.username) {
      const baseName = user.displayName || (user.email ? user.email.split('@')[0] : 'user');
      updates.username = await generateUniqueUsername(baseName);
    }
    await setDoc(userRef, updates, { merge: true });
  }
}
