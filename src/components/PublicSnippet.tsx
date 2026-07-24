'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { subscribeToSnippet, FirestoreSnippet, updateSnippet, redeemInvite, incrementSnippetView, createSnippet, getUserByUsernameOrId, getDocs, query, collection, where, db } from '@/lib/firebase-db';
import { useAuthStore, initAuthListener } from '@/store/auth-store';
import { Globe, User, Lock, Code2, Edit3, Save, Check, GitFork, Home } from 'lucide-react';
import LivePreview from '@/components/LivePreview';
import CodeEditor from '@/components/CodeEditor';
import AuthModal from '@/components/AuthModal';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

function SharedSnippetContent({ username, snippetSlug }: { username: string; snippetSlug?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const inviteToken = searchParams.get('invite');
  const { user, firebaseUser } = useAuthStore();
  const [snippet, setSnippet] = useState<FirestoreSnippet | null>(null);
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

  const currentCloud = React.useRef({ html: '', css: '', js: '' });

  useEffect(() => {
    if (inviteToken && firebaseUser && user?.email) {
      redeemInvite(inviteToken, user.email, firebaseUser.uid).then(res => {
        if (res.success) {
          showToast('Invite redeemed! You now have edit access.', 'success');
        } else if (res.message !== 'Invite already redeemed.') {
          showToast(res.message, 'error');
        }
      });
    }
  }, [inviteToken, firebaseUser, user?.email]);

  useEffect(() => {
    if (!username || !snippetSlug) return;
    let unsubscribe: () => void = () => {};
    let isCancelled = false;

    const initSnippet = async () => {
      let snippetId = snippetSlug; // fallback to treating slug as ID

      try {
        const u = await getUserByUsernameOrId(username);
        if (u) {
          const snippetsRef = collection(db, 'snippets');
          const q = query(snippetsRef, where('ownerId', '==', u.id), where('slug', '==', snippetSlug));
          const snap = await getDocs(q);
          if (!snap.empty) {
            snippetId = snap.docs[0].id;
          }
        }
      } catch(e) {
        console.error(e);
      }

      if (isCancelled) return;
      
      const viewedKey = `viewed_${snippetId}`;
      if (!localStorage.getItem(viewedKey)) {
        incrementSnippetView(snippetId).catch(() => {});
        localStorage.setItem(viewedKey, 'true');
      }

      let isFirstLoad = true;
      unsubscribe = subscribeToSnippet(snippetId, firebaseUser?.uid || null, (s) => {
        if (s) {
          setSnippet(s);
          if (isFirstLoad) {
            setHtml(s.html);
            setCss(s.css);
            setJs(s.js);
            currentCloud.current = { html: s.html, css: s.css, js: s.js };
            isFirstLoad = false;
          } else {
            const oldCloud = { ...currentCloud.current };
            setHtml(prev => prev === oldCloud.html ? s.html : prev);
            setCss(prev => prev === oldCloud.css ? s.css : prev);
            setJs(prev => prev === oldCloud.js ? s.js : prev);
            currentCloud.current = { html: s.html, css: s.css, js: s.js };
          }
        }
        setLoading(false);
      });
    };

    initSnippet();

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, [username, snippetSlug, firebaseUser?.uid]);



  const handleSave = async () => {
    if (!snippet || !firebaseUser) return;
    setIsSaving(true);
    try {
      await updateSnippet(snippet.id, { html, css, js });
      setSnippet(prev => prev ? { ...prev, html, css, js } : null);
    } catch (err) {
      console.error(err);
    }
    setIsSaving(false);
  };

  const handleFork = async () => {
    if (!firebaseUser || !snippet) {
      setIsAuthModalOpen(true);
      return;
    }
    const newId = crypto.randomUUID();
    try {
      await createSnippet({
        id: newId,
        title: `${snippet.title} (Fork)`,
        html: snippet.html, css: snippet.css, js: snippet.js,
        ownerId: firebaseUser.uid, ownerName: user?.name || null, ownerEmail: user?.email || '',
        forkedFromId: snippet.id
      });
      router.push('/');
    } catch (e) {
      showToast('Failed to fork snippet. Please try again.', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg-primary)'}}>
        <p style={{color:'var(--text-secondary)'}}>Loading snippet...</p>
      </div>
    );
  }

  if (!snippet) {
    return (
      <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg-primary)', flexDirection:'column', gap:'1rem'}}>
        <Lock size={48} style={{color:'var(--text-secondary)'}} />
        <h1 style={{color:'var(--text-primary)', fontWeight:700, fontSize:'1.5rem'}}>Snippet not found</h1>
        <p style={{color:'var(--text-secondary)'}}>This snippet is private or doesn't exist.</p>
      </div>
    );
  }

  const isOwner = firebaseUser?.uid === snippet.ownerId;
  const isCollaborator = !!firebaseUser && (snippet.collaborators || []).includes(firebaseUser.uid);
  const canEdit = isOwner || isCollaborator;

  // Check if there are unsaved changes (only matters if they can edit)
  const hasChanges = canEdit && (html !== snippet.html || css !== snippet.css || js !== snippet.js);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {/* Left Sidebar */}
      <div style={{ width: '260px', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
        
        {/* Branding & Title Area */}
        <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', textDecoration: 'none', cursor: 'pointer', transition: 'opacity 0.15s' }} title="Back to Home">
            <Code2 size={22} color="var(--accent-primary)" />
            <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)' }}>SnipLive</span>
            <Home size={14} color="var(--text-secondary)" style={{ marginLeft: 'auto' }} />
          </Link>
          <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem', wordBreak: 'break-word' }}>
            {snippet.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--success)', marginBottom: '0.5rem' }}>
            <Globe size={12} /> {snippet.visibility === 'public' ? 'Public' : snippet.visibility === 'unlisted' ? 'Unlisted' : 'Private'} Snippet
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {snippet.viewCount || 0} views
          </div>
        </div>

        {/* Info & Actions */}
        <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {snippet.ownerName && (
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>Owner</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={14} color="var(--text-secondary)" />
                </div>
                {snippet.ownerName}
              </div>
            </div>
          )}

          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.75rem' }}>Access & Actions</div>
            
            {canEdit ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontSize: '0.85rem' }}>
                  <Check size={16} /> You have edit access
                </div>
                <button 
                  className={hasChanges ? "btn-primary" : "btn-secondary"} 
                  onClick={handleSave} 
                  disabled={!hasChanges || isSaving}
                  style={{ width: '100%', justifyContent: 'center', opacity: (!hasChanges || isSaving) ? 0.6 : 1 }}
                >
                  <Save size={16} style={{ marginRight: '0.4rem' }} />
                  {isSaving ? 'Saving...' : hasChanges ? 'Save Changes' : 'Saved'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>Playground Mode</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Feel free to edit the code and test changes locally. Your changes will not be saved to the original snippet.
                </p>
              </div>
            )}
            
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(!canEdit && snippet.allowForking !== false) && (
                <button className="btn-primary" onClick={handleFork} style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}>
                  <GitFork size={16} style={{ marginRight: '0.4rem' }} /> Fork Snippet
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', minWidth: 0 }}>
        {/* Code Editor */}
        <div style={{ flex: 1, borderRight: '1px solid var(--border-color)', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <CodeEditor html={html} setHtml={setHtml} css={css} setCss={setCss} js={js} setJs={setJs} readOnly={false} />
        </div>
        
        {/* Live Preview */}
        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
           <LivePreview html={html} css={css} js={js} />
        </div>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} title="Sign in to request edit access" />
    </div>
  );
}

export default function PublicSnippet({ username, snippetSlug }: { username: string; snippetSlug?: string }) {
  return (
    <Suspense fallback={<div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg-primary)'}}><p style={{color:'var(--text-secondary)'}}>Loading...</p></div>}>
      <SharedSnippetContent username={username} snippetSlug={snippetSlug} />
    </Suspense>
  );
}
