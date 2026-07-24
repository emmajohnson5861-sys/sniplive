'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import AuthModal from '@/components/AuthModal';

export default function LandingPage() {
  const { user, firebaseUser, initialized } = useAuthStore();
  const router = useRouter();
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    if (initialized && firebaseUser && user?.username) {
      router.replace(`/${user.username}`);
    }
  }, [initialized, firebaseUser, user?.username, router]);

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="font-body-md text-body-md selection:bg-primary selection:text-on-primary">
      {/* TopNavBar */}
      <nav className="flex justify-between items-center w-full px-margin-desktop h-16 z-50 fixed top-0 bg-surface border-b border-border-subtle">
        <div className="flex items-center gap-8">
          <span className="font-headline-md text-headline-md font-bold text-primary">SnipLive</span>
          <div className="hidden md:flex items-center gap-6">
            <a className="text-primary border-b-2 border-primary font-body-md py-5" href="#">Explore</a>
            <a className="text-text-secondary hover:bg-surface-container transition-colors font-body-md px-2 py-1 rounded" href="#">Community</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-text-secondary hover:text-primary transition-colors font-button-text font-bold" onClick={() => openAuth('signin')}>
            Log In
          </button>
          <button className="bg-primary text-on-primary px-4 py-2 rounded font-button-text font-bold hover:brightness-110 transition-all" onClick={() => openAuth('signup')}>
            Sign Up
          </button>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-margin-desktop" style={{ maxWidth: 'var(--container-max)', margin: '0 auto' }}>
        {/* Hero Section */}
        <section className="grid lg:grid-cols-2 gap-16 items-center mb-32">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-highest border border-border-subtle" style={{ borderRadius: '9999px' }}>
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-label-sm font-label-sm uppercase tracking-wider text-primary">v2.0 Now Live</span>
            </div>
            
            <h1 className="font-headline-lg leading-tight text-on-surface" style={{ fontSize: 'clamp(48px, 5vw, 64px)' }}>
              Your code <br />
              <span className="text-primary italic">comes alive</span>
            </h1>
            
            <p className="text-text-secondary text-lg max-w-md leading-relaxed">
              A minimalist snippet manager designed for the modern developer. Write, preview, and share live code components in a distraction-free environment.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={() => openAuth('signup')}
                className="bg-primary text-on-primary px-8 py-3 rounded font-button-text font-bold hover:brightness-110 transition-all flex items-center gap-2"
              >
                Start Snipping Free
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
              </button>
              
              <Link href="/sandbox" className="border border-border-subtle hover:bg-surface-container text-on-surface px-8 py-3 rounded font-button-text font-bold transition-all flex items-center">
                Try Sandbox (No Login)
              </Link>
            </div>
          </div>
          
          {/* Code Preview Visual */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full opacity-50 group-hover:opacity-75 transition-opacity" style={{ filter: 'blur(64px)' }}></div>
            <div className="bento-card rounded-xl overflow-hidden code-glow relative bg-surface-container-low border border-border-subtle">
              {/* Editor Header */}
              <div className="h-10 bg-surface-container-low border-b border-border-subtle flex items-center justify-between px-4">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-error/40"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-tertiary/40"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-success/40"></div>
                </div>
                <span className="text-label-sm font-label-sm text-text-secondary">AnimatedButton.tsx</span>
                <div className="flex gap-2">
                  <span className="material-symbols-outlined text-text-secondary" style={{ fontSize: '16px' }}>content_copy</span>
                </div>
              </div>
              
              {/* Editor Content */}
              <div className="flex h-[400px]" style={{ height: '400px' }}>
                <div className="w-12 bg-surface-container-lowest border-r border-border-subtle pt-4 flex flex-col items-center text-text-secondary font-code-block text-[12px] select-none" style={{ width: '48px' }}>
                  <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span>
                </div>
                <div className="flex-1 p-4 font-code-block leading-relaxed overflow-hidden" style={{ fontSize: '13px' }}>
                  <pre className="text-[#9CDCFE]"><span className="text-[#C586C0]">export default function</span> <span className="text-[#DCDCAA]">App</span>() {'{'}</pre>
                  <pre className="text-[#9CDCFE] ml-4">  <span className="text-[#C586C0]">return</span> (</pre>
                  <pre className="text-[#9CDCFE] ml-8">    &lt;<span className="text-[#4EC9B0]">div</span> <span className="text-[#9CDCFE]">className</span>=<span className="text-[#CE9178]">"flex items-center"</span>&gt;</pre>
                  <pre className="text-[#9CDCFE] ml-12">      &lt;<span className="text-[#4EC9B0]">button</span> <span className="text-[#9CDCFE]">className</span>=<span className="text-[#CE9178]">"bg-teal-400..."</span>&gt;</pre>
                  <pre className="text-text-primary ml-16" style={{ color: '#D4D4D4' }}>        Click Me</pre>
                  <pre className="text-[#9CDCFE] ml-12">      &lt;/<span className="text-[#4EC9B0]">button</span>&gt;</pre>
                  <pre className="text-[#9CDCFE] ml-8">    &lt;/<span className="text-[#4EC9B0]">div</span>&gt;</pre>
                  <pre className="text-[#9CDCFE] ml-4">  );</pre>
                  <pre className="text-[#9CDCFE]">{'}'}</pre>
                </div>
                
                {/* Floating Preview Overlay */}
                <div className="absolute right-8 bottom-8 w-48 h-48 bg-surface-container-highest border border-primary/50 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-bounce-slow" style={{ width: '192px', height: '192px' }}>
                  <div className="bg-surface-container h-6 flex items-center px-3 border-b border-border-subtle">
                    <span className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Live Preview</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center p-4">
                    <button className="bg-primary text-on-primary font-bold px-4 py-2 rounded shadow-lg transform hover:scale-105 transition-transform">
                      Interactive
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="mb-32">
          <div className="mb-12">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">Built for performance</h2>
            <p className="text-text-secondary max-w-xl">Everything you need to manage your personal code library and collaborate with your team without the friction of a heavy IDE.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 rounded-xl p-8 flex flex-col justify-between group h-[320px] bg-surface-container-low border border-border-subtle hover:border-primary transition-colors" style={{ height: '320px' }}>
              <div>
                <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center rounded-lg mb-6">
                  <span className="material-symbols-outlined">bolt</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Instant Live Preview</h3>
                <p className="text-text-secondary max-w-sm">See changes as you type. Our real-time renderer handles HTML, CSS, and JS with zero latency.</p>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <span className="text-label-sm font-label-sm text-primary uppercase">Learn more</span>
                <div className="h-px flex-1 bg-border-subtle group-hover:bg-primary transition-colors"></div>
              </div>
            </div>
            
            <div className="rounded-xl p-8 flex flex-col justify-between group h-[320px] bg-surface-container-low border border-border-subtle hover:border-primary transition-colors" style={{ height: '320px' }}>
              <div>
                <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center rounded-lg mb-6">
                  <span className="material-symbols-outlined">folder</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Collections</h3>
                <p className="text-text-secondary">Organize your snippets into semantic groups. Share entire folders.</p>
              </div>
              <div className="flex items-center justify-end">
                <span className="material-symbols-outlined text-text-secondary group-hover:text-primary group-hover:translate-x-1 transition-all">arrow_forward</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative rounded-2xl border overflow-hidden p-12 text-center" style={{ borderColor: 'rgba(126, 214, 205, 0.3)', background: 'linear-gradient(to bottom right, var(--surface-container-low), var(--surface))' }}>
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="font-headline-lg text-[40px] text-on-surface">Ready to streamline your workflow?</h2>
            <p className="text-text-secondary text-lg">Join developers who manage their code intelligently with SnipLive.</p>
            <div className="flex justify-center pt-4">
              <button 
                onClick={() => openAuth('signup')}
                className="bg-primary text-on-primary px-10 py-4 rounded-lg font-button-text font-bold hover:scale-105 transition-transform shadow-xl"
              >
                Create Your First Snippet
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-12 px-margin-desktop bg-surface border-t border-border-subtle">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <span className="font-headline-md text-headline-md text-on-surface font-bold">SnipLive</span>
            <p className="font-label-sm text-label-sm text-text-secondary">© 2024 SnipLive. Built for developers.</p>
          </div>
        </div>
      </footer>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} defaultMode={authMode} />
    </div>
  );
}
