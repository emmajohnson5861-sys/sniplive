'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import styles from './SplitPane.module.css';
import dynamic from 'next/dynamic';
import LivePreview from './LivePreview';
import { useSnippetContext } from '@/context/SnippetContext';
import { useAuthStore } from '@/store/auth-store';
import { useSettingsStore } from '@/store/settings-store';
import { updateSnippet, toggleFavoriteSnippet } from '@/lib/firebase-db';
import GoLiveModal, { GoLiveData } from './GoLiveModal';

const CodeEditor = dynamic(() => import('./CodeEditor'), { ssr: false });

export default function SplitPane() {
  const { activeSnippet, saveSnippet, updateSnippetTitle } = useSnippetContext();
  const { user } = useAuthStore();
  
  const [leftWidth, setLeftWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  
  // Editor Header state
  const [title, setTitle] = useState(activeSnippet?.title || 'Untitled Snippet');
  const [isSaved, setIsSaved] = useState(true);
  const [visibility, setVisibility] = useState<'private' | 'unlisted' | 'public'>(activeSnippet?.visibility || 'private');
  const [isLive, setIsLive] = useState(activeSnippet?.isLive || false);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveToast, setLiveToast] = useState<string | null>(null);
  const [isGoLiveModalOpen, setIsGoLiveModalOpen] = useState(false);
  
  const [htmlCode, setHtmlCode] = useState('');
  const [cssCode, setCssCode] = useState('');
  const [jsCode, setJsCode] = useState('');
  const lastSavedCloud = useRef({ id: '', html: '', css: '', js: '' });

  useEffect(() => {
    if (activeSnippet) {
      setTitle(activeSnippet.title);
      setVisibility(activeSnippet.visibility || 'private');
      setIsLive(activeSnippet.isLive || false);
      if (lastSavedCloud.current.id !== activeSnippet.id) {
        setHtmlCode(activeSnippet.html);
        setCssCode(activeSnippet.css);
        setJsCode(activeSnippet.js);
        lastSavedCloud.current = { id: activeSnippet.id, html: activeSnippet.html, css: activeSnippet.css, js: activeSnippet.js };
        setIsSaved(true);
      } else {
        const oldCloud = { ...lastSavedCloud.current };
        if (activeSnippet.html !== oldCloud.html) {
          setHtmlCode(prev => prev === oldCloud.html ? activeSnippet.html : prev);
          lastSavedCloud.current.html = activeSnippet.html;
        }
        if (activeSnippet.css !== oldCloud.css) {
          setCssCode(prev => prev === oldCloud.css ? activeSnippet.css : prev);
          lastSavedCloud.current.css = activeSnippet.css;
        }
        if (activeSnippet.js !== oldCloud.js) {
          setJsCode(prev => prev === oldCloud.js ? activeSnippet.js : prev);
          lastSavedCloud.current.js = activeSnippet.js;
        }
      }
    } else {
      setHtmlCode('');
      setCssCode('');
      setJsCode('');
      setTitle('Untitled Snippet');
      lastSavedCloud.current = { id: '', html: '', css: '', js: '' };
    }
  }, [activeSnippet]);

  // Autosave functionality
  const { autoSave } = useSettingsStore();
  useEffect(() => {
    if (!activeSnippet || !autoSave) return;
    
    // Check if there are actual changes
    if (htmlCode !== activeSnippet.html || cssCode !== activeSnippet.css || jsCode !== activeSnippet.js) {
      const timeout = setTimeout(() => {
        saveSnippet({
          ...activeSnippet,
          html: htmlCode,
          css: cssCode,
          js: jsCode,
        });
        lastSavedCloud.current = { id: activeSnippet.id, html: htmlCode, css: cssCode, js: jsCode };
        setIsSaved(true);
      }, 2000); // 2 second autosave debounce
      
      setIsSaved(false);
      return () => clearTimeout(timeout);
    }
  }, [htmlCode, cssCode, jsCode, activeSnippet, saveSnippet]);

  // Save immediately before page unload (refresh / close tab)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeSnippet && (htmlCode !== activeSnippet.html || cssCode !== activeSnippet.css || jsCode !== activeSnippet.js)) {
        saveSnippet({
          ...activeSnippet,
          html: htmlCode,
          css: cssCode,
          js: jsCode,
        });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeSnippet, htmlCode, cssCode, jsCode, saveSnippet]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startDragging = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
  }, []);

  const stopDragging = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onDrag = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      let clientX = 0;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
      } else {
        clientX = e.clientX;
      }
      
      const newLeftWidth = (clientX / window.innerWidth) * 100;
      const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;
      const minW = isTablet ? 25 : 10;
      const maxW = isTablet ? 75 : 90;
      
      if (newLeftWidth > minW && newLeftWidth < maxW) {
        setLeftWidth(newLeftWidth);
      }
    },
    [isDragging]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onDrag);
      window.addEventListener('mouseup', stopDragging);
      window.addEventListener('touchmove', onDrag);
      window.addEventListener('touchend', stopDragging);
    } else {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('touchmove', onDrag);
      window.removeEventListener('touchend', stopDragging);
    }
    return () => {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('touchmove', onDrag);
      window.removeEventListener('touchend', stopDragging);
    };
  }, [isDragging, onDrag, stopDragging]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsSaved(false);
  };

  const handleTitleBlur = () => {
    if (activeSnippet && title !== activeSnippet.title) {
      updateSnippetTitle(activeSnippet.id, title);
      setIsSaved(true);
    }
  };

  const handleSave = () => {
    if (activeSnippet) {
      saveSnippet({ ...activeSnippet, title, html: htmlCode, css: cssCode, js: jsCode });
      lastSavedCloud.current = { id: activeSnippet.id, html: htmlCode, css: cssCode, js: jsCode };
      setIsSaved(true);
    }
  };

  const handleVisibilityChange = async (newVis: 'private' | 'unlisted' | 'public') => {
    if (!activeSnippet || !isOwner) return;
    setVisibility(newVis);
    try {
      await updateSnippet(activeSnippet.id, { visibility: newVis } as any);
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = () => {
    if (!activeSnippet) return;
    const snippetSlug = activeSnippet.slug || activeSnippet.id;
    const url = `${window.location.origin}/s/${activeSnippet.id}-${snippetSlug}`;
    navigator.clipboard.writeText(url).then(() => {
      setLiveToast('🔗 Link copied to clipboard!');
      setTimeout(() => setLiveToast(null), 2500);
    });
  };

  const handleToggleLive = async () => {
    if (!activeSnippet || !isOwner) return;
    if (!isLive) {
      // Go Live: open modal to collect metadata first
      setIsGoLiveModalOpen(true);
    } else {
      // Un-live: immediately remove
      setLiveLoading(true);
      try {
        await updateSnippet(activeSnippet.id, { isLive: false } as any);
        setIsLive(false);
        setLiveToast('Snippet removed from SnipLive Components');
        setTimeout(() => setLiveToast(null), 3000);
      } catch (e) {
        console.error(e);
      } finally {
        setLiveLoading(false);
      }
    }
  };

  const handlePublishLive = async (data: GoLiveData) => {
    if (!activeSnippet) return;
    setLiveLoading(true);
    try {
      await updateSnippet(activeSnippet.id, {
        isLive: true,
        liveTitle: data.liveTitle,
        liveCategory: data.liveCategory || null,
        liveTags: data.liveTags,
      } as any);
      setIsLive(true);
      setIsGoLiveModalOpen(false);
      setLiveToast('✅ Your snippet is now live on Components!');
      setTimeout(() => setLiveToast(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setLiveLoading(false);
    }
  };

  const isFavorited = activeSnippet ? (user?.favoriteSnippets?.includes(activeSnippet.id) || false) : false;

  if (!activeSnippet) {
    return (
      <div className={styles.emptyStateContainer}>
        {/* Contextual Decorative Elements */}
        <div className={styles.emptyStateDecorations}>
          <div className={styles.decorationBox1}>
            <div className={styles.decLine1}></div>
            <div className={styles.decLine2}></div>
            <div className={styles.decLine3}></div>
          </div>
          <div className={styles.decorationBox2}>
            <div className={styles.decDots}>
              <div className={styles.decDot1}></div>
              <div className={styles.decDot2}></div>
              <div className={styles.decDot3}></div>
            </div>
            <div className={styles.decLine4}></div>
            <div className={styles.decLine5}></div>
          </div>
        </div>
        
        {/* Centered Empty State Container */}
        <div className={styles.emptyStateCenter}>
          <div className={styles.emptyStateIconWell}>
            <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--text-secondary)' }}>draft</span>
          </div>
          <h3 className={styles.emptyStateTitle}>No Snippet Selected</h3>
          <p className={styles.emptyStateDesc}>
            Select a snippet from the sidebar to view its contents, or create a new one to start building your collection.
          </p>
          <div className={styles.emptyStateActions}>
            <button 
              className={styles.newSnippetBtn}
              onClick={() => {
                if (user?.isBanned) {
                  window.dispatchEvent(new CustomEvent('trigger-ban-shake'));
                  return;
                }
                window.dispatchEvent(new CustomEvent('open-create-snippet'));
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
              New Snippet
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts Footer (Contextual Hint) */}
        <div className={styles.emptyStateKeyboardHints}>
          <div className={styles.hintGroup}>
            <span className={styles.kbdKey}>Alt</span>
            <span className={styles.kbdKey}>N</span>
            <span>to create new</span>
          </div>
          <div className={styles.hintGroup}>
            <span className={styles.kbdKey}>Ctrl</span>
            <span className={styles.kbdKey}>F</span>
            <span>to search</span>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === activeSnippet.ownerId;

  const handleToggleFavorite = async () => {
    if (!user) return;
    
    // Optimistic UI update
    const newFavorites = isFavorited 
      ? (user.favoriteSnippets || []).filter(id => id !== activeSnippet.id)
      : [...(user.favoriteSnippets || []), activeSnippet.id];
      
    useAuthStore.getState().updateLocalUser({ favoriteSnippets: newFavorites });

    try {
      await toggleFavoriteSnippet(user.id, activeSnippet.id, !isFavorited);
    } catch (e) {
      console.error(e);
      // Revert on error
      useAuthStore.getState().updateLocalUser({ favoriteSnippets: user.favoriteSnippets });
    }
  };

  return (
    <>
    <div className={styles.mainWrapper}>
      {/* Editor Header */}
      <div className={styles.editorHeader}>
        <div className={styles.editorHeaderLeft}>
          <div className={styles.titleGroup}>
            <input 
              className={styles.titleInput}
              value={title}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              disabled={!isOwner}
            />
            {isOwner && <span className={`material-symbols-outlined ${styles.editIcon}`}>edit</span>}
          </div>
          {/* Visibility selector */}
          {isOwner ? (
            <div className={styles.visibilitySelect}>
              <div className={`${styles.visibilityDot} ${styles[visibility]}`}></div>
              <select
                className={styles.visibilityDropdown}
                value={visibility}
                onChange={(e) => handleVisibilityChange(e.target.value as 'private' | 'unlisted' | 'public')}
              >
                <option value="private">Private</option>
                <option value="unlisted">Unlisted</option>
                <option value="public">Public</option>
              </select>
            </div>
          ) : (
            <div className={styles.visibilityBadge}>
              <div className={`${styles.visibilityDot} ${styles[visibility]}`}></div>
              <span>{visibility}</span>
            </div>
          )}
        </div>
        <div className={styles.editorHeaderRight}>
          {!isSaved && <p className={styles.saveStatus}>Unsaved changes</p>}
          {/* Favorite Toggle */}
          {user && (
            <button
              onClick={handleToggleFavorite}
              title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
              className={styles.headerIconBtn}
              style={{ color: isFavorited ? 'var(--primary)' : 'inherit' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: isFavorited ? "'FILL' 1" : "'FILL' 0" }}>
                favorite
              </span>
            </button>
          )}
          {/* Share button — visible to owner and for public/unlisted snippets */}
          {(isOwner || visibility !== 'private') && (
            <button
              onClick={handleShare}
              title="Copy share link"
              className={styles.headerIconBtn}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>share</span>
            </button>
          )}
          {isOwner && (
            <button
              onClick={handleToggleLive}
              disabled={liveLoading}
              title={isLive ? 'Remove from SnipLive Components' : 'Publish to SnipLive Components'}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-DEFAULT)',
                border: `1px solid ${isLive ? 'var(--primary)' : 'var(--border-subtle)'}`,
                background: isLive ? 'rgba(126,214,205,0.1)' : 'transparent',
                color: isLive ? 'var(--primary)' : 'var(--text-secondary)',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.2s',
                opacity: liveLoading ? 0.6 : 1,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {isLive ? 'public' : 'public_off'}
              </span>
              {isLive ? 'Live' : 'Go Live'}
            </button>
          )}
          <button className="btn-primary" onClick={handleSave} disabled={!isOwner && !activeSnippet.collaborators?.includes(user?.id || '')}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
            Save
          </button>
        </div>
      </div>
      {liveToast && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--surface-container-highest)', border: '1px solid var(--primary)',
          color: 'var(--on-surface)', padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-lg)', fontSize: '13px', zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          {liveToast}
        </div>
      )}

      <div className={`${styles.splitPaneContainer} ${isMobile ? styles.splitPaneContainerMobile : ''}`}>
        {isMobile && (
          <div className={styles.mobileTabs}>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'code' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('code')}
            >
              Code
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'preview' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              Preview
            </button>
          </div>
        )}

        {(!isMobile || activeTab === 'code') && (
          <div 
            className={styles.pane} 
            style={{ width: isMobile ? '100%' : `${leftWidth}%` }}
          >
            <CodeEditor 
              html={htmlCode} setHtml={setHtmlCode}
              css={cssCode} setCss={setCssCode}
              js={jsCode} setJs={setJsCode}
            />
          </div>
        )}
        
        {!isMobile && (
          <div 
            className={styles.resizer} 
            onMouseDown={startDragging}
            onTouchStart={startDragging}
          >
            <div className={styles.resizerHandle} />
          </div>
        )}
        
        {(!isMobile || activeTab === 'preview') && (
          <div 
            className={styles.pane} 
            style={{ width: isMobile ? '100%' : `${100 - leftWidth}%` }}
          >
            <div style={{ width: '100%', height: '100%', pointerEvents: isDragging ? 'none' : 'auto', position: 'relative' }}>
              <LivePreview html={htmlCode} css={cssCode} js={jsCode} />
            </div>
          </div>
        )}
      </div>
    </div>
    <GoLiveModal
      isOpen={isGoLiveModalOpen}
      snippetTitle={title}
      onClose={() => setIsGoLiveModalOpen(false)}
      onPublish={handlePublishLive}
      loading={liveLoading}
    />
    </>
  );
}
