'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FirestoreSnippet } from '@/lib/firebase-db';
import { Eye, Heart } from 'lucide-react';
import styles from './SnippetPreviewCard.module.css';

interface SnippetPreviewCardProps {
  snippet: FirestoreSnippet;
  isOwner?: boolean;
}

export default function SnippetPreviewCard({ snippet, isOwner }: SnippetPreviewCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Only load once
        }
      },
      { rootMargin: '100px' } // Load slightly before it comes into view
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; padding: 0; overflow: hidden; background: #fff; transform: scale(0.5); transform-origin: top left; width: 200%; height: 200%; }
          ${snippet.css}
        </style>
      </head>
      <body>
        ${snippet.html}
        <script>
          try {
            ${snippet.js}
          } catch(e){}
        </script>
      </body>
    </html>
  `;

  return (
    <div ref={containerRef} className={styles.cardContainer}>
      <Link href={`/${snippet.ownerUsername || snippet.ownerId}/snippets/${snippet.slug || snippet.id}`} className={styles.linkWrapper}>
        {/* Preview Area */}
        <div className={styles.previewArea}>
          
          {/* Editor Chrome Bar */}
          <div className={styles.chromeBar}>
            <div className={styles.chromeDot} />
            <div className={styles.chromeDot} />
            <div 
              className={`${styles.chromeDotRightmost} ${styles[snippet.visibility || 'private']}`} 
              title={isOwner ? `Visibility: ${snippet.visibility || 'private'}` : undefined}
            />
          </div>

          {/* Overlay to prevent interactions with iframe */}
          <div className={styles.overlay}></div>
          {isVisible && (
            <iframe
              srcDoc={srcDoc}
              sandbox="allow-scripts"
              className={styles.iframeContainer}
              tabIndex={-1}
            />
          )}
        </div>

        {/* Info Area */}
        <div className={styles.infoArea}>
          <div className={styles.titleRow}>
            <h3 className={styles.title} title={snippet.title}>
              {snippet.title}
            </h3>
          </div>
          <div className={styles.statsRow}>
            <div className={styles.stats}>
              <span className={styles.statItem}>
                <Eye size={14} /> {snippet.viewCount || 0}
              </span>
              <span className={styles.statItem}>
                <Heart size={14} /> {snippet.likeCount || 0}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
