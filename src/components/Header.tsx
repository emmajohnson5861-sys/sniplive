'use client';

import React from 'react';
import styles from './Header.module.css';
import { useAuthStore } from '@/store/auth-store';
import { useSidebar } from '@/context/SidebarContext';
import { useTheme } from '@/context/ThemeContext';

export default function Header() {
  const { user } = useAuthStore();
  const { toggle: toggleSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <h1 className={styles.logo}>SnipLive</h1>
        <div className={styles.searchContainer}>
          <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
          <input 
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
        
        {user ? (
          <div className={styles.profileSection}>
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
          <button className="btn-primary" style={{ padding: '0.4rem 1rem' }}>
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
