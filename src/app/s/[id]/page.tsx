'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getPublicSnippet, requestAccess, FirestoreSnippet } from '@/lib/firebase-db';
import { useAuthStore } from '@/store/auth-store';
import { Globe, User, Lock, Code, Eye, Edit3 } from 'lucide-react';
import LivePreview from '@/components/LivePreview';

export default function SharedSnippetPage() {
  const { id } = useParams<{ id: string }>();
  const { user, firebaseUser } = useAuthStore();
  const [snippet, setSnippet] = useState<FirestoreSnippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [requested, setRequested] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [codeTab, setCodeTab] = useState<'html' | 'css' | 'js'>('html');

  useEffect(() => {
    if (!id) return;
    getPublicSnippet(id).then(s => {
      setSnippet(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const handleRequest = async () => {
    if (!firebaseUser || !snippet) return;
    try {
      await requestAccess(snippet.id, firebaseUser.uid);
      setRequested(true);
    } catch (err) {
      console.error(err);
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

  return (
    <div style={{minHeight:'100vh', background:'var(--bg-primary)', color:'var(--text-primary)', display:'flex', flexDirection:'column'}}>
      <header style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 1.5rem', borderBottom:'1px solid var(--border-color)', background:'var(--bg-secondary)'}}>
        <div style={{display:'flex', alignItems:'center', gap:'0.75rem'}}>
          <Code size={20} style={{color:'var(--accent-primary)'}} />
          <span style={{fontWeight:700, fontSize:'1.1rem'}}>SnipLive</span>
          <span style={{color:'var(--text-secondary)', fontSize:'0.85rem'}}>/ {snippet.title}</span>
          <Globe size={14} style={{color:'var(--success)'}} />
          <span style={{fontSize:'0.75rem', color:'var(--success)'}}>Public</span>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
          {!firebaseUser ? (
            <span style={{fontSize:'0.8rem', color:'var(--text-secondary)'}}>Sign in to request edit access</span>
          ) : requested ? (
            <span style={{fontSize:'0.8rem', color:'var(--accent-primary)'}}>Access requested</span>
          ) : (
            <button className="btn-primary" onClick={handleRequest} style={{display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.8rem', padding:'0.4rem 0.75rem'}}>
              <Edit3 size={14} />
              Request Edit Access
            </button>
          )}
        </div>
      </header>

      <div style={{display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem 1.5rem', borderBottom:'1px solid var(--border-color)', background:'var(--bg-secondary)'}}>
        {snippet.ownerName && (
          <div style={{display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.8rem', color:'var(--text-secondary)'}}>
            <User size={14} />
            <span>{snippet.ownerName}</span>
          </div>
        )}
        <div style={{display:'flex', gap:'0.25rem', marginLeft:'auto'}}>
          <button onClick={() => setActiveTab('preview')} style={{
            padding:'0.35rem 0.75rem', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-color)',
            background: activeTab === 'preview' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'preview' ? '#fff' : 'var(--text-secondary)',
            cursor:'pointer', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:'0.3rem',
          }}><Eye size={14} /> Preview</button>
          <button onClick={() => setActiveTab('code')} style={{
            padding:'0.35rem 0.75rem', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-color)',
            background: activeTab === 'code' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'code' ? '#fff' : 'var(--text-secondary)',
            cursor:'pointer', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:'0.3rem',
          }}><Code size={14} /> Code</button>
        </div>
      </div>

      {activeTab === 'preview' ? (
        <div style={{flex:1, padding:'1rem'}}>
          <LivePreview html={snippet.html} css={snippet.css} js={snippet.js} />
        </div>
      ) : (
        <div style={{flex:1, padding:'1rem', display:'flex', flexDirection:'column'}}>
          <div style={{display:'flex', gap:'0.25rem', marginBottom:'0.5rem'}}>
            {(['html', 'css', 'js'] as const).map(tab => (
              <button key={tab} onClick={() => setCodeTab(tab)} style={{
                padding:'0.3rem 0.75rem', borderRadius:'var(--radius-sm) var(--radius-sm) 0 0',
                border:'1px solid var(--border-color)', borderBottom:'none',
                background: codeTab === tab ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                color: codeTab === tab ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor:'pointer', fontSize:'0.8rem', fontWeight: codeTab === tab ? 600 : 400,
                textTransform:'uppercase',
              }}>{tab}</button>
            ))}
          </div>
          <pre style={{
            flex:1, margin:0, padding:'1rem', background:'var(--bg-tertiary)',
            border:'1px solid var(--border-color)', borderRadius:'0 var(--radius-md) var(--radius-md) var(--radius-md)',
            overflow:'auto', fontFamily:'var(--font-mono)', fontSize:'0.85rem', lineHeight:1.5, color:'var(--text-primary)',
            whiteSpace:'pre-wrap', wordBreak:'break-all',
          }}>{codeTab === 'html' ? snippet.html : codeTab === 'css' ? snippet.css : snippet.js}</pre>
        </div>
      )}
    </div>
  );
}
