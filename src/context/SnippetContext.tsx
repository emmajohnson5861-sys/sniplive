'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { FirestoreSnippet, getUserSnippets, createSnippet, updateSnippet, deleteSnippet as deleteFirestoreSnippet } from '@/lib/firebase-db';

export interface Snippet {
  id: string;
  title: string;
  html: string;
  css: string;
  js: string;
  createdAt: number;
  updatedAt: number;
  isPublic?: boolean;
  ownerId?: string;
  collaborators?: string[];
  pendingRequests?: string[];
}

interface SnippetContextType {
  snippets: Snippet[];
  activeSnippetId: string | null;
  activeSnippet: Snippet | null;
  setActiveSnippetId: (id: string | null) => void;
  saveSnippet: (snippet: Snippet) => void;
  createNewSnippet: () => void;
  deleteSnippet: (id: string) => void;
  updateSnippetTitle: (id: string, newTitle: string) => void;
}

const SnippetContext = createContext<SnippetContextType | undefined>(undefined);

export function SnippetProvider({ children }: { children: React.ReactNode }) {
  const { user, firebaseUser } = useAuthStore();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [activeSnippetId, setActiveSnippetId] = useState<string | null>(null);
  const [loadedFromCloud, setLoadedFromCloud] = useState(false);

  useEffect(() => {
    if (firebaseUser && !loadedFromCloud) {
      getUserSnippets(firebaseUser.uid).then(cloudSnippets => {
        if (cloudSnippets.length > 0) {
          const mapped = cloudSnippets.map(s => ({
            id: s.id, title: s.title, html: s.html, css: s.css, js: s.js,
            createdAt: s.createdAt?.toDate()?.getTime() || Date.now(),
            updatedAt: s.updatedAt?.toDate()?.getTime() || Date.now(),
            isPublic: s.isPublic, ownerId: s.ownerId,
            collaborators: s.collaborators, pendingRequests: s.pendingRequests,
          }));
          setSnippets(mapped);
          if (!activeSnippetId && mapped.length > 0) setActiveSnippetId(mapped[0].id);
          localStorage.setItem('sniplive_snippets', JSON.stringify(mapped));
        } else {
          const local = localStorage.getItem('sniplive_snippets');
          if (local) {
            let parsed = JSON.parse(local);
            parsed = parsed.map((s: Snippet) => ({
              ...s,
              ownerId: s.ownerId || firebaseUser.uid,
              isPublic: s.isPublic ?? false,
              collaborators: s.collaborators && s.collaborators.length > 0 ? s.collaborators : [firebaseUser.uid],
              pendingRequests: s.pendingRequests || [],
            }));
            setSnippets(parsed);
            if (parsed.length > 0 && !activeSnippetId) setActiveSnippetId(parsed[0].id);
          }
        }
        setLoadedFromCloud(true);
      }).catch(() => {
        const local = localStorage.getItem('sniplive_snippets');
        if (local) {
          let parsed = JSON.parse(local);
          parsed = parsed.map((s: Snippet) => ({
            ...s,
            ownerId: s.ownerId || firebaseUser.uid,
            isPublic: s.isPublic ?? false,
            collaborators: s.collaborators && s.collaborators.length > 0 ? s.collaborators : [firebaseUser.uid],
            pendingRequests: s.pendingRequests || [],
          }));
          setSnippets(parsed);
          if (parsed.length > 0 && !activeSnippetId) setActiveSnippetId(parsed[0].id);
        }
        setLoadedFromCloud(true);
      });
    } else if (!firebaseUser) {
      const saved = localStorage.getItem('sniplive_snippets');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSnippets(parsed);
        if (parsed.length > 0 && !activeSnippetId) setActiveSnippetId(parsed[0].id);
      } else {
        const defaultSnippet: Snippet = {
          id: Math.random().toString(36).substring(2, 9),
          title: 'My First Snippet',
          html: '<div class="card">\n  <h2>Hello SnipLive!</h2>\n  <p>Edit this code to see the live preview.</p>\n  <button class="btn">Click Me</button>\n</div>',
          css: '.card {\n  padding: 2rem;\n  border-radius: 12px;\n  background: white;\n  box-shadow: 0 4px 6px rgba(0,0,0,0.1);\n  font-family: sans-serif;\n  text-align: center;\n}\n\n.btn {\n  margin-top: 1rem;\n  padding: 0.5rem 1rem;\n  background: #6366f1;\n  color: white;\n  border: none;\n  border-radius: 6px;\n  cursor: pointer;\n}',
          js: 'document.querySelector(".btn").addEventListener("click", () => {\n  alert("Button clicked!");\n});',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        setSnippets([defaultSnippet]);
        setActiveSnippetId(defaultSnippet.id);
        localStorage.setItem('sniplive_snippets', JSON.stringify([defaultSnippet]));
      }
      setLoadedFromCloud(true);
    }
  }, [firebaseUser]);

  const saveSnippet = useCallback((snippet: Snippet) => {
    const enriched = { ...snippet };
    if (firebaseUser && !enriched.ownerId) {
      enriched.ownerId = firebaseUser.uid;
      enriched.isPublic = enriched.isPublic ?? false;
      enriched.collaborators = enriched.collaborators ?? [firebaseUser.uid];
      enriched.pendingRequests = enriched.pendingRequests ?? [];
    }
    const updated = snippets.map(s => s.id === enriched.id ? { ...enriched, updatedAt: Date.now() } : s);
    setSnippets(updated);
    localStorage.setItem('sniplive_snippets', JSON.stringify(updated));
    if (firebaseUser) {
      const fbData: Record<string, unknown> = {
        title: snippet.title, html: snippet.html, css: snippet.css, js: snippet.js,
      };
      if (snippet.ownerId || enriched.ownerId) {
        fbData.ownerId = snippet.ownerId || enriched.ownerId;
        fbData.ownerName = user?.name || null;
        fbData.ownerEmail = user?.email || '';
        fbData.collaborators = [fbData.ownerId];
      }
      updateSnippet(snippet.id, fbData as any).catch(console.error);
    }
  }, [snippets, firebaseUser, user]);
  
  const updateSnippetTitle = useCallback((id: string, newTitle: string) => {
    const updated = snippets.map(s => s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s);
    setSnippets(updated);
    localStorage.setItem('sniplive_snippets', JSON.stringify(updated));
    if (firebaseUser) {
      const fbData: Record<string, unknown> = { title: newTitle };
      const found = updated.find(s => s.id === id);
      if (found && (found.ownerId || firebaseUser.uid)) {
        fbData.ownerId = found.ownerId || firebaseUser.uid;
        fbData.ownerName = user?.name || null;
        fbData.ownerEmail = user?.email || '';
        fbData.collaborators = [fbData.ownerId];
      }
      updateSnippet(id, fbData as any).catch(console.error);
    }
  }, [snippets, firebaseUser, user]);

  const createNewSnippet = useCallback(() => {
    const ownerId = firebaseUser?.uid || '';
    const newSnippet: Snippet = {
      id: Math.random().toString(36).substring(2, 9),
      title: 'Untitled Snippet',
      html: '<!-- Write your HTML here -->\n',
      css: '/* Write your CSS here */\n',
      js: '// Write your JS here\n',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ownerId,
      isPublic: false,
      collaborators: ownerId ? [ownerId] : [],
      pendingRequests: [],
    };
    const updated = [newSnippet, ...snippets];
    setSnippets(updated);
    setActiveSnippetId(newSnippet.id);
    localStorage.setItem('sniplive_snippets', JSON.stringify(updated));
    if (firebaseUser) {
      createSnippet({
        id: newSnippet.id, title: newSnippet.title,
        html: newSnippet.html, css: newSnippet.css, js: newSnippet.js,
        ownerId: firebaseUser.uid, ownerName: user?.name || null, ownerEmail: user?.email || '',
      }).catch(console.error);
    }
  }, [snippets, firebaseUser, user]);

  const deleteSnippet = useCallback((id: string) => {
    const updated = snippets.filter(s => s.id !== id);
    setSnippets(updated);
    if (activeSnippetId === id) {
      setActiveSnippetId(updated.length > 0 ? updated[0].id : null);
    }
    localStorage.setItem('sniplive_snippets', JSON.stringify(updated));
    if (firebaseUser) {
      deleteFirestoreSnippet(id).catch(console.error);
    }
  }, [snippets, activeSnippetId, firebaseUser]);

  const activeSnippet = snippets.find(s => s.id === activeSnippetId) || null;

  return (
    <SnippetContext.Provider value={{
      snippets, activeSnippetId, activeSnippet, setActiveSnippetId, saveSnippet, createNewSnippet, deleteSnippet, updateSnippetTitle
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
