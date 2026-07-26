'use client';

import React, { useState } from 'react';
import Modal from './Modal';

interface CreateSnippetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => Promise<void> | void;
}

export default function CreateSnippetModal({ isOpen, onClose, onCreate }: CreateSnippetModalProps) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      setLoading(true);
      try {
        await onCreate(title.trim());
        setTitle('');
        onClose();
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Name your snippet">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Snippet Name</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Cool Button Animation"
            required
            autoFocus
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-container-highest)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
        </div>
        
        <button type="submit" disabled={loading} style={{
          width: '100%',
          padding: '0.75rem',
          backgroundColor: 'var(--primary)',
          color: 'var(--on-primary)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'filter 0.2s',
          opacity: loading ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }} onMouseEnter={(e) => { if (!loading) e.currentTarget.style.filter = 'brightness(1.1)' }} onMouseLeave={(e) => { if (!loading) e.currentTarget.style.filter = 'none' }}>
          {loading && <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>progress_activity</span>}
          {loading ? 'Creating...' : 'Create Snippet'}
        </button>
      </form>
    </Modal>
  );
}
