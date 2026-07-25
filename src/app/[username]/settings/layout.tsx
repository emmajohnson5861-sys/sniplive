'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useTheme } from '@/context/ThemeContext';
import styles from './layout.module.css';

export default function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { username: string };
}) {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { id: 'account', label: 'Account', icon: 'person', href: `/${params.username}/settings/account` },
    { id: 'preferences', label: 'Preferences', icon: 'settings', href: `/${params.username}/settings/preferences` },
    { id: 'editor', label: 'Editor', icon: 'code', href: `/${params.username}/settings` },
    { id: 'api', label: 'API & Integrations', icon: 'api', href: `/${params.username}/settings/api` },
    { id: 'security', label: 'Security', icon: 'security', href: `/${params.username}/settings/security` },
  ];

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <img src="https://lh3.googleusercontent.com/aida/AP1WRLu8eh8wcnlnaa83HY_9VLGhoXOcbd0oJ63wV5y0t0s_n2xVy_wDMJIwjaVotc0qoBseVTwYUpSeNNwSLE9Gges9EQ8pCzAG15SDP0Ecbmx_10DUnq_Rh1vqNFpco4VI05phrBtJGyBvAgEbRCywE_8qtFculT1rj2QbPvo690iVBBmnTEZQ5SL9go39M3G1n6b1VfU9EMsWWe45ZHE_HhWy6f33kvdOX1rC44o3pFl2cJrqqSZDjmzPZFAJ" alt="Logo" className={styles.brandLogo} />
          <div>
            <h1 className={styles.brandName}>SnipLive</h1>
            <p className={styles.brandSub}>Settings Panel</p>
          </div>
        </div>

        <nav className={styles.nav}>
          {navItems.map(item => {
            // Treat the base /settings as the editor route based on design
            const isActive = pathname === item.href || (item.id === 'editor' && pathname === `/${params.username}/settings`);
            
            return (
              <div 
                key={item.id} 
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                onClick={() => router.push(item.href)}
              >
                <span className={`material-symbols-outlined ${styles.navIcon}`}>{item.icon}</span>
                <span className={styles.navText}>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div className={styles.userSection}>
          <div className={styles.userProfile} onClick={() => router.push(`/${params.username}/profile`)}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className={styles.avatar} />
            ) : (
              <div className={styles.avatar}>
                {user?.name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className={styles.userInfo}>
              <p className={styles.userName}>{user?.name || user?.username || 'User'}</p>
              <p className={styles.userEmail}>{user?.email || `@${user?.username}`}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1 className={styles.headerTitle}>Editor Settings</h1>
          
          <div className={styles.headerActions}>
            <div className={styles.headerLinks}>
              <a href="#" className={styles.headerLink}>Docs</a>
              <a href="#" className={styles.headerLink}>Support</a>
              <a href="#" className={styles.headerLink}>Changelog</a>
            </div>
            
            <div className={styles.headerDivider}></div>
            
            <div className={styles.actionButtons}>
              <button className={styles.iconBtn} onClick={() => router.push('/')}>
                <span className="material-symbols-outlined">home</span>
              </button>
              <button className={styles.iconBtn} onClick={toggleTheme} title="Toggle Theme">
                <span className="material-symbols-outlined">
                  {theme === 'light' ? 'dark_mode' : 'light_mode'}
                </span>
              </button>
              <button className={styles.saveBtn} onClick={() => {
                // In a real app, this might trigger a remote save. 
                // For local Zustand, it's auto-saved, so we can just show a toast or nothing.
                alert('Settings saved locally!');
              }}>
                Save Changes
              </button>
            </div>
          </div>
        </header>

        <div className={styles.contentWrapper}>
          <div className={styles.contentContainer}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
