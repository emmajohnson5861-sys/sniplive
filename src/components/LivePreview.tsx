'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './LivePreview.module.css';
import { Play, RotateCcw } from 'lucide-react';

interface LivePreviewProps {
  html: string;
  css: string;
  js: string;
}

export default function LivePreview({ html, css, js }: LivePreviewProps) {
  const [srcDoc, setSrcDoc] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      const doc = `<!DOCTYPE html>
<html>
  <head>
    <style>${css}</style>
  </head>
  <body>
    ${html}
    <script>
      try {
        ${js}
      } catch (err) {
        console.error(err);
      }
    </script>
  </body>
</html>`;
      setSrcDoc(doc);
    }, 300);

    return () => clearTimeout(timeout);
  }, [html, css, js]);

  const handleRefresh = useCallback(() => {
    setSrcDoc('');
    requestAnimationFrame(() => {
      const doc = `<!DOCTYPE html>
<html>
  <head>
    <style>${css}</style>
  </head>
  <body>
    ${html}
    <script>
      try {
        ${js}
      } catch (err) {
        console.error(err);
      }
    </script>
  </body>
</html>`;
      setSrcDoc(doc);
    });
  }, [html, css, js]);

  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewHeader}>
        <div className={styles.title}>
          <Play size={14} className={styles.icon} />
          Live Preview
        </div>
        <button className={styles.refreshBtn} onClick={handleRefresh} title="Refresh preview">
          <RotateCcw size={14} />
        </button>
      </div>
      <div className={styles.iframeWrapper}>
        <iframe
          srcDoc={srcDoc}
          title="Live Preview"
          sandbox="allow-scripts"
          className={styles.iframe}
        />
      </div>
    </div>
  );
}
