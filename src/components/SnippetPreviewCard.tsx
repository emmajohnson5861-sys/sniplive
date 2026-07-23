'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FirestoreSnippet } from '@/lib/firebase-db';
import { Eye, Heart } from 'lucide-react';

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
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-color)', transition: 'transform 0.2s', cursor: 'pointer' }}
         onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
         onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
      
      <Link href={`/s/${snippet.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Preview Area */}
        <div style={{ position: 'relative', width: '100%', paddingTop: '60%', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', overflow: 'hidden' }}>
          {/* Overlay to prevent interactions with iframe */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}></div>
          {isVisible && (
            <iframe
              srcDoc={srcDoc}
              sandbox="allow-scripts"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
              tabIndex={-1}
            />
          )}
        </div>

        {/* Info Area */}
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {snippet.title}
            </h3>
            {isOwner && (
              <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '12px', background: snippet.visibility === 'public' ? 'rgba(46, 160, 67, 0.2)' : 'rgba(255, 255, 255, 0.1)', color: snippet.visibility === 'public' ? '#3fb950' : 'var(--text-secondary)', textTransform: 'capitalize' }}>
                {snippet.visibility}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Eye size={14} /> {snippet.viewCount || 0}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Heart size={14} /> {snippet.likeCount || 0}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
