'use client';

import React, { useState, useEffect } from 'react';
import styles from './LivePreview.module.css';
import { Play } from 'lucide-react';

interface LivePreviewProps {
  html: string;
  css: string;
  js: string;
}

export default function LivePreview({ html, css, js }: LivePreviewProps) {
  const [srcDoc, setSrcDoc] = useState('');

  useEffect(() => {
    // Debounce the preview update (300ms as per PRD)
    const timeout = setTimeout(() => {
      const document = `
        <!DOCTYPE html>
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
        </html>
      `;
      setSrcDoc(document);
    }, 300);

    return () => clearTimeout(timeout);
  }, [html, css, js]);

  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewHeader}>
        <div className={styles.title}>
          <Play size={14} className={styles.icon} />
          Live Preview
        </div>
      </div>
      <div className={styles.iframeWrapper}>
        <iframe
          srcDoc={srcDoc}
          title="Live Preview"
          sandbox="allow-scripts" // Security requirement: NO allow-same-origin
          className={styles.iframe}
        />
      </div>
    </div>
  );
}
