'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
  title?: string;
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'signin', title }: AuthModalProps) {
  const { signIn, signInWithEmail, signUpWithEmail } = useAuthStore();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(defaultMode);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password || (authMode === 'signup' && !name)) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'signup') {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      if (err.message === 'there already account created on this mail continue with google') {
        setError(err.message);
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0" style={{position: 'fixed', zIndex: 50, top:0, left:0, right:0, bottom:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)'}}>
      <div style={{background: 'var(--surface-container-low)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', width: '90%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'}}>
        <div style={{display: 'flex', gap: '0', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)'}}>
          <button onClick={() => { setAuthMode('signin'); setError(''); }} style={{
            flex: 1, padding: '0.75rem 0', fontSize: '0.95rem', fontWeight: authMode === 'signin' ? 700 : 500,
            color: authMode === 'signin' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: authMode === 'signin' ? '2px solid var(--primary)' : '2px solid transparent',
            background: 'transparent', cursor: 'pointer', transition: 'all 0.15s',
            fontFamily: 'var(--font-geist)'
          }}>Sign In</button>
          <button onClick={() => { setAuthMode('signup'); setError(''); }} style={{
            flex: 1, padding: '0.75rem 0', fontSize: '0.95rem', fontWeight: authMode === 'signup' ? 700 : 500,
            color: authMode === 'signup' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: authMode === 'signup' ? '2px solid var(--primary)' : '2px solid transparent',
            background: 'transparent', cursor: 'pointer', transition: 'all 0.15s',
            fontFamily: 'var(--font-geist)'
          }}>Sign Up</button>
        </div>
        <p style={{color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem', marginBottom: '0.5rem'}}>
          {title ? title : (authMode === 'signin' ? 'Sign in to access your cloud snippets' : 'Create an account to save snippets to the cloud')}
        </p>

        {error && (
          <div style={{ background: 'rgba(196, 90, 90, 0.1)', color: 'var(--error)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', textAlign: 'center', border: '1px solid rgba(196, 90, 90, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {authMode === 'signup' && (
            <input 
              type="text" 
              placeholder="Full Name" 
              value={name} 
              onChange={e => setName(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--surface-container-highest)', color: 'var(--text-primary)' }}
            />
          )}
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--surface-container-highest)', color: 'var(--text-primary)' }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--surface-container-highest)', color: 'var(--text-primary)' }}
          />
          <button type="submit" className="bg-primary text-on-primary rounded" disabled={loading} style={{width: '100%', padding: '0.75rem', fontWeight: 600, transition: 'all 0.2s', opacity: loading ? 0.7 : 1}}>
            {loading ? 'Please wait...' : (authMode === 'signin' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
        </div>

        <button type="button" style={{width: '100%', padding: '0.75rem', justifyContent: 'center', gap: '0.75rem', display: 'flex', alignItems: 'center', border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)', fontWeight: 500, transition: 'background 0.2s'}} onClick={async () => { await signIn(); onClose(); }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-container)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
        <button type="button" onClick={onClose} style={{marginTop: '0.2rem', width: '100%', border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'color 0.2s'}} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>Cancel</button>
      </div>
    </div>
  );
}
