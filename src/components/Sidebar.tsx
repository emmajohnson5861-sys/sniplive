'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Sidebar.module.css';
import { Code2, Plus, Search, FileCode2, UserCircle2, Sun, Moon, Trash2, Shield, LogIn, UserPlus } from 'lucide-react';
import { useSnippetContext } from '@/context/SnippetContext';
import { useAuthStore, initAuthListener } from '@/store/auth-store';

export default function Sidebar() {
  const { snippets, activeSnippetId, setActiveSnippetId, createNewSnippet, deleteSnippet } = useSnippetContext();
  const { user, initialized, signIn, logout } = useAuthStore();
  const router = useRouter();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    initAuthListener();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('sniplive_theme') as 'dark' | 'light' | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.dataset.theme = saved;
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem('sniplive_theme', next);
  };

  const filteredSnippets = snippets.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      <div className={styles.sidebar}>
        <div className={styles.logoArea}>
          <div className={styles.logo}>
            <Code2 size={24} color="var(--accent-primary)" />
            Snip<span>Live</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button className="btn-primary w-full" onClick={() => {
            console.log("Button 'New Snippet' clicked in Sidebar!");
            createNewSnippet();
          }}>
            <Plus size={16} />
            New Snippet
          </button>
        </div>

        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search snippets..." 
            className={styles.searchInput} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.libraryHeader}>
          My Library
        </div>

        <div className={styles.snippetList}>
          {filteredSnippets.map(snippet => (
            <div 
              key={snippet.id} 
              className={`${styles.snippetItem} ${snippet.id === activeSnippetId ? styles.active : ''}`}
              onClick={() => setActiveSnippetId(snippet.id)}
            >
              <FileCode2 size={16} className={snippet.id === activeSnippetId ? styles.iconActive : styles.iconInactive} />
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
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className={styles.userProfile}>
          {initialized && user ? (
            <>
              {user.avatarUrl && <img src={user.avatarUrl} alt="" className={styles.avatar} />}
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.name || user.email}</span>
                <span className={styles.userEmail}>{user.email}</span>
              </div>
              {user.role === 'ADMIN' && (
                <button className={styles.adminBtn} onClick={() => router.push('/admin')} title="Admin Panel">
                  <Shield size={16} />
                </button>
              )}
              <button className={styles.logoutBtn} onClick={logout} title="Sign out">Sign Out</button>
            </>
          ) : (
            <>
              <button className={styles.userButton} onClick={() => setIsAuthModalOpen(true)}>
                <UserCircle2 size={24} color="var(--text-secondary)" />
                <span>Sign In</span>
              </button>
              <button className={styles.signUpBtn} onClick={() => setIsAuthModalOpen(true)}>
                <UserPlus size={16} />
                <span>Sign Up</span>
              </button>
            </>
          )}
          <button className={styles.themeToggle} onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {isAuthModalOpen && (
        <div className="fixed inset-0" style={{position: 'fixed', zIndex: 50, top:0, left:0, right:0, bottom:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.6)'}}>
          <div style={{background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
             <h2 style={{fontSize:'1.5rem', textAlign: 'center', marginBottom: '0.5rem', color: 'var(--text-primary)'}}>Welcome to SnipLive</h2>
             <p style={{color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem', marginBottom: '1rem'}}>Sign in or create an account to save your snippets to the cloud</p>
             <button className="btn-secondary" style={{width: '100%', padding: '0.75rem', justifyContent: 'center', gap: '0.75rem', display: 'flex', alignItems: 'center'}} onClick={async () => { await signIn(); setIsAuthModalOpen(false); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
             <button className="btn-secondary" onClick={() => setIsAuthModalOpen(false)} style={{marginTop: '0.5rem', width: '100%', border: 'none', background: 'transparent'}}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
