'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSnippet, incrementSnippetView, FirestoreSnippet } from '@/lib/firebase-db';
import { useAuthStore, initAuthListener } from '@/store/auth-store';
import styles from './page.module.css';
import dynamic from 'next/dynamic';
import LivePreview from '@/components/LivePreview';
import { useToast } from '@/components/Toast';

const CodeEditor = dynamic(() => import('@/components/CodeEditor'), { ssr: false });

export default function SharedSnippetViewerClient() {
  const params = useParams();
  const router = useRouter();
  const { user, initialized } = useAuthStore();
  const [snippet, setSnippet] = useState<FirestoreSnippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [htmlCode, setHtmlCode] = useState('');
  const [cssCode, setCssCode] = useState('');
  const [jsCode, setJsCode] = useState('');
  const hasIncremented = useRef(false);
  const { showToast } = useToast();

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
        setHtmlCode(fetchedSnippet.html || '');
        setCssCode(fetchedSnippet.css || '');
        setJsCode(fetchedSnippet.js || '');

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

  return (
    <div className={styles.sharedViewer}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <img src="/logo.png" alt="Sniplive Logo" className={styles.logo} style={{ height: '32px' }} onClick={() => router.push('/')} />
          <h1 className={styles.title}>{snippet.title}</h1>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.actionBtn} onClick={() => {
            const url = `${window.location.origin}/s/${snippet.id}-${snippet.slug || snippet.id}`;
            navigator.clipboard.writeText(url);
            showToast('Link copied!', 'success');
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
          <CodeEditor 
            html={htmlCode} setHtml={setHtmlCode}
            css={cssCode} setCss={setCssCode}
            js={jsCode} setJs={setJsCode}
          />
        </div>

        <div className={styles.previewPanel}>
          <LivePreview html={htmlCode} css={cssCode} js={jsCode} />
        </div>
      </main>
    </div>
  );
}
