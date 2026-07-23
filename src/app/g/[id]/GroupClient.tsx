'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { subscribeToGroup, FirestoreGroup, FirestoreSnippet, getSnippet, updateSnippet, redeemInvite } from '@/lib/firebase-db';
import { useAuthStore, initAuthListener } from '@/store/auth-store';
import { Globe, User, Lock, Folder, Edit3, Save, Check, Code2, ChevronRight, Home } from 'lucide-react';
import LivePreview from '@/components/LivePreview';
import CodeEditor from '@/components/CodeEditor';
import AuthModal from '@/components/AuthModal';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

function SharedGroupContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const { user, firebaseUser } = useAuthStore();
  const [group, setGroup] = useState<FirestoreGroup | null>(null);
  const [snippets, setSnippets] = useState<FirestoreSnippet[]>([]);
  const [activeSnippetId, setActiveSnippetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [js, setJs] = useState('');
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    initAuthListener();
  }, []);

  const currentCloud = React.useRef({ id: '', html: '', css: '', js: '' });

  useEffect(() => {
    if (inviteToken && firebaseUser && user?.email) {
      redeemInvite(inviteToken, user.email, firebaseUser.uid).then(res => {
        if (res.success) {
          showToast('Invite redeemed! You now have access.', 'success');
        } else if (res.message !== 'Invite already redeemed.') {
          showToast(res.message, 'error');
        }
      });
    }
  }, [inviteToken, firebaseUser, user?.email]);

  // Subscribe to Group changes
  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeToGroup(id as string, firebaseUser?.uid || null, async (g) => {
      setGroup(g);
      if (g) {
        // Fetch snippets
        const loadedSnippets = await Promise.all(
          g.snippetIds.map(sid => getSnippet(sid))
        );
        let validSnippets = loadedSnippets.filter(Boolean) as FirestoreSnippet[];
        
        // Filter out private snippets if not a collaborator or owner
        const isOwner = firebaseUser?.uid === g.ownerId;
        const isCollaborator = !!firebaseUser && (g.collaborators || []).includes(firebaseUser.uid);
        if (!isOwner && !isCollaborator) {
          validSnippets = validSnippets.filter(s => s.visibility === 'public' || s.visibility === 'unlisted');
        }

        setSnippets(validSnippets);
        if (validSnippets.length > 0 && (!activeSnippetId || !validSnippets.find(s => s.id === activeSnippetId))) {
          setActiveSnippetId(validSnippets[0].id);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id, activeSnippetId, firebaseUser?.uid]);

  // Sync editor with active snippet
  useEffect(() => {
    const active = snippets.find(s => s.id === activeSnippetId);
    if (active) {
      if (currentCloud.current.id !== active.id) {
        setHtml(active.html);
        setCss(active.css);
        setJs(active.js);
        currentCloud.current = { id: active.id, html: active.html, css: active.css, js: active.js };
      }
    } else {
      setHtml('');
      setCss('');
      setJs('');
    }
  }, [activeSnippetId, snippets]);



  const handleSave = async () => {
    if (!activeSnippetId || !firebaseUser) return;
    setIsSaving(true);
    try {
      await updateSnippet(activeSnippetId, { html, css, js });
      // update local
      setSnippets(prev => prev.map(s => s.id === activeSnippetId ? { ...s, html, css, js } : s));
      currentCloud.current = { id: activeSnippetId, html, css, js };
    } catch (err) {
      console.error(err);
    }
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg-primary)'}}>
        <p style={{color:'var(--text-secondary)'}}>Loading collection...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg-primary)', flexDirection:'column', gap:'1rem'}}>
        <Lock size={48} style={{color:'var(--text-secondary)'}} />
        <h1 style={{color:'var(--text-primary)', fontWeight:700, fontSize:'1.5rem'}}>Collection not found</h1>
        <p style={{color:'var(--text-secondary)'}}>This collection is private or doesn't exist.</p>
      </div>
    );
  }

  const isOwner = firebaseUser?.uid === group.ownerId;
  const isCollaborator = !!firebaseUser && (group.collaborators || []).includes(firebaseUser.uid);
  const canEdit = isOwner || isCollaborator;

  const active = snippets.find(s => s.id === activeSnippetId);
  const hasChanges = canEdit && active && (html !== active.html || css !== active.css || js !== active.js);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {/* Left Sidebar */}
      <div style={{ width: '280px', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
        
        {/* Branding & Group Title */}
        <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', textDecoration: 'none', cursor: 'pointer', transition: 'opacity 0.15s' }} title="Back to Home">
            <Folder size={22} color="var(--accent-primary)" />
            <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)' }}>SnipLive</span>
            <Home size={14} color="var(--text-secondary)" style={{ marginLeft: 'auto' }} />
          </Link>
          <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Collection</div>
          <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.25rem', wordBreak: 'break-word' }}>
            {group.title}
          </div>
          {group.description && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              {group.description}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--success)' }}>
            <Globe size={12} /> Public Collection
          </div>
        </div>

        {/* Snippet List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0' }}>
          <div style={{ padding: '0 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>
            Snippets ({snippets.length})
          </div>
          {snippets.map(s => (
            <div 
              key={s.id}
              onClick={() => setActiveSnippetId(s.id)}
              style={{
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: activeSnippetId === s.id ? 'var(--bg-tertiary)' : 'transparent',
                borderLeft: activeSnippetId === s.id ? '3px solid var(--accent-primary)' : '3px solid transparent',
              }}
            >
              <Code2 size={16} color="var(--text-secondary)" />
              <span style={{ flex: 1, fontSize: '0.9rem', color: activeSnippetId === s.id ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.title}
              </span>
              {activeSnippetId === s.id && <ChevronRight size={14} color="var(--text-secondary)" />}
            </div>
          ))}
        </div>

        {/* Info & Actions */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {group.ownerName && (
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>Owner</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={14} color="var(--text-secondary)" />
                </div>
                {group.ownerName}
              </div>
            </div>
          )}

          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.75rem' }}>Access & Actions</div>
            
            {!canEdit ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>Playground Mode</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Feel free to edit the code and test changes locally. Your changes will not be saved to the original collection.
                </p>
              </div>
            ) : canEdit ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontSize: '0.85rem' }}>
                  <Check size={16} /> You have edit access
                </div>
                {activeSnippetId && (
                  <button 
                    className={hasChanges ? "btn-primary" : "btn-secondary"} 
                    onClick={handleSave} 
                    disabled={!hasChanges || isSaving}
                    style={{ width: '100%', justifyContent: 'center', opacity: (!hasChanges || isSaving) ? 0.6 : 1 }}
                  >
                    <Save size={16} style={{ marginRight: '0.4rem' }} />
                    {isSaving ? 'Saving...' : hasChanges ? 'Save Snippet' : 'Saved'}
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>Playground Mode</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Feel free to edit the code and test changes locally. Your changes will not be saved to the original collection.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', minWidth: 0 }}>
        {activeSnippetId ? (
          <>
            <div style={{ flex: 1, borderRight: '1px solid var(--border-color)', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <CodeEditor html={html} setHtml={setHtml} css={css} setCss={setCss} js={js} setJs={setJs} readOnly={false} />
            </div>
            <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
               <LivePreview html={html} css={css} js={js} />
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-secondary)' }}>
            Select a snippet from the collection to view.
          </div>
        )}
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} title="Sign in to request edit access" />
    </div>
  );
}

export default function SharedGroupPage() {
  return (
    <Suspense fallback={<div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg-primary)'}}><p style={{color:'var(--text-secondary)'}}>Loading...</p></div>}>
      <SharedGroupContent />
    </Suspense>
  );
}
