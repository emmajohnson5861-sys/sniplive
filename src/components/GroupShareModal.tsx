'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Lock, Check, X, Copy, Mail } from 'lucide-react';
import { FirestoreUser, getUser, createInvite, toggleGroupVisibility, approveGroupAccess } from '@/lib/firebase-db';
import { Group } from '@/context/SnippetContext';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/components/Toast';

interface GroupShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
}

export default function GroupShareModal({ isOpen, onClose, group }: GroupShareModalProps) {
  const { user: currentUser } = useAuthStore();
  const { showToast } = useToast();
  const [isPublic, setIsPublic] = useState(group.isPublic || false);
  const [collaborators, setCollaborators] = useState<FirestoreUser[]>([]);
  const [shareLink, setShareLink] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setShareLink(`${window.location.origin}/g/${group.id}`);
      setIsPublic(group.isPublic || false);
      loadCollaborators();
    }
  }, [isOpen, group]);

  const loadCollaborators = async () => {
    if (!group.collaborators) return;
    const users = await Promise.all(group.collaborators.map(id => getUser(id)));
    setCollaborators(users.filter(Boolean) as FirestoreUser[]);
  };

  const toggleVisibility = async () => {
    const next = !isPublic;
    setIsPublic(next);
    await toggleGroupVisibility(group.id, next);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    showToast('Link copied to clipboard!', 'success');
  };

  const handleCreateInvite = async () => {
    if (!currentUser) return;
    try {
      const inviteId = await createInvite(inviteEmail, 'group', group.id, currentUser.id);
      const link = `${window.location.origin}/g/${group.id}?invite=${inviteId}`;
      navigator.clipboard.writeText(link);
      setInviteMessage(`Invite created & link copied! Send it to ${inviteEmail}`);
      setInviteEmail('');
      setTimeout(() => setInviteMessage(''), 5000);
    } catch (e) {
      setInviteMessage('Failed to create invite.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0" style={{position: 'fixed', zIndex: 50, top:0, left:0, right:0, bottom:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.6)'}}>
      <div style={{background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', width: '90%', maxWidth: '480px', maxHeight: '80vh', overflow: 'auto'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
          <h2 style={{fontSize:'1.2rem', fontWeight:700, color:'var(--text-primary)'}}>Share Collection</h2>
          <button onClick={onClose} style={{color:'var(--text-secondary)', padding:'0.25rem'}}><X size={18} /></button>
        </div>

        <div style={{display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem', background:'var(--bg-tertiary)', borderRadius:'var(--radius-md)', marginBottom:'1rem'}}>
          <button onClick={toggleVisibility} style={{display:'flex', alignItems:'center', gap:'0.5rem', color:'var(--text-primary)', fontSize:'0.85rem', padding:'0.25rem 0', background:'transparent', border:'none', cursor:'pointer'}}>
            {isPublic ? <Globe size={16} color="var(--success)" /> : <Lock size={16} color="var(--text-secondary)" />}
            {isPublic ? 'Public' : 'Private'}
          </button>
          <span style={{color:'var(--text-secondary)', fontSize:'0.8rem'}}>
            {isPublic ? 'Anyone with the link can view' : 'Only collaborators can view'}
          </span>
        </div>

        {isPublic && (
          <div style={{display:'flex', gap:'0.5rem', marginBottom:'1.5rem'}}>
            <input type="text" readOnly value={shareLink} style={{flex:1, background:'var(--bg-tertiary)', border:'1px solid var(--border-color)', borderRadius:'var(--radius-md)', padding:'0.5rem', color:'var(--text-primary)', fontSize:'0.8rem'}} />
            <button className="btn-primary" onClick={copyLink} style={{padding:'0.5rem'}}><Copy size={14} /></button>
          </div>
        )}

        {!isPublic && (
          <div style={{ marginBottom: '1.5rem', background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h3 style={{fontSize:'0.85rem', fontWeight:600, color:'var(--text-primary)', marginBottom:'0.5rem', display:'flex', alignItems:'center', gap:'0.5rem'}}>
              <Mail size={16} /> Invite via Email
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Generate a secure, single-use link for a specific email address.</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="email" 
                placeholder="collaborator@example.com" 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                style={{flex:1, background:'var(--bg-primary)', border:'1px solid var(--border-color)', borderRadius:'var(--radius-md)', padding:'0.5rem', color:'var(--text-primary)', fontSize:'0.85rem'}}
              />
              <button className="btn-primary" onClick={handleCreateInvite} disabled={!inviteEmail}>Invite</button>
            </div>
            {inviteMessage && <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--success)' }}>{inviteMessage}</div>}
          </div>
        )}

        <div>
          <h3 style={{fontSize:'0.85rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.5rem'}}>Collaborators ({collaborators.length})</h3>
          {collaborators.map(u => (
            <div key={u.id} style={{display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.4rem 0', borderBottom:'1px solid var(--border-color)'}}>
              {u.avatarUrl ? <img src={u.avatarUrl} alt="" style={{width:24, height:24, borderRadius:'50%'}} /> : <div style={{width:24, height:24, borderRadius:'50%', background:'var(--bg-tertiary)'}} />}
              <span style={{flex:1, color:'var(--text-primary)', fontSize:'0.85rem'}}>{u.name || u.email}</span>
              {u.id === group.ownerId && <span style={{fontSize:'0.75rem', color:'var(--accent-primary)'}}>Owner</span>}
            </div>
          ))}
        </div>

        <button className="btn-secondary" onClick={onClose} style={{width:'100%', marginTop:'1rem', justifyContent:'center'}}>Close</button>
      </div>
    </div>
  );
}
