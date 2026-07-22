'use client';

import React, { useState, useEffect } from 'react';
import styles from './Header.module.css';
import { Share2, Save, Trash2 } from 'lucide-react';
import { useSnippetContext } from '@/context/SnippetContext';

export default function Header() {
  const { activeSnippet, updateSnippetTitle, deleteSnippet, saveSnippet } = useSnippetContext();
  const [title, setTitle] = useState(activeSnippet?.title || 'Untitled Snippet');
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    if (activeSnippet) {
      setTitle(activeSnippet.title);
      setIsSaved(true);
    }
  }, [activeSnippet?.id]); // Only update title when the active snippet ID changes

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsSaved(false);
  };

  const handleTitleBlur = () => {
    if (activeSnippet && title !== activeSnippet.title) {
      updateSnippetTitle(activeSnippet.id, title);
      setIsSaved(true);
    }
  };

  const handleSave = () => {
    if (activeSnippet) {
      saveSnippet({ ...activeSnippet, title });
      setIsSaved(true);
    }
  };

  const handleDelete = () => {
    if (activeSnippet && confirm('Are you sure you want to delete this snippet?')) {
      deleteSnippet(activeSnippet.id);
    }
  };

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const copyLink = () => {
    if (activeSnippet) {
      // Mock share link
      navigator.clipboard.writeText(`https://sniplive.app/s/${activeSnippet.id}`);
      alert('Link copied to clipboard!');
      setIsShareModalOpen(false);
    }
  };

  if (!activeSnippet) return <div className={styles.header}>Select a snippet to edit</div>;

  return (
    <>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <input 
            type="text" 
            value={title} 
            onChange={handleTitleChange} 
            onBlur={handleTitleBlur}
            className={styles.titleInput}
          />
          {!isSaved && <span className={styles.unsavedIndicator}>Unsaved changes</span>}
        </div>
        
        <div className={styles.actions}>
          <button className="btn-secondary" onClick={handleDelete} title="Delete Snippet">
            <Trash2 size={16} />
          </button>
          <button className="btn-secondary" onClick={handleShare}>
            <Share2 size={16} />
            Share
          </button>
          <button className="btn-primary" onClick={handleSave}>
            <Save size={16} />
            {isSaved ? 'Saved' : 'Save Snippet'}
          </button>
        </div>
      </header>

      {/* Since we don't have a real router setup yet, we import Modal inline here or normally at top */}
      {isShareModalOpen && (
        <div className="fixed inset-0" style={{position: 'fixed', zIndex: 50, top:0, left:0, right:0, bottom:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.6)'}}>
          <div style={{background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', width: '90%', maxWidth: '400px'}}>
             <h2 style={{fontSize:'1.2rem', marginBottom: '1rem'}}>Share Snippet</h2>
             <p style={{color: 'var(--text-secondary)', marginBottom: '1.5rem'}}>Anyone with this link will be able to view this snippet.</p>
             <div style={{display:'flex', gap:'0.5rem'}}>
               <input type="text" readOnly value={`https://sniplive.app/s/${activeSnippet.id}`} style={{flex:1, background:'var(--bg-tertiary)', border:'1px solid var(--border-color)', borderRadius:'var(--radius-md)', padding:'0.5rem', color:'var(--text-primary)'}} />
               <button className="btn-primary" onClick={copyLink}>Copy</button>
             </div>
             <button className="btn-secondary" onClick={() => setIsShareModalOpen(false)} style={{marginTop: '1rem', width: '100%'}}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
