'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSnippet, incrementSnippetView, FirestoreSnippet } from '@/lib/firebase-db';
import { useAuthStore, initAuthListener } from '@/store/auth-store';
import styles from './page.module.css';

export default function SharedSnippetViewer() {
  const params = useParams();
  const router = useRouter();
  const { user, initialized } = useAuthStore();
  const [snippet, setSnippet] = useState<FirestoreSnippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasIncremented = useRef(false);

  useEffect(() => {
    initAuthListener();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const fetchSnippet = async () => {
      try {
        const shareSlug = params.shareSlug as string;
        // shareSlug is typically "[id]-[slug]", so we split by '-' to get the ID.
        // If there's no '-', the whole thing might be the ID.
        const id = shareSlug.split('-')[0];

        const fetchedSnippet = await getSnippet(id);
        if (!fetchedSnippet) {
          setError('Snippet not found.');
          setLoading(false);
          return;
        }

        // Privacy Check
        if (fetchedSnippet.visibility === 'private' && (!user || user.id !== fetchedSnippet.ownerId)) {
          setError('This snippet is private.');
          setLoading(false);
          return;
        }

        setSnippet(fetchedSnippet);

        // Increment View Count (only once per session)
        if (!hasIncremented.current) {
          hasIncremented.current = true;
          incrementSnippetView(id).catch(console.error);
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load snippet.');
        setLoading(false);
      }
    };

    fetchSnippet();
  }, [params.shareSlug, initialized, user]);

  if (!initialized || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading snippet...</p>
      </div>
    );
  }

  if (error || !snippet) {
    return (
      <div className={styles.errorContainer}>
        <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--error)' }}>
          lock
        </span>
        <h2>Access Denied</h2>
        <p>{error}</p>
        <button className={styles.homeBtn} onClick={() => router.push('/')}>
          Go Home
        </button>
      </div>
    );
  }

  const iframeSrc = `data:text/html;charset=utf-8,${encodeURIComponent(`
    <html>
      <head><style>body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: transparent; color: white; font-family: sans-serif; } ${snippet.css}</style></head>
      <body>${snippet.html}<script>${snippet.js}</script></body>
    </html>
  `)}`;

  return (
    <div className={styles.sharedViewer}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <img src="/logo.png" alt="Sniplive Logo" className={styles.logo} style={{ height: '32px' }} onClick={() => router.push('/')} />
          <h1 className={styles.title}>{snippet.title}</h1>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.actionBtn} onClick={() => {
            const url = `${window.location.origin}/s/${snippet.id}-${snippet.slug}`;
            navigator.clipboard.writeText(url);
            alert('Link copied!');
          }}>
            <span className="material-symbols-outlined">share</span>
            Share
          </button>
          <button className={styles.primaryBtn} onClick={() => router.push('/')}>
            Create your own
          </button>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.codePanel}>
          <div className={styles.codeTabs}>
            <div className={styles.tab}>HTML</div>
          </div>
          <div className={styles.codeEditor}>
            <pre><code>{snippet.html}</code></pre>
          </div>
          <div className={styles.codeTabs}>
            <div className={styles.tab}>CSS</div>
          </div>
          <div className={styles.codeEditor}>
            <pre><code>{snippet.css}</code></pre>
          </div>
          <div className={styles.codeTabs}>
            <div className={styles.tab}>JS</div>
          </div>
          <div className={styles.codeEditor}>
            <pre><code>{snippet.js}</code></pre>
          </div>
        </div>

        <div className={styles.previewPanel}>
          <iframe 
            src={iframeSrc}
            className={styles.iframe}
            sandbox="allow-scripts"
            title={snippet.title}
          />
        </div>
      </main>
    </div>
  );
}
