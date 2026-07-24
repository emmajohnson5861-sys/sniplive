'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';
import styles from './GoLiveModal.module.css';

const CATEGORIES = [
  { label: 'HTML',       icon: 'code' },
  { label: 'CSS',        icon: 'palette' },
  { label: 'JavaScript', icon: 'javascript' },
  { label: 'React',      icon: 'hub' },
  { label: 'Animation',  icon: 'animation' },
  { label: 'Layout',     icon: 'dashboard' },
  { label: 'UI',         icon: 'widgets' },
  { label: 'Backend',    icon: 'dns' },
  { label: 'DevOps',     icon: 'terminal' },
];

export interface GoLiveData {
  liveTitle: string;
  liveCategory: string;
  liveTags: string[];
}

interface GoLiveModalProps {
  isOpen: boolean;
  snippetTitle: string;
  onClose: () => void;
  onPublish: (data: GoLiveData) => void;
  loading?: boolean;
}

export default function GoLiveModal({ isOpen, snippetTitle, onClose, onPublish, loading }: GoLiveModalProps) {
  const [liveTitle, setLiveTitle] = useState(snippetTitle || '');
  const [liveCategory, setLiveCategory] = useState('');
  const [liveTags, setLiveTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/,+$/, '').trim();
    if (tag && !liveTags.includes(tag) && liveTags.length < 6) {
      setLiveTags(prev => [...prev, tag]);
    }
    setTagInput('');
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && tagInput === '' && liveTags.length > 0) {
      setLiveTags(prev => prev.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => setLiveTags(prev => prev.filter(t => t !== tag));

  const handlePublish = () => {
    if (!liveTitle.trim()) return;
    onPublish({ liveTitle: liveTitle.trim(), liveCategory, liveTags });
  };

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.liveIcon}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>public</span>
            </div>
            <div className={styles.headerText}>
              <h2 className={styles.headerTitle}>Go Live</h2>
              <p className={styles.headerDesc}>Publish this snippet to the SnipLive Components library</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Display Name */}
          <div className={styles.field}>
            <label className={styles.label}>Component Name</label>
            <input
              className={styles.input}
              type="text"
              value={liveTitle}
              onChange={e => setLiveTitle(e.target.value)}
              placeholder="e.g., Animated Button, Bento Grid Layout..."
              autoFocus
              maxLength={80}
            />
          </div>

          {/* Category */}
          <div className={styles.field}>
            <label className={styles.label}>Category</label>
            <div className={styles.categoryGrid}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.label}
                  className={`${styles.categoryChip} ${liveCategory === cat.label ? styles.categoryChipActive : ''}`}
                  onClick={() => setLiveCategory(prev => prev === cat.label ? '' : cat.label)}
                  type="button"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className={styles.field}>
            <label className={styles.label}>Tags <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(up to 6)</span></label>
            <div
              className={styles.tagsInput}
              onClick={() => tagInputRef.current?.focus()}
            >
              {liveTags.map(tag => (
                <span key={tag} className={styles.tag}>
                  {tag}
                  <button className={styles.tagRemove} onClick={() => removeTag(tag)} type="button">
                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>close</span>
                  </button>
                </span>
              ))}
              {liveTags.length < 6 && (
                <input
                  ref={tagInputRef}
                  className={styles.tagTextInput}
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
                  placeholder={liveTags.length === 0 ? 'Type a tag, press Enter or comma...' : ''}
                />
              )}
            </div>
            <p className={styles.tagHint}>e.g., button, dark-mode, responsive, hover-effect</p>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className={styles.publishBtn}
            onClick={handlePublish}
            disabled={loading || !liveTitle.trim()}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', animation: 'spin 1s linear infinite' }}>sync</span>
                Publishing...
              </>
            ) : (
              <>
                <span className={styles.liveDot}></span>
                Publish Live
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
