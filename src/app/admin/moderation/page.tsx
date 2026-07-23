'use client';

import { useEffect, useState } from 'react';
import { getReportedSnippets, unreportSnippet, deleteSnippet, FirestoreSnippet } from '@/lib/firebase-db';
import { Flag, Trash2, CheckCircle } from 'lucide-react';

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
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Content Moderation</h1>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      ) : snippets.length === 0 ? (
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center',
        }}>
          <Flag size={32} style={{ color: 'var(--success)', marginBottom: '0.75rem' }} />
          <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>No reported snippets</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>All clear — nothing needs review.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {snippets.map((s) => (
            <div key={s.id} style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem',
              display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'
            }}>
              <Flag size={16} style={{ color: 'var(--error)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{s.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  by {s.ownerName || s.ownerEmail} &middot; {s.reportCount} report{s.reportCount !== 1 ? 's' : ''} &middot; {s.createdAt?.toDate().toLocaleDateString() || '-'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                <button onClick={() => handleDismiss(s.id)} title="Dismiss report" style={{
                  padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)', background: 'transparent',
                  color: 'var(--success)', cursor: 'pointer',
                }}>
                  <CheckCircle size={14} />
                </button>
                <button onClick={() => handleDelete(s.id)} title="Delete snippet" style={{
                  padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)', background: 'transparent',
                  color: 'var(--error)', cursor: 'pointer',
                }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
