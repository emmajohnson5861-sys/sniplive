'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Sidebar.module.css';
import { Code2, Plus, Search, FileCode2, UserCircle2, Sun, Moon, Trash2, Shield, Folder, FolderPlus, Globe, Share2 } from 'lucide-react';
import { useSnippetContext, Group } from '@/context/SnippetContext';
import { useAuthStore, initAuthListener } from '@/store/auth-store';
import AuthModal from './AuthModal';
import GroupShareModal from './GroupShareModal';

export default function Sidebar() {
  const { snippets, groups, activeSnippetId, setActiveSnippetId, createNewSnippet, deleteSnippet, createNewGroup, deleteGroup } = useSnippetContext();
  const { user, firebaseUser, initialized, logout } = useAuthStore();
  const router = useRouter();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeShareGroup, setActiveShareGroup] = useState<Group | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
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
  const filteredGroups = groups.filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleCreateGroup = () => {
    const title = prompt("Enter collection name:");
    if (title) createNewGroup(title, '');
  };

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

        {firebaseUser && (
          <>
            <div className={styles.libraryHeader}>
              Collections
              <button onClick={handleCreateGroup} title="New Collection">
                <FolderPlus size={16} />
              </button>
            </div>
            
            <div className={styles.groupList}>
              {filteredGroups.map(group => (
                <div 
                  key={group.id} 
                  className={styles.snippetItem}
                  onClick={() => router.push(`/g/${group.id}`)}
                >
                  <Folder size={16} className={styles.iconInactive} />
                  <div className={styles.snippetInfo}>
                    <div className={styles.snippetTitle}>{group.title}</div>
                    <div className={styles.snippetDate}>
                      {group.snippetIds.length} snippets
                    </div>
                  </div>
                  <div className={styles.actionBtns}>
                    <button
                      className={`${styles.actionBtn} ${styles.actionBtnShare}`}
                      onClick={(e) => { e.stopPropagation(); setActiveShareGroup(group); }}
                      title="Share collection"
                    >
                      <Share2 size={14} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={(e) => { e.stopPropagation(); deleteGroup(group.id); }}
                      title="Delete collection"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className={styles.userProfile}>
          {initialized && user ? (
            <>
              {user.avatarUrl && <img src={user.avatarUrl} alt="" className={styles.avatar} />}
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.name || user.email}</span>
                <span className={styles.userEmail}>{user.email}</span>
              </div>
              <button className={styles.adminBtn} onClick={() => router.push(`/u/${user.username || firebaseUser?.uid}`)} title="My Public Profile">
                <Globe size={16} />
              </button>
              {(user.role === 'ADMIN' || user.role === 'EDITOR') && (
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

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} defaultMode={authMode} />
      {activeShareGroup && (
        <GroupShareModal isOpen={true} onClose={() => setActiveShareGroup(null)} group={activeShareGroup} />
      )}
    </>
  );
}
