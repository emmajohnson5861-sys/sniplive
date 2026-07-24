'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { Code2, Play, LogIn, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const { user, firebaseUser, signIn, initialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (initialized && firebaseUser && user?.username) {
      router.replace(`/${user.username}`);
    }
  }, [initialized, firebaseUser, user?.username, router]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navbar */}
      <nav style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
          <Code2 size={24} color="var(--accent-primary)" />
          SnipLive
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-secondary" onClick={() => signIn()}>
            <LogIn size={16} /> Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem', maxWidth: '800px', lineHeight: 1.2 }}>
          Write Code. <br/>
          <span style={{ color: 'var(--accent-primary)' }}>See it Live.</span> <br/>
          Save in Seconds.
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '3rem', maxWidth: '600px', lineHeight: 1.6 }}>
          SnipLive is the fastest way to prototype and share HTML, CSS, and JS. Create stunning interactive snippets instantly.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            className="btn-primary" 
            style={{ padding: '1rem 2rem', fontSize: '1.1rem', gap: '0.75rem', borderRadius: 'var(--radius-lg)' }}
            onClick={async () => {
              await signIn();
            }}
          >
            Start Coding Now <ArrowRight size={20} />
          </button>
          
          <Link href="/sandbox" style={{ textDecoration: 'none' }}>
            <button className="btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem', gap: '0.75rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-tertiary)' }}>
              <Play size={20} /> Try Sandbox (No Login)
            </button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginTop: '5rem', maxWidth: '1000px', width: '100%' }}>
          {[
            { title: 'Instant Preview', desc: 'See your HTML, CSS, and JS render side-by-side in real-time as you type.' },
            { title: 'Cloud Sync', desc: 'Sign in to save your snippets to the cloud and access them from anywhere.' },
            { title: 'Share & Fork', desc: 'Share your work with custom URLs or fork other people\'s public snippets.' }
          ].map((feature, i) => (
            <div key={i} style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{feature.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

    </div>
  );
}
