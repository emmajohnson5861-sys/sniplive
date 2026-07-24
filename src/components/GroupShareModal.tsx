'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Lock, Check, X, Copy, Mail } from 'lucide-react';
import { FirestoreUser, getUser, createInvite, toggleGroupVisibility, approveGroupAccess } from '@/lib/firebase-db';
import { Group } from '@/context/SnippetContext';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';

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
    if (isOpen && currentUser) {
      setShareLink(`${window.location.origin}/${currentUser.username}/c/${group.slug || group.id}`);
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
      const link = `${window.location.origin}/${currentUser.username}/c/${group.slug || group.id}?invite=${inviteId}`;
      navigator.clipboard.writeText(link);
      setInviteMessage(`Invite created & link copied! Send it to ${inviteEmail}`);
      setInviteEmail('');
      setTimeout(() => setInviteMessage(''), 5000);
    } catch (e) {
      setInviteMessage('Failed to create invite.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Collection">
      <div style={{display:'flex', alignItems:'center', gap:'var(--space-3)', padding:'var(--space-3)', background:'var(--bg-tertiary)', borderRadius:'var(--radius-md)', marginBottom:'var(--space-4)'}}>
        <button onClick={toggleVisibility} style={{display:'flex', alignItems:'center', gap:'var(--space-2)', color:'var(--text-primary)', fontSize:'0.85rem', padding:'var(--space-1) 0', background:'transparent', border:'none', cursor:'pointer'}}>
          {isPublic ? <Globe size={16} color="var(--success)" /> : <Lock size={16} color="var(--text-secondary)" />}
          {isPublic ? 'Public' : 'Private'}
        </button>
        <span style={{color:'var(--text-secondary)', fontSize:'0.8rem'}}>
          {isPublic ? 'Anyone with the link can view' : 'Only collaborators can view'}
        </span>
      </div>

      {isPublic && (
        <div style={{display:'flex', gap:'var(--space-2)', marginBottom:'var(--space-6)'}}>
          <input type="text" readOnly value={shareLink} style={{flex:1, background:'var(--bg-tertiary)', border:'1px solid var(--border-color)', borderRadius:'var(--radius-md)', padding:'var(--space-2)', color:'var(--text-primary)', fontSize:'0.8rem'}} />
          <button className="btn-primary" onClick={copyLink} style={{padding:'var(--space-2)'}}><Copy size={14} /></button>
        </div>
      )}

      {!isPublic && (
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

      <div>
        <h3 style={{fontSize:'0.85rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'var(--space-2)'}}>Collaborators ({collaborators.length})</h3>
        {collaborators.map(u => (
          <div key={u.id} style={{display:'flex', alignItems:'center', gap:'var(--space-2)', padding:'0.4rem 0', borderBottom:'1px solid var(--border-color)'}}>
            {u.avatarUrl ? <img src={u.avatarUrl} alt="" style={{width:24, height:24, borderRadius:'50%'}} /> : <div style={{width:24, height:24, borderRadius:'50%', background:'var(--bg-tertiary)'}} />}
            <span style={{flex:1, color:'var(--text-primary)', fontSize:'0.85rem'}}>{u.name || u.email}</span>
            {u.id === group.ownerId && <span style={{fontSize:'0.75rem', color:'var(--accent-primary)'}}>Owner</span>}
          </div>
        ))}
      </div>

      <button className="btn-secondary" onClick={onClose} style={{width:'100%', marginTop:'var(--space-4)', justifyContent:'center'}}>Close</button>
    </Modal>
  );
}
