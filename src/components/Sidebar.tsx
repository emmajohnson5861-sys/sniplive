'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Sidebar.module.css';
import { Code2, Plus, Search, FileCode2, UserCircle2, Sun, Moon, Trash2, Shield } from 'lucide-react';
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
            <button className={styles.userButton} onClick={() => setIsAuthModalOpen(true)}>
              <UserCircle2 size={24} color="var(--text-secondary)" />
              <span>Sign In</span>
            </button>
          )}
          <button className={styles.themeToggle} onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {isAuthModalOpen && (
        <div className="fixed inset-0" style={{position: 'fixed', zIndex: 50, top:0, left:0, right:0, bottom:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.6)'}}>
          <div style={{background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
             <h2 style={{fontSize:'1.5rem', textAlign: 'center', marginBottom: '0.5rem'}}>Welcome back</h2>
             <p style={{color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem', marginBottom: '1rem'}}>Log in to access your cloud snippets</p>
             <button className="btn-secondary" style={{width: '100%', padding: '0.75rem', justifyContent: 'center'}} onClick={async () => { await signIn(); setIsAuthModalOpen(false); }}>
                Continue with Google
              </button>
             <button className="btn-secondary" onClick={() => setIsAuthModalOpen(false)} style={{marginTop: '1rem', width: '100%', border: 'none', background: 'transparent'}}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
