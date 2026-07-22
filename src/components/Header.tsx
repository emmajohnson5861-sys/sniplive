'use client';

import React, { useState, useEffect } from 'react';
import styles from './Header.module.css';
import { Share2, Save, Trash2, Globe, Lock, Check, X, Copy } from 'lucide-react';
import { useSnippetContext } from '@/context/SnippetContext';
import { useAuthStore } from '@/store/auth-store';
import { toggleSnippetVisibility, approveAccess, denyAccess, removeCollaborator, createNotification, getUser, FirestoreUser } from '@/lib/firebase-db';

export default function Header() {
  const { activeSnippet, updateSnippetTitle, deleteSnippet, saveSnippet } = useSnippetContext();
  const { user: currentUser, firebaseUser } = useAuthStore();
  const [title, setTitle] = useState(activeSnippet?.title || 'Untitled Snippet');
  const [isSaved, setIsSaved] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(activeSnippet?.isPublic || false);
  const [collaborators, setCollaborators] = useState<FirestoreUser[]>([]);
  const [pendingUsers, setPendingUsers] = useState<FirestoreUser[]>([]);
  const [shareLink, setShareLink] = useState('');

  useEffect(() => {
    if (activeSnippet) {
      setTitle(activeSnippet.title);
      setIsSaved(true);
      setIsPublic(activeSnippet.isPublic || false);
    }
  }, [activeSnippet?.id]);

  useEffect(() => {
    if (isShareModalOpen && activeSnippet) {
      setShareLink(`${window.location.origin}/s/${activeSnippet.id}`);
      loadShareData();
    }
  }, [isShareModalOpen, activeSnippet]);

  const loadShareData = async () => {
    if (!activeSnippet) return;
    const ids = activeSnippet.collaborators || [];
    const pending = activeSnippet.pendingRequests || [];
    const [collabUsers, pendingUsersData] = await Promise.all([
      Promise.all(ids.map(id => getUser(id))),
      Promise.all(pending.map(id => getUser(id))),
    ]);
    setCollaborators(collabUsers.filter(Boolean) as FirestoreUser[]);
    setPendingUsers(pendingUsersData.filter(Boolean) as FirestoreUser[]);
  };

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

  const toggleVisibility = async () => {
    if (!activeSnippet) return;
    const next = !isPublic;
    setIsPublic(next);
    const { toggleSnippetVisibility: toggle } = await import('@/lib/firebase-db');
    await toggle(activeSnippet.id, next);
    saveSnippet({ ...activeSnippet, isPublic: next });
  };

  const handleApprove = async (userId: string) => {
    if (!activeSnippet) return;
    await approveAccess(activeSnippet.id, userId);
    await createNotification({
      type: 'ACCESS_GRANTED', fromUserId: currentUser?.id || '',
      fromUserName: currentUser?.name || null, fromUserEmail: currentUser?.email || '',
      snippetId: activeSnippet.id, snippetTitle: activeSnippet.title,
    });
    loadShareData();
  };

  const handleDeny = async (userId: string) => {
    if (!activeSnippet) return;
    await denyAccess(activeSnippet.id, userId);
    loadShareData();
  };

  const handleRemove = async (userId: string) => {
    if (!activeSnippet) return;
    await removeCollaborator(activeSnippet.id, userId);
    loadShareData();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Link copied to clipboard!');
  };

  const isOwner = !!(currentUser && activeSnippet);

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
          {activeSnippet.isPublic && <Globe size={14} style={{ color: 'var(--success)' }} />}
        </div>
        
        <div className={styles.actions}>
          <button className="btn-secondary" onClick={handleDelete} title="Delete Snippet">
            <Trash2 size={16} />
          </button>
          <button className="btn-secondary" onClick={() => setIsShareModalOpen(true)}>
            <Share2 size={16} />
            Share
          </button>
          <button className="btn-primary" onClick={handleSave}>
            <Save size={16} />
            {isSaved ? 'Saved' : 'Save Snippet'}
          </button>
        </div>
      </header>

      {isShareModalOpen && (
        <div className="fixed inset-0" style={{position: 'fixed', zIndex: 50, top:0, left:0, right:0, bottom:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.6)'}}>
          <div style={{background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', width: '90%', maxWidth: '480px', maxHeight: '80vh', overflow: 'auto'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
              <h2 style={{fontSize:'1.2rem', fontWeight:700, color:'var(--text-primary)'}}>Share Snippet</h2>
              <button onClick={() => setIsShareModalOpen(false)} style={{color:'var(--text-secondary)', padding:'0.25rem'}}><X size={18} /></button>
            </div>

            {isOwner ? (
              <>
                <div style={{display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem', background:'var(--bg-tertiary)', borderRadius:'var(--radius-md)', marginBottom:'1rem'}}>
                  <button onClick={toggleVisibility} style={{display:'flex', alignItems:'center', gap:'0.5rem', color:'var(--text-primary)', fontSize:'0.85rem', padding:'0.25rem 0'}}>
                    {isPublic ? <Globe size={16} color="var(--success)" /> : <Lock size={16} color="var(--text-secondary)" />}
                    {isPublic ? 'Public' : 'Private'}
                  </button>
                  <span style={{color:'var(--text-secondary)', fontSize:'0.8rem'}}>
                    {isPublic ? 'Anyone with the link can view' : 'Only collaborators can view'}
                  </span>
                </div>

                {isPublic && (
                  <div style={{display:'flex', gap:'0.5rem', marginBottom:'1rem'}}>
                    <input type="text" readOnly value={shareLink} style={{flex:1, background:'var(--bg-tertiary)', border:'1px solid var(--border-color)', borderRadius:'var(--radius-md)', padding:'0.5rem', color:'var(--text-primary)', fontSize:'0.8rem'}} />
                    <button className="btn-primary" onClick={copyLink} style={{padding:'0.5rem'}}><Copy size={14} /></button>
                  </div>
                )}

                {pendingUsers.length > 0 && (
                  <div style={{marginBottom:'1rem'}}>
                    <h3 style={{fontSize:'0.85rem', fontWeight:600, color:'var(--accent-primary)', marginBottom:'0.5rem'}}>Pending Access Requests</h3>
                    {pendingUsers.map(u => (
                      <div key={u.id} style={{display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 0', borderBottom:'1px solid var(--border-color)'}}>
                        {u.avatarUrl ? <img src={u.avatarUrl} alt="" style={{width:24, height:24, borderRadius:'50%'}} /> : <div style={{width:24, height:24, borderRadius:'50%', background:'var(--bg-tertiary)'}} />}
                        <span style={{flex:1, color:'var(--text-primary)', fontSize:'0.85rem'}}>{u.name || u.email}</span>
                        <button onClick={() => handleApprove(u.id)} style={{padding:'0.25rem 0.5rem', borderRadius:'var(--radius-sm)', border:'1px solid var(--success)', color:'var(--success)', background:'transparent', cursor:'pointer'}}><Check size={14} /></button>
                        <button onClick={() => handleDeny(u.id)} style={{padding:'0.25rem 0.5rem', borderRadius:'var(--radius-sm)', border:'1px solid var(--error)', color:'var(--error)', background:'transparent', cursor:'pointer'}}><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <h3 style={{fontSize:'0.85rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.5rem'}}>Collaborators ({collaborators.length})</h3>
                  {collaborators.map(u => (
                    <div key={u.id} style={{display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.4rem 0', borderBottom:'1px solid var(--border-color)'}}>
                      {u.avatarUrl ? <img src={u.avatarUrl} alt="" style={{width:24, height:24, borderRadius:'50%'}} /> : <div style={{width:24, height:24, borderRadius:'50%', background:'var(--bg-tertiary)'}} />}
                      <span style={{flex:1, color:'var(--text-primary)', fontSize:'0.85rem'}}>{u.name || u.email}</span>
                      {u.id === activeSnippet.ownerId ? (
                        <span style={{fontSize:'0.75rem', color:'var(--accent-primary)'}}>Owner</span>
                      ) : (
                        <button onClick={() => handleRemove(u.id)} style={{padding:'0.25rem', color:'var(--error)', background:'transparent', cursor:'pointer'}} title="Remove"><X size={14} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{textAlign:'center', padding:'1rem 0'}}>
                {!firebaseUser ? (
                  <p style={{color:'var(--text-secondary)'}}>Sign in to request edit access.</p>
                ) : (
                  <p style={{color:'var(--text-secondary)'}}>Access request sent. Waiting for approval.</p>
                )}
              </div>
            )}

            <button className="btn-secondary" onClick={() => setIsShareModalOpen(false)} style={{width:'100%', marginTop:'0.5rem', justifyContent:'center'}}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
