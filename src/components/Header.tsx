'use client';

import React from 'react';
import styles from './Header.module.css';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSidebar } from '@/context/SidebarContext';
import { useTheme } from '@/context/ThemeContext';

export default function Header() {
  const { user, initialized } = useAuthStore();
  const { toggle: toggleSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <img src="/logo.png" alt="SnipLive" className={styles.logoImg} onClick={() => router.push('/')} />
        <div className={styles.navLinks}>
          <Link href="/" className={styles.navLink}>Explore</Link>
          <Link href="/components" className={styles.navLink}>Components</Link>
        </div>
        <div className={styles.searchContainer}>
          <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
          <input 
            id="global-search-input"
            type="text" 
            placeholder="Search snippets..." 
            className={styles.searchInput}
          />
        </div>
      </div>
      
      <div className={styles.rightSection}>
        <button className={styles.iconBtn} onClick={toggleTheme} title="Toggle Theme">
          <span className="material-symbols-outlined">
            {theme === 'light' ? 'dark_mode' : 'light_mode'}
          </span>
        </button>
        <div className={styles.divider}></div>
        
        {!initialized ? (
          <div style={{ width: '120px', height: '40px', background: 'var(--surface-alt)', borderRadius: 'var(--radius-DEFAULT)', animation: 'pulse 1.5s infinite' }}></div>
        ) : user ? (
          <div 
            className={styles.profileSection} 
            onClick={() => router.push(`/${user.username}/profile`)}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.profileInfo}>
              <p className={styles.profileName}>{user.name || user.username}</p>
              <p className={styles.profileEmail}>{user.email || `@${user.username}`}</p>
            </div>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className={styles.avatar} />
            ) : (
              <div className={styles.avatarFallback}>
                {(user.name || user.username || 'U')[0].toUpperCase()}
              </div>
            )}
          </div>
        ) : (
          <button className="btn-primary" style={{ padding: '0.4rem 1rem' }} onClick={() => window.dispatchEvent(new CustomEvent('open-auth', { detail: 'signin' }))}>
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
