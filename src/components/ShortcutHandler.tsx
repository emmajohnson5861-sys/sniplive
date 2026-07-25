'use client';

import { useEffect } from 'react';

export default function ShortcutHandler() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Create new snippet: Ctrl+N or Cmd+N
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('open-create-snippet'));
      }
      
      // Search: Ctrl+F or Cmd+F
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) {
          searchInput.focus();
        } else {
          window.dispatchEvent(new CustomEvent('focus-search'));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null;
}
