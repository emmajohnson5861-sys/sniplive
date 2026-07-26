import { create } from 'zustand';
import { User } from '@firebase/auth';
import { onAuthChange, signInWithGoogle, signOutUser, ensureUserDoc, checkEmailSignInMethods, signUpWithEmail as fbSignUpWithEmail, signInWithEmail as fbSignInWithEmail } from '@/lib/firebase-auth';
import { getUser, FirestoreUser } from '@/lib/firebase-db';

const USER_CACHE_KEY = 'sniplive_user_cache';

function getCachedUser(): FirestoreUser | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(USER_CACHE_KEY) : null;
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setCachedUser(user: FirestoreUser | null) {
  try {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_CACHE_KEY);
    }
  } catch { /* ignore */ }
}

interface AuthState {
  firebaseUser: User | null;
  user: FirestoreUser | null;
  loading: boolean;
  initialized: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateLocalUser: (data: Partial<FirestoreUser>) => void;
}

// Pre-load cached user so the store has data BEFORE the first Firebase round-trip
const cachedUser = getCachedUser();

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  // If we have a cached user, show it immediately (no skeleton flash for returning users)
  user: cachedUser,
  loading: !cachedUser, // Don't show loading if we already have cached data
  initialized: false,

  signIn: async () => {
    try {
      const fbUser = await signInWithGoogle();
      if (fbUser) {
        const userData = await getUser(fbUser.uid);
        setCachedUser(userData);
        set({ firebaseUser: fbUser, user: userData, loading: false, initialized: true });
      }
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  signInWithEmail: async (email, pass) => {
    try {
      const fbUser = await fbSignInWithEmail(email, pass);
      if (fbUser) {
        const userData = await getUser(fbUser.uid);
        setCachedUser(userData);
        set({ firebaseUser: fbUser, user: userData, loading: false, initialized: true });
      }
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  signUpWithEmail: async (email, pass, name) => {
    try {
      const methods = await checkEmailSignInMethods(email);
      if (methods.includes('google.com')) {
        throw new Error('there already account created on this mail continue with google');
      }
      
      const fbUser = await fbSignUpWithEmail(email, pass, name);
      if (fbUser) {
        const userData = await getUser(fbUser.uid);
        setCachedUser(userData);
        set({ firebaseUser: fbUser, user: userData, loading: false, initialized: true });
      }
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: async () => {
    await signOutUser();
    setCachedUser(null);
    set({ firebaseUser: null, user: null, loading: false, initialized: true });
  },

  updateLocalUser: (data) => {
    set((state) => {
      const updated = state.user ? { ...state.user, ...data } : null;
      setCachedUser(updated);
      return { user: updated };
    });
  }
}));

let initStarted = false;
export function initAuthListener() {
  if (initStarted) return;
  initStarted = true;

  const store = useAuthStore;
  onAuthChange(async (fbUser) => {
    if (fbUser) {
      try {
        let userData = await getUser(fbUser.uid);
        if (userData && !userData.username) {
          await ensureUserDoc(fbUser);
          userData = await getUser(fbUser.uid);
        }
        setCachedUser(userData);
        store.setState({ firebaseUser: fbUser, user: userData, loading: false, initialized: true });
      } catch (err) {
        store.setState({ firebaseUser: fbUser, user: null, loading: false, initialized: true });
      }
    } else {
      // User is signed out — clear the cache
      setCachedUser(null);
      store.setState({ firebaseUser: null, user: null, loading: false, initialized: true });
    }
  });
}

