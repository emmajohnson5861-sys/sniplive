'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { FirestoreSnippet, FirestoreGroup, subscribeToUserSnippets, subscribeToUserGroups, createSnippet, updateSnippet, deleteSnippet as deleteFirestoreSnippet, createGroup, updateGroup, deleteGroup as deleteFirestoreGroup, generateUniqueSnippetSlug } from '@/lib/firebase-db';

export interface Snippet {
  id: string;
  slug?: string;
  title: string;
  html: string;
  css: string;
  js: string;
  createdAt: number;
  updatedAt: number;
  visibility?: 'private' | 'unlisted' | 'public';
  allowForking?: boolean;
  forkedFromId?: string | null;
  ownerId?: string;
  collaborators?: string[];
  pendingRequests?: string[];
}

export interface Group {
  id: string;
  slug?: string;
  title: string;
  description: string;
  snippetIds: string[];
  isPublic?: boolean;
  ownerId?: string;
  collaborators?: string[];
}

interface SnippetContextType {
  snippets: Snippet[];
  groups: Group[];
  activeSnippetId: string | null;
  activeSnippet: Snippet | null;
  activeGroupId: string | null;
  loadedFromCloud: boolean;
  setActiveSnippetId: (id: string | null) => void;
  setActiveGroupId: (id: string | null) => void;
  saveSnippet: (snippet: Snippet) => void;
  createNewSnippet: () => void;
  deleteSnippet: (id: string) => void;
  updateSnippetTitle: (id: string, newTitle: string) => void;
  createNewGroup: (title: string, description: string) => void;
  deleteGroup: (id: string) => void;
  addSnippetToGroup: (groupId: string, snippetId: string) => void;
  removeSnippetFromGroup: (groupId: string, snippetId: string) => void;
  forkSnippet: (original: Snippet | FirestoreSnippet) => Promise<string | null>;
}

const SnippetContext = createContext<SnippetContextType | undefined>(undefined);

export function SnippetProvider({ children }: { children: React.ReactNode }) {
  const { user, firebaseUser } = useAuthStore();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeSnippetId, setActiveSnippetId] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [loadedFromCloud, setLoadedFromCloud] = useState(false);

  useEffect(() => {
    if (firebaseUser) {
      let isFirstLoad = true;
      const unsubscribeSnippets = subscribeToUserSnippets(firebaseUser.uid, (cloudSnippets) => {
        const mapped = cloudSnippets.map(s => ({
          id: s.id, slug: s.slug, title: s.title, html: s.html, css: s.css, js: s.js,
          createdAt: s.createdAt?.toDate()?.getTime() || Date.now(),
          updatedAt: s.updatedAt?.toDate()?.getTime() || Date.now(),
          visibility: s.visibility, allowForking: s.allowForking, forkedFromId: s.forkedFromId,
          ownerId: s.ownerId, collaborators: s.collaborators, pendingRequests: s.pendingRequests,
        }));
        // Always update from Firestore — never let stale localStorage override live data
        setSnippets(mapped);
        setActiveSnippetId(prev => (!prev && mapped.length > 0 ? mapped[0].id : prev));
        localStorage.setItem('sniplive_snippets', JSON.stringify(mapped));
        isFirstLoad = false;
        setLoadedFromCloud(true);
      });


      const unsubscribeGroups = subscribeToUserGroups(firebaseUser.uid, (cloudGroups) => {
        const mappedGroups = cloudGroups.map(g => ({
          id: g.id, slug: g.slug, title: g.title, description: g.description, snippetIds: g.snippetIds || [],
          isPublic: g.isPublic, ownerId: g.ownerId, collaborators: g.collaborators
        }));
        setGroups(mappedGroups);
      });

      return () => {
        unsubscribeSnippets();
        unsubscribeGroups();
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
      const fbData: Record<string, unknown> = { title: newTitle, slug: newSlug };
      const found = snippets.find(s => s.id === id);
      if (found && (found.ownerId || firebaseUser.uid)) {
        fbData.ownerId = found.ownerId || firebaseUser.uid;
        fbData.ownerName = user?.name || null;
        fbData.ownerEmail = user?.email || '';
        fbData.collaborators = [fbData.ownerId];
      }
      updateSnippet(id, fbData as any).catch(console.error);
    }
  }, [snippets, firebaseUser, user]);

  const createNewSnippet = useCallback(async () => {
    const title = window.prompt('Enter a name for your new snippet:', 'Untitled Snippet');
    if (title === null) return; // User cancelled

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
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ownerId,
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
      createSnippet({
        id: newSnippet.id, title: newSnippet.title,
        html: newSnippet.html, css: newSnippet.css, js: newSnippet.js,
        ownerId: firebaseUser.uid, ownerName: user?.name || null, ownerEmail: user?.email || '',
      }).catch(console.error);
    }
  }, [firebaseUser, user]);

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

  const createNewGroup = useCallback((title: string, description: string) => {
    if (!firebaseUser) return;
    const newGroup: Group = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      description,
      snippetIds: [],
      ownerId: firebaseUser.uid,
      isPublic: false,
      collaborators: [firebaseUser.uid]
    };
    setGroups([newGroup, ...groups]);
    createGroup({ 
      ...newGroup, 
      ownerId: firebaseUser.uid, 
      ownerName: user?.name || null 
    }).catch(console.error);
  }, [groups, firebaseUser, user]);

  const deleteGroupContext = useCallback((id: string) => {
    setGroups(groups.filter(g => g.id !== id));
    if (activeGroupId === id) setActiveGroupId(null);
    if (firebaseUser) deleteFirestoreGroup(id).catch(console.error);
  }, [groups, activeGroupId, firebaseUser]);

  const addSnippetToGroup = useCallback((groupId: string, snippetId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group || group.snippetIds.includes(snippetId)) return;
    const updatedIds = [...group.snippetIds, snippetId];
    setGroups(groups.map(g => g.id === groupId ? { ...g, snippetIds: updatedIds } : g));
    if (firebaseUser) updateGroup(groupId, { snippetIds: updatedIds }).catch(console.error);
  }, [groups, firebaseUser]);

  const removeSnippetFromGroup = useCallback((groupId: string, snippetId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group || !group.snippetIds.includes(snippetId)) return;
    const updatedIds = group.snippetIds.filter(id => id !== snippetId);
    setGroups(groups.map(g => g.id === groupId ? { ...g, snippetIds: updatedIds } : g));
    if (firebaseUser) updateGroup(groupId, { snippetIds: updatedIds }).catch(console.error);
  }, [groups, firebaseUser]);

  const activeSnippet = snippets.find(s => s.id === activeSnippetId) || null;

  const forkSnippet = useCallback(async (original: Snippet | FirestoreSnippet) => {
    if (!firebaseUser) {
      return null; // Caller should open auth modal
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
        forkedFromId: original.id
      });
      setActiveSnippetId(newId);
      return newId;
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [firebaseUser, user]);

  return (
    <SnippetContext.Provider value={{
      snippets, groups, activeSnippetId, activeSnippet, activeGroupId, loadedFromCloud,
      setActiveSnippetId, setActiveGroupId, saveSnippet, createNewSnippet,
      deleteSnippet, updateSnippetTitle, createNewGroup, deleteGroup: deleteGroupContext,
      addSnippetToGroup, removeSnippetFromGroup, forkSnippet
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
