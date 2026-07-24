'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import AuthModal from '@/components/AuthModal';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  const { user, firebaseUser, initialized } = useAuthStore();
  const router = useRouter();
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // We still do the automatic redirect if they land here and are logged in,
  // but if they navigate back we might want them to be able to see the page.
  // Actually, usually a landing page redirects logged-in users to their dashboard.
  // I will keep the redirect, but also update the button to navigate to dashboard if clicked.
  useEffect(() => {
    if (initialized && firebaseUser && user?.username) {
      router.replace(`/${user.username}`);
    }
  }, [initialized, firebaseUser, user?.username, router]);

  const handleStartSnipping = () => {
    if (user?.username) {
      router.push(`/${user.username}`);
    } else {
      setAuthMode('signup');
      setIsAuthModalOpen(true);
    }
  };

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className={styles.container}>
      {/* TopNavBar */}
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <div className={styles.navLeft}>
            <span className={styles.logo}>SnipLive</span>
            <div className={styles.navLinks}>
              <a href="#" className={styles.navLinkActive}>Explore</a>
              <Link href="/components" className={styles.navLink}>Components</Link>
            </div>
          </div>
          <div className={styles.navActions}>
            {initialized && firebaseUser && user ? (
              /* Logged-in state */
              <>
                <button
                  className={styles.goToSnippetsBtn}
                  onClick={() => router.push(`/${user.username}`)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>code</span>
                  My Snippets
                </button>
                <div
                  className={styles.navAvatar}
                  onClick={() => router.push(`/${user.username}/profile`)}
                  title={user.name || user.username || ''}
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    <span>{(user.name || user.username || 'U')[0].toUpperCase()}</span>
                  )}
                </div>
              </>
            ) : (
              /* Logged-out state */
              <>
                <button className={styles.loginBtn} onClick={() => openAuth('signin')}>
                  Log In
                </button>
                <button className={styles.signupBtn} onClick={() => openAuth('signup')}>
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <span className={styles.badgeDot}></span>
              <span className={styles.badgeText}>v2.0 Now Live</span>
            </div>
            
            <h1 className={styles.heroTitle}>
              Your code <br />
              <span className={styles.heroTitleEm}>comes alive</span>
            </h1>
            
            <p className={styles.heroDesc}>
              A minimalist snippet manager designed for the modern developer. Write, preview, and share live code components in a distraction-free environment.
            </p>
            
            <div className={styles.heroActions}>
              <button 
                onClick={handleStartSnipping}
                className={styles.primaryHeroBtn}
              >
                Start Snipping Free
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
              </button>
              
              <Link href="/sandbox" className={styles.secondaryHeroBtn}>
                Try Sandbox (No Login)
              </Link>
            </div>
          </div>
          
          {/* Code Preview Visual */}
          <div className={styles.heroVisual}>
            <div className={styles.visualGlow}></div>
            <div className={styles.editorMockup}>
              {/* Editor Header */}
              <div className={styles.editorHeader}>
                <div className={styles.macDots}>
                  <div className={`${styles.macDot} ${styles.macDotRed}`}></div>
                  <div className={`${styles.macDot} ${styles.macDotYellow}`}></div>
                  <div className={`${styles.macDot} ${styles.macDotGreen}`}></div>
                </div>
                <span className={styles.editorFilename}>AnimatedButton.tsx</span>
                <span className={`material-symbols-outlined ${styles.editorIcon}`}>content_copy</span>
              </div>
              
              {/* Editor Content */}
              <div className={styles.editorBody}>
                <div className={styles.lineNumbers}>
                  <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span>
                </div>
                <div className={styles.codeArea}>
                  <pre><span style={{color: '#C586C0'}}>export default function</span> <span style={{color: '#DCDCAA'}}>App</span>() {'{'}</pre>
                  <pre>  <span style={{color: '#C586C0'}}>return</span> (</pre>
                  <pre>    &lt;<span style={{color: '#4EC9B0'}}>div</span> <span style={{color: '#9CDCFE'}}>className</span>=<span style={{color: '#CE9178'}}>"flex items-center"</span>&gt;</pre>
                  <pre>      &lt;<span style={{color: '#4EC9B0'}}>button</span> <span style={{color: '#9CDCFE'}}>className</span>=<span style={{color: '#CE9178'}}>"bg-teal-400..."</span>&gt;</pre>
                  <pre style={{ color: '#D4D4D4' }}>        Click Me</pre>
                  <pre>      &lt;/<span style={{color: '#4EC9B0'}}>button</span>&gt;</pre>
                  <pre>    &lt;/<span style={{color: '#4EC9B0'}}>div</span>&gt;</pre>
                  <pre>  );</pre>
                  <pre>{'}'}</pre>
                </div>
                
                {/* Floating Preview Overlay */}
                <div className={styles.floatPreview}>
                  <div className={styles.floatPreviewHeader}>
                    <span className={styles.floatPreviewTitle}>Live Preview</span>
                  </div>
                  <div className={styles.floatPreviewBody}>
                    <button className={styles.floatPreviewBtn}>
                      Interactive
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className={styles.featuresSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Built for performance</h2>
            <p className={styles.sectionDesc}>Everything you need to manage your personal code library and collaborate with your team without the friction of a heavy IDE.</p>
          </div>
          
          <div className={styles.featuresGrid}>
            <div className={styles.featureCardLarge}>
              <div>
                <div className={styles.featureIconWrapper}>
                  <span className="material-symbols-outlined">bolt</span>
                </div>
                <h3 className={styles.featureTitle}>Instant Live Preview</h3>
                <p className={styles.featureDesc}>See changes as you type. Our real-time renderer handles HTML, CSS, and JS with zero latency.</p>
              </div>
              <div className={styles.featureLinkArea}>
                <span className={styles.featureLinkText}>Learn more</span>
                <div className={styles.featureLine}></div>
              </div>
            </div>
            
            <div className={styles.featureCardSmall}>
              <div>
                <div className={styles.featureIconWrapper}>
                  <span className="material-symbols-outlined">folder</span>
                </div>
                <h3 className={styles.featureTitle}>Collections</h3>
                <p className={styles.featureDesc}>Organize your snippets into semantic groups. Share entire folders.</p>
              </div>
              <div className={styles.featureArrowArea}>
                <span className={`material-symbols-outlined ${styles.featureArrowIcon}`}>arrow_forward</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to streamline your workflow?</h2>
            <p className={styles.ctaDesc}>Join developers who manage their code intelligently with SnipLive.</p>
            <div className={styles.ctaAction}>
              <button 
                onClick={handleStartSnipping}
                className={styles.ctaBtn}
              >
                Create Your First Snippet
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div>
            <div className={styles.footerBrand}>SnipLive</div>
            <p className={styles.footerCopy}>© 2024 SnipLive. Built for developers.</p>
          </div>
        </div>
      </footer>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} defaultMode={authMode} />
    </div>
  );
}
