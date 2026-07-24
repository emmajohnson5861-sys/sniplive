'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './Header.module.css';
import { Share2, Save, Trash2, Globe, Lock, Check, X, Copy, FolderPlus, Folder, Mail, MoreHorizontal, Code2, Menu } from 'lucide-react';
import { useSnippetContext } from '@/context/SnippetContext';
import { useSidebar } from '@/context/SidebarContext';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import { updateSnippetVisibility, approveAccess, denyAccess, removeCollaborator, createNotification, getUser, FirestoreUser, createInvite } from '@/lib/firebase-db';

export default function Header() {
  const { activeSnippet, groups, addSnippetToGroup, removeSnippetFromGroup, updateSnippetTitle, deleteSnippet, saveSnippet } = useSnippetContext();
  const { user: currentUser, firebaseUser } = useAuthStore();
  const { toggle: toggleSidebar } = useSidebar();
  const { showToast } = useToast();
  const [title, setTitle] = useState(activeSnippet?.title || 'Untitled Snippet');
  const [isSaved, setIsSaved] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isOptionsDropdownOpen, setIsOptionsDropdownOpen] = useState(false);
  const [isCollectionSubmenuOpen, setIsCollectionSubmenuOpen] = useState(false);
  const [visibility, setVisibility] = useState<'private' | 'unlisted' | 'public'>(activeSnippet?.visibility || 'private');
  const [allowForking, setAllowForking] = useState<boolean>(activeSnippet?.allowForking ?? true);
  const [collaborators, setCollaborators] = useState<FirestoreUser[]>([]);
  const [pendingUsers, setPendingUsers] = useState<FirestoreUser[]>([]);
  const [shareLink, setShareLink] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeSnippet) {
      setTitle(activeSnippet.title);
      setIsSaved(true);
      setVisibility(activeSnippet.visibility || 'private');
      setAllowForking(activeSnippet.allowForking ?? true);
    }
  }, [activeSnippet?.id]);

  useEffect(() => {
    if (isShareModalOpen && activeSnippet && currentUser) {
      setShareLink(`${window.location.origin}/${currentUser.username}/${activeSnippet.slug || activeSnippet.id}`);
      loadShareData();
    }
  }, [isShareModalOpen, activeSnippet, currentUser]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOptionsDropdownOpen(false);
        setIsCollectionSubmenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      setIsOptionsDropdownOpen(false);
    }
  };

  const changeVisibility = async (newVis: 'private' | 'unlisted' | 'public') => {
    if (!activeSnippet) return;
    setVisibility(newVis);
    const { updateSnippetVisibility: updateVis } = await import('@/lib/firebase-db');
    await updateVis(activeSnippet.id, newVis, allowForking);
    saveSnippet({ ...activeSnippet, visibility: newVis });
  };

  const toggleForking = async () => {
    if (!activeSnippet) return;
    const next = !allowForking;
    setAllowForking(next);
    const { updateSnippetVisibility: updateVis } = await import('@/lib/firebase-db');
    await updateVis(activeSnippet.id, visibility, next);
    saveSnippet({ ...activeSnippet, allowForking: next });
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
    showToast('Link copied to clipboard!', 'success');
  };

  const handleCreateInvite = async () => {
    if (!activeSnippet || !currentUser) return;
    try {
      const inviteId = await createInvite(inviteEmail, 'snippet', activeSnippet.id, currentUser.id);
      const link = `${window.location.origin}/${currentUser.username}/${activeSnippet.slug || activeSnippet.id}?invite=${inviteId}`;
      navigator.clipboard.writeText(link);
      setInviteMessage(`Invite created & link copied! Send it to ${inviteEmail}`);
      setInviteEmail('');
      setTimeout(() => setInviteMessage(''), 5000);
    } catch (e) {
      setInviteMessage('Failed to create invite.');
    }
  };

  const isOwner = !!(currentUser && activeSnippet && currentUser.id === activeSnippet.ownerId);

  if (!activeSnippet) {
    return (
      <div className={styles.emptyState}>
        <Code2 size={20} />
        <span>Select a snippet or create a new one</span>
      </div>
    );
  }

  return (
    <>
      <header className={styles.header}>
        <button className={`${styles.menuBtn} btn-secondary`} onClick={toggleSidebar} title="Toggle menu">
          <Menu size={20} />
        </button>
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
          <div 
            className={`${styles.visibilityBadge} ${styles[visibility]}`} 
            onClick={() => isOwner && setIsShareModalOpen(true)}
            title={isOwner ? "Change visibility" : "Visibility"}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />
            {visibility}
          </div>

          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button className="btn-secondary" onClick={() => {
              setIsOptionsDropdownOpen(!isOptionsDropdownOpen);
              setIsCollectionSubmenuOpen(false);
            }} title="Options">
              <MoreHorizontal size={16} />
            </button>
            {isOptionsDropdownOpen && (
              <div className={styles.dropdownContainer}>
                {!isCollectionSubmenuOpen ? (
                  <>
                    <div className={styles.dropdownItem} onClick={() => setIsCollectionSubmenuOpen(true)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <FolderPlus size={14} /> Add to Collection
                      </div>
                      <span style={{ color: 'var(--text-secondary)' }}>→</span>
                    </div>
                    <div className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`} onClick={handleDelete}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Trash2 size={14} /> Delete Snippet
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.dropdownHeader}>
                      <span style={{ cursor: 'pointer', marginRight: 'var(--space-2)' }} onClick={(e) => { e.stopPropagation(); setIsCollectionSubmenuOpen(false); }}>← Back</span>
                      Collections
                    </div>
                    {groups.length === 0 ? (
                      <div style={{ padding: 'var(--space-2)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No collections yet.</div>
                    ) : (
                      groups.map(g => {
                        const inGroup = g.snippetIds.includes(activeSnippet.id);
                        return (
                          <div 
                            key={g.id} 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (inGroup) removeSnippetFromGroup(g.id, activeSnippet.id);
                              else addSnippetToGroup(g.id, activeSnippet.id);
                            }}
                            className={`${styles.dropdownItem} ${inGroup ? styles.active : ''}`}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                              <Folder size={14} color={inGroup ? "var(--accent-primary)" : "var(--text-secondary)"} />
                              {g.title}
                            </div>
                            {inGroup && <Check size={14} color="var(--accent-primary)" />}
                          </div>
                        );
                      })
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          
          <button className={`${styles.actionBtnText} btn-secondary`} onClick={() => setIsShareModalOpen(true)} title="Share">
            <Share2 size={16} />
            <span className={styles.btnLabel}>Share</span>
          </button>
          <button 
            className={`${styles.actionBtnText} btn-primary`}
            onClick={handleSave}
            title="Save"
          >
            <Save size={16} />
            <span className={styles.btnLabel}>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </header>

      <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Share Snippet">
        {isOwner ? (
          <>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Visibility</label>
              <select 
                value={visibility} 
                onChange={(e) => changeVisibility(e.target.value as any)}
                style={{
                  width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', 
                  color: 'var(--text-primary)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', 
                  fontSize: '0.9rem', outline: 'none'
                }}
              >
                <option value="private">Private (Only collaborators can access)</option>
                <option value="unlisted">Unlisted (Anyone with link can access)</option>
                <option value="public">Public (Visible on your profile)</option>
              </select>
            </div>

            {(visibility === 'public' || visibility === 'unlisted') && (
              <div style={{display:'flex', gap:'var(--space-2)', marginBottom:'var(--space-6)'}}>
                <input type="text" readOnly value={shareLink} style={{flex:1, background:'var(--bg-tertiary)', border:'1px solid var(--border-color)', borderRadius:'var(--radius-md)', padding:'var(--space-2)', color:'var(--text-primary)', fontSize:'0.8rem'}} />
                <button className="btn-primary" onClick={copyLink} style={{padding:'var(--space-2)'}}><Copy size={14} /></button>
              </div>
            )}

            {(visibility === 'private') && (
              <div style={{ marginBottom: 'var(--space-6)', background: 'var(--bg-tertiary)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <h3 style={{fontSize:'0.85rem', fontWeight:600, color:'var(--text-primary)', marginBottom:'var(--space-2)', display:'flex', alignItems:'center', gap:'var(--space-2)'}}>
                  <Mail size={16} /> Invite via Email
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>Generate a secure, single-use link for a specific email address.</p>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <input 
                    type="email" 
                    placeholder="collaborator@example.com" 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    style={{flex:1, background:'var(--bg-primary)', border:'1px solid var(--border-color)', borderRadius:'var(--radius-md)', padding:'var(--space-2)', color:'var(--text-primary)', fontSize:'0.85rem'}}
                  />
                  <button className="btn-primary" onClick={handleCreateInvite} disabled={!inviteEmail}>Invite</button>
                </div>
                {inviteMessage && <div style={{ marginTop: 'var(--space-2)', fontSize: '0.8rem', color: 'var(--success)' }}>{inviteMessage}</div>}
              </div>
            )}

            {pendingUsers.length > 0 && (
              <div style={{marginBottom:'var(--space-4)'}}>
                <h3 style={{fontSize:'0.85rem', fontWeight:600, color:'var(--accent-primary)', marginBottom:'var(--space-2)'}}>Pending Access Requests</h3>
                {pendingUsers.map(u => (
                  <div key={u.id} style={{display:'flex', alignItems:'center', gap:'var(--space-2)', padding:'var(--space-2) 0', borderBottom:'1px solid var(--border-color)'}}>
                    {u.avatarUrl ? <img src={u.avatarUrl} alt="" style={{width:24, height:24, borderRadius:'50%'}} /> : <div style={{width:24, height:24, borderRadius:'50%', background:'var(--bg-tertiary)'}} />}
                    <span style={{flex:1, color:'var(--text-primary)', fontSize:'0.85rem'}}>{u.name || u.email}</span>
                    <button onClick={() => handleApprove(u.id)} style={{padding:'0.25rem 0.5rem', borderRadius:'var(--radius-sm)', border:'1px solid var(--success)', color:'var(--success)', background:'transparent', cursor:'pointer'}}><Check size={14} /></button>
                    <button onClick={() => handleDeny(u.id)} style={{padding:'0.25rem 0.5rem', borderRadius:'var(--radius-sm)', border:'1px solid var(--error)', color:'var(--error)', background:'transparent', cursor:'pointer'}}><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <h3 style={{fontSize:'0.85rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'var(--space-2)'}}>Collaborators ({collaborators.length})</h3>
              {collaborators.map(u => (
                <div key={u.id} style={{display:'flex', alignItems:'center', gap:'var(--space-2)', padding:'0.4rem 0', borderBottom:'1px solid var(--border-color)'}}>
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
          <div style={{textAlign:'center', padding:'var(--space-4) 0'}}>
            {!firebaseUser ? (
              <p style={{color:'var(--text-secondary)'}}>Sign in to request edit access.</p>
            ) : (
              <p style={{color:'var(--text-secondary)'}}>Access request sent. Waiting for approval.</p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
