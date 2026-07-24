'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import styles from './SplitPane.module.css';
import dynamic from 'next/dynamic';
import LivePreview from './LivePreview';
import { useSnippetContext } from '@/context/SnippetContext';
import { useAuthStore } from '@/store/auth-store';

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
  
  const [htmlCode, setHtmlCode] = useState('');
  const [cssCode, setCssCode] = useState('');
  const [jsCode, setJsCode] = useState('');
  const lastSavedCloud = useRef({ id: '', html: '', css: '', js: '' });

  useEffect(() => {
    if (activeSnippet) {
      setTitle(activeSnippet.title);
      setVisibility(activeSnippet.visibility || 'private');
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
  useEffect(() => {
    if (!activeSnippet) return;
    
    // Check if there are actual changes
    if (htmlCode !== activeSnippet.html || cssCode !== activeSnippet.css || jsCode !== activeSnippet.js) {
      const timeout = setTimeout(() => {
        saveSnippet({
          ...activeSnippet,
          html: htmlCode,
          css: cssCode,
          js: jsCode
        });
        lastSavedCloud.current = { id: activeSnippet.id, html: htmlCode, css: cssCode, js: jsCode };
        setIsSaved(true);
      }, 2000); // 2 second autosave debounce
      
      setIsSaved(false);
      return () => clearTimeout(timeout);
    }
  }, [htmlCode, cssCode, jsCode, activeSnippet, saveSnippet]);

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

  if (!activeSnippet) {
    return (
      <div className={styles.emptyState}>
        Select a snippet from the sidebar or create a new one.
      </div>
    );
  }

  const isOwner = user?.id === activeSnippet.ownerId;

  return (
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
          <div className={styles.visibilityBadge}>
            <div className={`${styles.visibilityDot} ${styles[visibility]}`}></div>
            <span>{visibility}</span>
          </div>
        </div>
        <div className={styles.editorHeaderRight}>
          {!isSaved && <p className={styles.saveStatus}>Unsaved changes</p>}
          <button className="btn-primary" onClick={handleSave} disabled={!isOwner && !activeSnippet.collaborators?.includes(user?.id || '')}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
            Save
          </button>
        </div>
      </div>

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
  );
}
