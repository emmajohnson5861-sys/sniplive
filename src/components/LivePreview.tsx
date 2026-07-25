'use client';

import React, { useState, useEffect } from 'react';
import styles from './LivePreview.module.css';
import { Play } from 'lucide-react';

interface LivePreviewProps {
  html: string;
  css: string;
  js: string;
  react?: string;
}

function buildReactDoc(css: string, reactCode: string): string {
  // Strip any existing import statements so they don't double-import
  const strippedCode = reactCode
    .replace(/^import\s+.*?from\s+['"]react['"]\s*;?\s*/gm, '')
    .replace(/^import\s+.*?from\s+['"]react-dom['"]\s*;?\s*/gm, '');

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; font-family: sans-serif; }
      ${css}
    </style>
  </head>
  <body>
    <div id="root"></div>
    <!-- Load React + ReactDOM via esm.sh as globals for Babel standalone -->
    <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@18",
        "react-dom/client": "https://esm.sh/react-dom@18/client"
      }
    }
    </script>
    <script type="module">
      import React from 'react';
      import { createRoot } from 'react-dom/client';

      // Expose React globally so Babel-transpiled JSX calls React.createElement
      window.React = React;
      window.createRoot = createRoot;
    </script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script type="text/babel" data-presets="react">
      const { useState, useEffect, useRef, useCallback, useMemo, useReducer, useContext, createContext } = React;

      ${strippedCode}

      // Auto-detect and render the exported default component
      try {
        const root = window.createRoot(document.getElementById('root'));
        root.render(React.createElement(App));
      } catch(e) {
        document.getElementById('root').innerHTML =
          '<div style="color:#ff6b6b;padding:1rem;font-family:monospace;font-size:13px;">' +
          '<strong>React Error:</strong><br>' + e.message + '</div>';
      }
    </script>
  </body>
</html>`;
}

function buildHtmlDoc(html: string, css: string, js: string): string {
  return `<!DOCTYPE html>
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
}

export default function LivePreview({ html, css, js, react = '' }: LivePreviewProps) {
  const [srcDoc, setSrcDoc] = useState('');
  const isReactMode = react.trim().length > 0;

  useEffect(() => {
    const timeout = setTimeout(() => {
      const doc = isReactMode
        ? buildReactDoc(css, react)
        : buildHtmlDoc(html, css, js);
      setSrcDoc(doc);
    }, 400);

    return () => clearTimeout(timeout);
  }, [html, css, js, react, isReactMode]);

  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewHeader}>
        <div className={styles.title}>
          {isReactMode ? (
            <>
              <span style={{ fontSize: '13px' }}>⚛</span>
              React Preview
            </>
          ) : (
            <>
              <Play size={14} className={styles.icon} />
              Live Preview
            </>
          )}
        </div>
        {isReactMode && (
          <span style={{
            fontSize: '11px',
            color: '#61dafb99',
            padding: '2px 8px',
            border: '1px solid #61dafb33',
            borderRadius: '4px',
          }}>
            JSX · Babel
          </span>
        )}
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
