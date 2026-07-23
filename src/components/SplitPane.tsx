'use client';

import React, { useState, useCallback, useEffect } from 'react';
import styles from './SplitPane.module.css';
import dynamic from 'next/dynamic';
import LivePreview from './LivePreview';
import { useSnippetContext } from '@/context/SnippetContext';

const CodeEditor = dynamic(() => import('./CodeEditor'), { ssr: false });

export default function SplitPane() {
  const { activeSnippet, saveSnippet } = useSnippetContext();
  const [leftWidth, setLeftWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  
  // Local state for immediate typing performance
  const [htmlCode, setHtmlCode] = useState('');
  const [cssCode, setCssCode] = useState('');
  const [jsCode, setJsCode] = useState('');
  const lastSavedCloud = React.useRef({ id: '', html: '', css: '', js: '' });

  useEffect(() => {
    if (activeSnippet) {
      if (lastSavedCloud.current.id !== activeSnippet.id) {
        setHtmlCode(activeSnippet.html);
        setCssCode(activeSnippet.css);
        setJsCode(activeSnippet.js);
        lastSavedCloud.current = { id: activeSnippet.id, html: activeSnippet.html, css: activeSnippet.css, js: activeSnippet.js };
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
      lastSavedCloud.current = { id: '', html: '', css: '', js: '' };
    }
  }, [activeSnippet]); // Sync when activeSnippet data changes from cloud

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
      }, 2000); // 2 second autosave debounce
      
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

  if (!activeSnippet) {
    return (
      <div className={styles.emptyState}>
        Select a snippet from the sidebar or create a new one.
      </div>
    );
  }

  return (
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
          <div style={{ width: '100%', height: '100%', pointerEvents: isDragging ? 'none' : 'auto' }}>
            <LivePreview html={htmlCode} css={cssCode} js={jsCode} />
          </div>
        </div>
      )}
    </div>
  );
}
