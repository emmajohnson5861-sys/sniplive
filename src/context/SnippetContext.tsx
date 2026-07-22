'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Snippet {
  id: string;
  title: string;
  html: string;
  css: string;
  js: string;
  createdAt: number;
  updatedAt: number;
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
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [activeSnippetId, setActiveSnippetId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sniplive_snippets');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSnippets(parsed);
      if (parsed.length > 0 && !activeSnippetId) {
        setActiveSnippetId(parsed[0].id);
      }
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
  }, []);

  const saveSnippet = (snippet: Snippet) => {
    const updated = snippets.map(s => s.id === snippet.id ? { ...snippet, updatedAt: Date.now() } : s);
    setSnippets(updated);
    localStorage.setItem('sniplive_snippets', JSON.stringify(updated));
  };
  
  const updateSnippetTitle = (id: string, newTitle: string) => {
    const updated = snippets.map(s => s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s);
    setSnippets(updated);
    localStorage.setItem('sniplive_snippets', JSON.stringify(updated));
  };

  const createNewSnippet = () => {
    console.log("createNewSnippet called! Current snippets:", snippets.length);
    try {
      const newSnippet: Snippet = {
        id: Math.random().toString(36).substring(2, 9),
        title: 'Untitled Snippet',
        html: '<!-- Write your HTML here -->\n',
        css: '/* Write your CSS here */\n',
        js: '// Write your JS here\n',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      const updated = [newSnippet, ...snippets];
      setSnippets(updated);
      setActiveSnippetId(newSnippet.id);
      localStorage.setItem('sniplive_snippets', JSON.stringify(updated));
      console.log("Snippet created successfully, new active ID:", newSnippet.id);
    } catch (err) {
      console.error("Error creating snippet:", err);
    }
  };

  const deleteSnippet = (id: string) => {
    const updated = snippets.filter(s => s.id !== id);
    setSnippets(updated);
    if (activeSnippetId === id) {
      setActiveSnippetId(updated.length > 0 ? updated[0].id : null);
    }
    localStorage.setItem('sniplive_snippets', JSON.stringify(updated));
  };

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
