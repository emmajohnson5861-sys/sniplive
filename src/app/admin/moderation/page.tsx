'use client';

import { useEffect, useState } from 'react';
import { getReportedSnippets, unreportSnippet, deleteSnippet, FirestoreSnippet } from '@/lib/firebase-db';
import styles from './AdminModeration.module.css';

export default function AdminModeration() {
  const [snippets, setSnippets] = useState<FirestoreSnippet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReported = async () => {
    setLoading(true);
    try {
      const data = await getReportedSnippets();
      setSnippets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReported(); }, []);

  const handleDismiss = async (id: string) => {
    await unreportSnippet(id);
    fetchReported();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this snippet permanently?')) return;
    await deleteSnippet(id);
    fetchReported();
  };

  return (
    <div>
      <header className={styles.header}>
        <h1>Content Moderation</h1>
        <nav className={styles.breadcrumb}>
          <span style={{ cursor: 'pointer' }} className={styles.active}>ADMIN</span>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_right</span>
          <span className={styles.active}>MODERATION</span>
        </nav>
      </header>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      ) : snippets.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>check_circle</span>
          </div>
          <h2 className={styles.emptyTitle}>No reported snippets</h2>
          <p className={styles.emptyDesc}>All clear — nothing needs review. Grab a coffee!</p>
        </div>
      ) : (
        <div className={styles.listContainer}>
          {snippets.map((s) => (
            <div key={s.id} className={styles.snippetCard}>
              <div className={styles.iconWrapper}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>report</span>
              </div>
              
              <div className={styles.content}>
                <div className={styles.titleRow}>
                  <span className={styles.title}>{s.title}</span>
                  <span className={styles.reportBadge}>{s.reportCount} report{s.reportCount !== 1 ? 's' : ''}</span>
                </div>
                <div className={styles.meta}>
                  <span>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>person</span>
                    by {s.ownerName || s.ownerEmail}
                  </span>
                  <span>&middot;</span>
                  <span>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>calendar_today</span>
                    {s.createdAt?.toDate().toLocaleDateString() || '-'}
                  </span>
                </div>
              </div>

              <div className={styles.actions}>
                <button 
                  onClick={() => handleDismiss(s.id)} 
                  className={`${styles.btn} ${styles.btnDismiss}`}
                  title="Dismiss report"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>done</span>
                  Dismiss
                </button>
                <button 
                  onClick={() => handleDelete(s.id)} 
                  className={`${styles.btn} ${styles.btnDelete}`}
                  title="Delete snippet"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
