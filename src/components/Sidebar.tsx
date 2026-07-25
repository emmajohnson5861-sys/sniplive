'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Sidebar.module.css';
import { useSnippetContext } from '@/context/SnippetContext';
import { useAuthStore, initAuthListener } from '@/store/auth-store';
import AuthModal from './AuthModal';
import CreateSnippetModal from './CreateSnippetModal';
import { useSidebar } from '@/context/SidebarContext';
import { useTheme } from '@/context/ThemeContext';

export default function Sidebar() {
  const { snippets, activeSnippetId, setActiveSnippetId, createNewSnippet, deleteSnippet } = useSnippetContext();
  const { user, firebaseUser, initialized, logout } = useAuthStore();
  const { isOpen, closeMobile } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  useEffect(() => {
    initAuthListener();

    const handleOpenCreateSnippet = () => setIsCreateModalOpen(true);
    window.addEventListener('open-create-snippet', handleOpenCreateSnippet);
    return () => window.removeEventListener('open-create-snippet', handleOpenCreateSnippet);
  }, []);

  const filteredSnippets = snippets.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || user?.favoriteSnippets?.includes(s.id);
    return matchesSearch && matchesFilter;
  });

  const handleCreateSnippet = (title: string) => {
    if (user?.isBanned) {
      window.dispatchEvent(new CustomEvent('trigger-ban-shake'));
      return;
    }
    createNewSnippet(title);
  };

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={closeMobile} />}
      <div className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        
        <div className={styles.actions}>
          <button className={styles.newSnippetBtn} onClick={() => {
            if (user?.isBanned) {
              window.dispatchEvent(new CustomEvent('trigger-ban-shake'));
              return;
            }
            setIsCreateModalOpen(true);
          }}>
            <span className="material-symbols-outlined">add</span>
            New Snippet
          </button>
        </div>

        <nav className={styles.navLinks}>
          <div 
            className={`${styles.snippetItem} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => {
              setFilter('all');
              closeMobile();
            }}
          >
            <span className="material-symbols-outlined">code_blocks</span>
            <span style={{ fontWeight: 500, flex: 1 }}>All Snippets</span>
          </div>
          <div 
            className={`${styles.snippetItem} ${filter === 'favorites' ? styles.active : ''}`}
            onClick={() => {
              setFilter('favorites');
              closeMobile();
            }}
          >
            <span className="material-symbols-outlined">favorite</span>
            <span style={{ fontWeight: 500, flex: 1 }}>Favorites</span>
          </div>

          {filteredSnippets.map(snippet => (
            <div 
              key={snippet.id} 
              className={`${styles.snippetItem} ${activeSnippetId === snippet.id ? styles.active : ''}`}
              onClick={() => {
                setActiveSnippetId(snippet.id);
                const ownerId = snippet.ownerUsername || snippet.ownerId;
                router.push(`/${ownerId}/snippets/${snippet.slug || snippet.id}`);
                closeMobile();
              }}
              style={{ paddingLeft: '3rem' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>description</span>
              <div className={styles.snippetInfo}>
                <div className={styles.snippetTitle}>{snippet.title}</div>
                <div className={styles.snippetDate}>
                  {new Date(snippet.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <button
                className={styles.deleteBtn}
                onClick={(e) => { e.stopPropagation(); deleteSnippet(snippet.id); }}
                title="Delete snippet"
                style={{ position: 'absolute', right: '1rem', background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
              </button>
            </div>
          ))}
        </nav>

        <div className={styles.userProfile}>
          <a href="#" className={styles.settingsLink} onClick={(e) => { e.preventDefault(); toggleTheme(); }}>
            <span className="material-symbols-outlined">
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
            <span style={{ fontWeight: 500 }}>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </a>
          {initialized && user && (
            <a href={`/${user.username}/settings`} className={styles.settingsLink} onClick={(e) => { e.preventDefault(); router.push(`/${user.username}/settings`); closeMobile(); }}>
              <span className="material-symbols-outlined">settings</span>
              <span style={{ fontWeight: 500 }}>Settings</span>
            </a>
          )}
          {initialized && user && (
            <a href={`/${user.username}/profile`} className={styles.settingsLink} onClick={(e) => { e.preventDefault(); router.push(`/${user.username}/profile`); closeMobile(); }}>
              <span className="material-symbols-outlined">person</span>
              <span style={{ fontWeight: 500 }}>Profile</span>
            </a>
          )}
          
          {initialized && user && (user.role === 'ADMIN' || user.role === 'EDITOR') && (
            <a href="/admin" className={styles.settingsLink} onClick={(e) => { e.preventDefault(); router.push('/admin'); }}>
              <span className="material-symbols-outlined">shield</span>
              <span style={{ fontWeight: 500 }}>Admin Panel</span>
            </a>
          )}
          {initialized && user && (
            <a href="#" className={styles.settingsLink} onClick={(e) => { e.preventDefault(); logout(); }}>
              <span className="material-symbols-outlined">logout</span>
              <span style={{ fontWeight: 500 }}>Sign Out</span>
            </a>
          )}
        </div>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} defaultMode={authMode} />
      <CreateSnippetModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateSnippet} />
    </>
  );
}
