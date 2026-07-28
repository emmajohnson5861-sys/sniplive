'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { FirestoreSnippet, subscribeToUserSnippets, createSnippet, updateSnippet, deleteSnippet as deleteFirestoreSnippet, generateUniqueSnippetSlug } from '@/lib/firebase-db';

export interface Snippet {
  id: string;
  slug?: string;
  title: string;
  html: string;
  css: string;
  js: string;
  react?: string;
  createdAt: number;
  updatedAt: number;
  visibility?: 'private' | 'unlisted' | 'public';
  isLive?: boolean;
  allowForking?: boolean;
  forkedFromId?: string | null;
  ownerId?: string;
  ownerUsername?: string;
  collaborators?: string[];
  pendingRequests?: string[];
}

interface SnippetContextType {
  snippets: Snippet[];
  activeSnippetId: string | null;
  activeSnippet: Snippet | null;
  loadedFromCloud: boolean;
  setActiveSnippetId: (id: string | null) => void;
  saveSnippet: (snippet: Snippet) => void;
  createNewSnippet: (title: string) => void;
  deleteSnippet: (id: string) => void;
  updateSnippetTitle: (id: string, newTitle: string) => void;
  forkSnippet: (original: Snippet | FirestoreSnippet) => Promise<string | null>;
  setExternalSnippet: (snippet: Snippet | null) => void;
}

const SnippetContext = createContext<SnippetContextType | undefined>(undefined);

export function SnippetProvider({ children }: { children: React.ReactNode }) {
  const { user, firebaseUser } = useAuthStore();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [activeSnippetId, setActiveSnippetId] = useState<string | null>(null);
  const [externalSnippet, setExternalSnippet] = useState<Snippet | null>(null);
  const [loadedFromCloud, setLoadedFromCloud] = useState(false);
  const snippetsRef = useRef(snippets);
  snippetsRef.current = snippets;

  useEffect(() => {
    if (firebaseUser) {
      const unsubscribeSnippets = subscribeToUserSnippets(firebaseUser.uid, (cloudSnippets) => {
        const mapped = cloudSnippets.map(s => ({
          id: s.id, slug: s.slug, title: s.title || 'Untitled Snippet',
          html: s.html ?? '', css: s.css ?? '', js: s.js ?? '', react: s.react,
          createdAt: s.createdAt?.toDate()?.getTime() || Date.now(),
          updatedAt: s.updatedAt?.toDate()?.getTime() || Date.now(),
          visibility: s.visibility, isLive: s.isLive, allowForking: s.allowForking, forkedFromId: s.forkedFromId,
          ownerId: s.ownerId, collaborators: s.collaborators, pendingRequests: s.pendingRequests,
        }));
        setSnippets(mapped);
        setActiveSnippetId(prev => (!prev && mapped.length > 0 ? mapped[0].id : prev));
        localStorage.setItem('sniplive_snippets', JSON.stringify(mapped));
        setLoadedFromCloud(true);
      });

      return () => {
        unsubscribeSnippets();
      };
    } else if (!firebaseUser) {
      const saved = localStorage.getItem('sniplive_snippets');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSnippets(parsed);
        if (parsed.length > 0 && !activeSnippetId) setActiveSnippetId(parsed[0].id);
      } else {
        setSnippets([]);
        setActiveSnippetId(null);
      }
      setLoadedFromCloud(true);
    }
  }, [firebaseUser]);

  const saveSnippet = useCallback((snippet: Snippet) => {
    const enriched = { ...snippet };
    if (firebaseUser && !enriched.ownerId) {
      enriched.ownerId = firebaseUser.uid;
      enriched.visibility = enriched.visibility || 'private';
      enriched.collaborators = enriched.collaborators ?? [firebaseUser.uid];
      enriched.pendingRequests = enriched.pendingRequests ?? [];
    }
    const updated = snippetsRef.current.map(s => s.id === enriched.id ? { ...enriched, updatedAt: Date.now() } : s);
    setSnippets(updated);
    localStorage.setItem('sniplive_snippets', JSON.stringify(updated));
    if (firebaseUser) {
      const fbData: Record<string, unknown> = {
        title: snippet.title, html: snippet.html || '', css: snippet.css || '', js: snippet.js || '', react: snippet.react,
      };
      if (snippet.ownerId || enriched.ownerId) {
        fbData.ownerId = snippet.ownerId || enriched.ownerId;
        fbData.ownerName = user?.name || null;
        fbData.ownerEmail = user?.email || '';
      }
      updateSnippet(snippet.id, fbData as any).catch(console.error);
    }
  }, [snippetsRef, firebaseUser, user]);
  
  const updateSnippetTitle = useCallback(async (id: string, newTitle: string) => {
    let newSlug: string | undefined = undefined;
    if (firebaseUser) {
      newSlug = await generateUniqueSnippetSlug(firebaseUser.uid, newTitle);
    } else {
      newSlug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'snippet';
    }

    setSnippets(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, title: newTitle, slug: newSlug, updatedAt: Date.now() } : s);
      localStorage.setItem('sniplive_snippets', JSON.stringify(updated));
      return updated;
    });

    if (firebaseUser) {
      const found = snippetsRef.current.find(s => s.id === id);
      const fbData: Record<string, unknown> = { title: newTitle, slug: newSlug };
      if (found) {
        fbData.html = found.html;
        fbData.css = found.css;
        fbData.js = found.js;
        if (found.ownerId || firebaseUser.uid) {
          fbData.ownerId = found.ownerId || firebaseUser.uid;
          fbData.ownerName = user?.name || null;
          fbData.ownerEmail = user?.email || '';
        }
      }
      updateSnippet(id, fbData as any).catch(console.error);
    }
  }, [snippets, firebaseUser, user]);

  const createNewSnippet = useCallback(async (title: string) => {
    const ownerId = firebaseUser?.uid || '';
    let newSlug = 'untitled-snippet-' + Math.random().toString(36).substring(2, 6);
    if (ownerId) {
      newSlug = await generateUniqueSnippetSlug(ownerId, title);
    } else {
      newSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || newSlug;
    }

    const newSnippet: Snippet = {
      id: Math.random().toString(36).substring(2, 9),
      slug: newSlug,
      title: title || 'Untitled Snippet',
      html: '<!-- Write your HTML here -->\n',
      css: '/* Write your CSS here */\n',
      js: '// Write your JS here\n',
      react: '// Write your React JSX here\n// e.g., export default function App() { return <h1>Hello</h1> }\n',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ownerId,
      isLive: false,
      visibility: 'private',
      collaborators: ownerId ? [ownerId] : [],
      pendingRequests: [],
    };
    
    setSnippets(prev => {
      const updated = [newSnippet, ...prev];
      localStorage.setItem('sniplive_snippets', JSON.stringify(updated));
      return updated;
    });
    setActiveSnippetId(newSnippet.id);
    
    if (firebaseUser) {
      try {
        await createSnippet({
          id: newSnippet.id, title: newSnippet.title,
          html: newSnippet.html, css: newSnippet.css, js: newSnippet.js,
          ownerId: firebaseUser.uid, ownerName: user?.name || null, ownerEmail: user?.email || '',
          ownerUsername: user?.username || null,
          slug: newSlug,
        });
      } catch (e) {
        console.error('Failed to create snippet in Firestore:', e);
      }
    }
  }, [firebaseUser, user]);

  const deleteSnippet = useCallback((id: string) => {
    const updated = snippetsRef.current.filter(s => s.id !== id);
    setSnippets(updated);
    if (activeSnippetId === id) {
      setActiveSnippetId(updated.length > 0 ? updated[0].id : null);
    }
    localStorage.setItem('sniplive_snippets', JSON.stringify(updated));
    if (firebaseUser) {
      deleteFirestoreSnippet(id).catch(console.error);
    }
  }, [activeSnippetId, firebaseUser]);


  const forkSnippet = useCallback(async (original: Snippet | FirestoreSnippet) => {
    if (!firebaseUser) {
      return null;
    }
    const newId = crypto.randomUUID();
    try {
      await createSnippet({
        id: newId,
        title: `${original.title} (Fork)`,
        html: original.html,
        css: original.css,
        js: original.js,
        ownerId: firebaseUser.uid,
        ownerName: user?.name || null,
        ownerEmail: user?.email || '',
        ownerUsername: user?.username || null,
        forkedFromId: original.id
      });
      setActiveSnippetId(newId);
      return newId;
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [firebaseUser, user]);

  const activeSnippet = externalSnippet || snippets.find(s => s.id === activeSnippetId) || null;

  return (
    <SnippetContext.Provider value={{
      snippets,
      activeSnippetId,
      activeSnippet,
      loadedFromCloud,
      setActiveSnippetId,
      saveSnippet,
      createNewSnippet,
      deleteSnippet,
      updateSnippetTitle,
      forkSnippet,
      setExternalSnippet
    }}>
      {children}
    </SnippetContext.Provider>
  );
}

export function useSnippetContext() {
  const context = useContext(SnippetContext);
  if (context === undefined) {
    throw new Error('useSnippetContext must be used within a SnippetProvider');
  }
  return context;
}
