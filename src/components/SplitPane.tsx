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
  
  // Local state for immediate typing performance
  const [htmlCode, setHtmlCode] = useState('');
  const [cssCode, setCssCode] = useState('');
  const [jsCode, setJsCode] = useState('');

  // Sync local state when active snippet changes
  useEffect(() => {
    if (activeSnippet) {
      setHtmlCode(activeSnippet.html);
      setCssCode(activeSnippet.css);
      setJsCode(activeSnippet.js);
    } else {
      setHtmlCode('');
      setCssCode('');
      setJsCode('');
    }
  }, [activeSnippet?.id]); // Only sync when the ID changes (not on every edit)

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
      }, 2000); // 2 second autosave debounce
      
      return () => clearTimeout(timeout);
    }
  }, [htmlCode, cssCode, jsCode, activeSnippet, saveSnippet]);

  const startDragging = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const stopDragging = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onDrag = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const newLeftWidth = (e.clientX / window.innerWidth) * 100;
      if (newLeftWidth > 10 && newLeftWidth < 90) {
        setLeftWidth(newLeftWidth);
      }
    },
    [isDragging]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onDrag);
      window.addEventListener('mouseup', stopDragging);
    } else {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', stopDragging);
    }
    return () => {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', stopDragging);
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
    <div className={styles.splitPaneContainer}>
      <div 
        className={styles.pane} 
        style={{ width: `${leftWidth}%` }}
      >
        <CodeEditor 
          html={htmlCode} setHtml={setHtmlCode}
          css={cssCode} setCss={setCssCode}
          js={jsCode} setJs={setJsCode}
        />
      </div>
      
      <div 
        className={styles.resizer} 
        onMouseDown={startDragging}
      >
        <div className={styles.resizerHandle} />
      </div>
      
      <div 
        className={styles.pane} 
        style={{ width: `${100 - leftWidth}%` }}
      >
        <div style={{ width: '100%', height: '100%', pointerEvents: isDragging ? 'none' : 'auto' }}>
          <LivePreview html={htmlCode} css={cssCode} js={jsCode} />
        </div>
      </div>
    </div>
  );
}
