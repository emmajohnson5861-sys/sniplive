'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Sidebar.module.css';
import { useSnippetContext, Group } from '@/context/SnippetContext';
import { useAuthStore, initAuthListener } from '@/store/auth-store';
import AuthModal from './AuthModal';
import GroupShareModal from './GroupShareModal';
import CreateSnippetModal from './CreateSnippetModal';
import { useSidebar } from '@/context/SidebarContext';

export default function Sidebar() {
  const { snippets, groups, activeSnippetId, setActiveSnippetId, createNewSnippet, deleteSnippet, createNewGroup, deleteGroup } = useSnippetContext();
  const { user, firebaseUser, initialized, logout } = useAuthStore();
  const { isOpen, closeMobile } = useSidebar();
  const router = useRouter();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeShareGroup, setActiveShareGroup] = useState<Group | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    initAuthListener();
  }, []);

  const filteredSnippets = snippets.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredGroups = groups.filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleCreateGroup = () => {
    const title = prompt("Enter collection name:");
    if (title) createNewGroup(title, '');
  };

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
          <div className={styles.snippetItem}>
            <span className="material-symbols-outlined">code_blocks</span>
            <span style={{ fontWeight: 500, flex: 1 }}>All Snippets</span>
          </div>

          {filteredSnippets.map(snippet => (
            <div 
              key={snippet.id} 
              className={`${styles.snippetItem} ${activeSnippetId === snippet.id ? styles.active : ''}`}
              onClick={() => {
                setActiveSnippetId(snippet.id);
                closeMobile();
              }}
              style={{ paddingLeft: '3rem' }} // indent slightly under 'All Snippets'
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

          {firebaseUser && (
            <>
              <div className={styles.snippetItem} style={{ marginTop: 'var(--space-2)' }}>
                <span className="material-symbols-outlined">folder</span>
                <span style={{ fontWeight: 500, flex: 1 }}>Collections</span>
                <button onClick={handleCreateGroup} title="New Collection" style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>create_new_folder</span>
                </button>
              </div>
              
              <div>
                {filteredGroups.map(group => (
                  <div 
                    key={group.id} 
                    className={styles.snippetItem}
                    onClick={() => {
                      router.push(`/${user?.username}/c/${group.slug || group.id}`);
                      closeMobile();
                    }}
                    style={{ paddingLeft: '3rem' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>folder_open</span>
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
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>share</span>
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={(e) => { e.stopPropagation(); deleteGroup(group.id); }}
                        title="Delete collection"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </nav>

        <div className={styles.userProfile}>
          <a href="#" className={styles.settingsLink}>
            <span className="material-symbols-outlined">settings</span>
            <span style={{ fontWeight: 500 }}>Settings</span>
          </a>
          
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
      {activeShareGroup && (
        <GroupShareModal isOpen={true} onClose={() => setActiveShareGroup(null)} group={activeShareGroup} />
      )}
      <CreateSnippetModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateSnippet} />
    </>
  );
}
