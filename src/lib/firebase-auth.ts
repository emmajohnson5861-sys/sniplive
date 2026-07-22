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

async function ensureUserDoc(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    const q = query(collection(db, 'users'), where('role', '==', 'ADMIN'));
    const adminSnap = await getDocs(q);
    const isFirst = adminSnap.size === 0;

    await setDoc(userRef, {
      email: user.email,
      name: user.displayName,
      avatarUrl: user.photoURL,
      role: isFirst ? 'ADMIN' : 'USER',
      isBanned: false,
      snippetCount: 0,
      storageUsage: 0,
      lastActiveAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  } else {
    await setDoc(userRef, { lastActiveAt: serverTimestamp(), avatarUrl: user.photoURL }, { merge: true });
  }
}
