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
    <div className="fixed inset-0" style={{position: 'fixed', zIndex: 50, top:0, left:0, right:0, bottom:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.6)'}}>
      <div style={{background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
        <div style={{display: 'flex', gap: '0', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)'}}>
          <button onClick={() => { setAuthMode('signin'); setError(''); }} style={{
            flex: 1, padding: '0.75rem 0', fontSize: '0.95rem', fontWeight: authMode === 'signin' ? 700 : 500,
            color: authMode === 'signin' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            borderBottom: authMode === 'signin' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            background: 'transparent', cursor: 'pointer', transition: 'all 0.15s',
          }}>Sign In</button>
          <button onClick={() => { setAuthMode('signup'); setError(''); }} style={{
            flex: 1, padding: '0.75rem 0', fontSize: '0.95rem', fontWeight: authMode === 'signup' ? 700 : 500,
            color: authMode === 'signup' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            borderBottom: authMode === 'signup' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            background: 'transparent', cursor: 'pointer', transition: 'all 0.15s',
          }}>Sign Up</button>
        </div>
        <p style={{color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem', marginBottom: '0.5rem'}}>
          {title ? title : (authMode === 'signin' ? 'Sign in to access your cloud snippets' : 'Create an account to save snippets to the cloud')}
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
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
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          )}
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
          />
          <button type="submit" className="btn-primary" disabled={loading} style={{width: '100%', padding: '0.75rem', justifyContent: 'center'}}>
            {loading ? 'Please wait...' : (authMode === 'signin' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
        </div>

        <button type="button" className="btn-secondary" style={{width: '100%', padding: '0.75rem', justifyContent: 'center', gap: '0.75rem', display: 'flex', alignItems: 'center'}} onClick={async () => { await signIn(); onClose(); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
        <button type="button" className="btn-secondary" onClick={onClose} style={{marginTop: '0.5rem', width: '100%', border: 'none', background: 'transparent'}}>Cancel</button>
      </div>
    </div>
  );
}
