'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { getLiveSnippets, FirestoreSnippet, toggleFavoriteSnippet } from '@/lib/firebase-db';
import { useTheme } from '@/context/ThemeContext';
import AuthModal from '@/components/AuthModal';
import styles from './Components.module.css';

const CHIPS = ['All Components', 'HTML', 'CSS', 'JavaScript', 'React', 'Animation', 'Layout'];

export default function ComponentsPage() {
  const { user, initialized } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const [snippets, setSnippets] = useState<FirestoreSnippet[]>([]);
  const [filtered, setFiltered] = useState<FirestoreSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeChip, setActiveChip] = useState('All Components');
  const [sort, setSort] = useState('Recently Added');
  const [displayCount, setDisplayCount] = useState(9);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getLiveSnippets({ limitSize: 100 });
        setSnippets(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    let result = [...snippets];

    // Search filter
    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(s =>
        s.title?.toLowerCase().includes(lower) ||
        s.ownerName?.toLowerCase().includes(lower)
      );
    }

    // Chip filter
    if (activeChip !== 'All Components') {
      const chipLower = activeChip.toLowerCase();
      result = result.filter(s => {
        if (s.liveCategory?.toLowerCase() === chipLower) return true;
        if (s.liveTags?.some(tag => tag.toLowerCase() === chipLower)) return true;
        
        // Language fallbacks
        if (chipLower === 'html' && s.html?.trim()) return true;
        if (chipLower === 'css' && s.css?.trim()) return true;
        if (chipLower === 'javascript' && s.js?.trim()) return true;
        
        return false;
      });
    }

    // Sort
    if (sort === 'Most Popular') {
      result.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    } else if (sort === 'Alphabetical') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }
    // 'Recently Added' is default order from Firestore

    setFiltered(result);
  }, [snippets, search, sort, activeChip]);

  const visibleSnippets = filtered.slice(0, displayCount);

  const getIframeDoc = (s: FirestoreSnippet) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; overflow: hidden; background: transparent; }
            ${s.css}
          </style>
        </head>
        <body>
          ${s.html}
          <script>${s.js}</script>
        </body>
      </html>
    `;
  };

  const getLangLabel = (s: FirestoreSnippet) => {
    if (s.liveCategory) return s.liveCategory;
    const parts: string[] = [];
    if (s.html?.trim()) parts.push('HTML');
    if (s.css?.trim()) parts.push('CSS');
    if (s.js?.trim()) parts.push('JS');
    return parts.join(' • ') || 'Snippet';
  };

  const getRelativeTime = (ts: any) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className={styles.page}>
      {/* Navbar */}
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <div className={styles.navLeft}>
            <img src="/logo.png" alt="SnipLive" className={styles.logoImg} onClick={() => router.push('/')} />
            <div className={styles.navLinks}>
              <Link href="/" className={styles.navLink}>Explore</Link>
              <Link href="/components" className={styles.navLinkActive}>Components</Link>
            </div>
            <div className={styles.searchBox}>
              <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search components..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.navActions}>
            <button 
              onClick={toggleTheme}
              className={styles.themeToggleBtn}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <span className="material-symbols-outlined">
                {theme === 'light' ? 'dark_mode' : 'light_mode'}
              </span>
            </button>
            {!initialized ? (
              <div style={{ width: '120px', height: '40px', background: 'var(--surface-alt)', borderRadius: 'var(--radius-DEFAULT)', animation: 'pulse 1.5s infinite' }}></div>
            ) : user ? (
              <>
                <button
                  onClick={() => router.push(`/${user.username}`)}
                  className={styles.goToSnippetsBtn}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>code</span>
                  My Snippets
                </button>
                <div
                  className={styles.navAvatar}
                  onClick={() => router.push(`/${user.username}/profile`)}
                  style={{ cursor: 'pointer' }}
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>{(user.name || user.username || 'U')[0].toUpperCase()}</span>
                  )}
                </div>
              </>
            ) : (
              <>
                <button className={styles.loginBtn} onClick={() => { setAuthMode('signin'); setIsAuthModalOpen(true); }}>Sign in</button>
                <button className={styles.signupBtn} onClick={() => { setAuthMode('signup'); setIsAuthModalOpen(true); }}>Sign up</button>
              </>
            )}
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Page Header */}
          <header className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Component Library</h1>
            <p className={styles.pageDesc}>
              Browse and reuse high-performance UI components built by the SnipLive community. Minimalist design, maximal efficiency.
            </p>
          </header>

          {/* Filters */}
          <div className={styles.filtersRow}>
            <div className={styles.filterChips}>
              {CHIPS.map((chip) => (
                <button
                  key={chip}
                  className={`${styles.chip} ${activeChip === chip ? styles.chipActive : ''}`}
                  onClick={() => setActiveChip(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
            <div className={styles.sortRow}>
              <span className={styles.sortLabel}>Sort by</span>
              <select
                className={styles.sortSelect}
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option>Recently Added</option>
                <option>Most Popular</option>
                <option>Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className={styles.spinnerWrap}>
              <span className="material-symbols-outlined" style={{ fontSize: '36px', opacity: 0.4 }}>hourglass_empty</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>grid_view</span>
              </div>
              <h2 className={styles.emptyTitle}>No components yet</h2>
              <p className={styles.emptyDesc}>
                {search ? `No results for "${search}". Try a different search term.` : 'Be the first to publish a component! Open any snippet and click "Go Live".'}
              </p>
            </div>
          ) : (
            <>
              <div className={styles.grid}>
                {visibleSnippets.map((s, idx) => {
                  // First card is large (featured)
                  const isLarge = idx === 0;
                  const isTrending = (s.viewCount || 0) > 100;
                  const isOwnerOrCollaborator = user?.id === s.ownerId || (s.collaborators && s.collaborators.includes(user?.id || ''));
                  const snippetUrl = isOwnerOrCollaborator
                    ? `/${s.ownerUsername || s.ownerId}/snippets/${s.slug || s.id}`
                    : `/s/${s.id}-${s.slug || 'untitled'}`;
                  const isFavorited = user?.favoriteSnippets?.includes(s.id);

                  return (
                    <article
                      key={s.id}
                      className={styles.card}
                      onClick={() => router.push(snippetUrl)}
                    >
                      <div className={styles.cardPreviewBox}>
                        <iframe 
                          srcDoc={getIframeDoc(s)}
                          className={styles.cardIframe}
                          sandbox="allow-scripts"
                          scrolling="no"
                        />
                        <div className={styles.cardPreviewOverlay}></div>
                      </div>
                      
                      <div className={styles.cardInfo}>
                        <div className={styles.cardHeader}>
                          <h2 className={styles.cardTitle}>{s.liveTitle || s.title}</h2>
                          <span className={styles.cardLang}>{getLangLabel(s)}</span>
                        </div>
                        
                        <div className={styles.cardDivider}></div>
                        
                        <div className={styles.cardFooter}>
                          <div className={styles.cardStats}>
                            <span className={styles.statItem}>
                              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>visibility</span>
                              {(s.viewCount || 0).toLocaleString()}
                            </span>
                            <span className={styles.statItem}>
                              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>favorite</span>
                              {(s.likeCount || 0).toLocaleString()}
                            </span>
                          </div>
                          <span className={styles.cardTime}>{getRelativeTime(s.createdAt)}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Load More */}
              {filtered.length > displayCount && (
                <div className={styles.loadMoreSection}>
                  <button
                    className={styles.loadMoreBtn}
                    onClick={() => setDisplayCount(prev => prev + 9)}
                  >
                    Load More Components
                    <span className="material-symbols-outlined">keyboard_arrow_down</span>
                  </button>
                  <p className={styles.loadMoreCount}>
                    Showing {Math.min(displayCount, filtered.length)} of {filtered.length} components
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <span className={styles.footerBrand}>SnipLive</span>
          <span className={styles.footerCopy}>© 2024 SnipLive. Built for developers.</span>
        </div>
        <div className={styles.footerLinks}>
          <a href="#" className={styles.footerLink}>Terms</a>
          <a href="#" className={styles.footerLink}>Privacy</a>
          <a href="#" className={styles.footerLink}>Docs</a>
          <a href="#" className={styles.footerLink}>API</a>
        </div>
      </footer>
    </div>
  );
}
