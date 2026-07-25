'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore, initAuthListener } from '@/store/auth-store';
import { getUnreadNotificationCount } from '@/lib/firebase-db';
import styles from './AdminLayout.module.css';
import { useTheme } from '@/context/ThemeContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    initAuthListener();
  }, []);

  useEffect(() => {
    if (initialized && (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR') || user.isBanned)) {
      router.push('/');
    }
  }, [initialized, user, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.role === 'EDITOR') {
      const fetch = async () => {
        try {
          const n = await getUnreadNotificationCount();
          setUnread(n);
        } catch {}
      };
      fetch();
      const interval = setInterval(fetch, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
    { href: '/admin/users', label: 'Users', icon: 'group' },
    { href: '/admin/moderation', label: 'Moderation', icon: 'gavel' },
    { href: '/admin/notifications', label: 'Notifications', icon: 'notifications', badge: unread },
  ];

  if (loading || !initialized || !user || (user.role !== 'ADMIN' && user.role !== 'EDITOR') || user.isBanned) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--surface)', color: 'var(--text-primary)' }}>
        <p>Checking access...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <h1>Admin Panel</h1>
          <p>System Control</p>
        </div>
        
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={styles.badge}>{item.badge}</span>
                )}
              </Link>
            );
          })}
          
          <button 
            onClick={toggleTheme} 
            className={styles.navLink} 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', color: 'var(--text-secondary)' }}
          >
            <span className="material-symbols-outlined">
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
          
          <div className={styles.backLinkContainer}>
            <Link href="/" className={styles.backLink}>
              <span className="material-symbols-outlined">arrow_back</span>
              <span>Back to app</span>
            </Link>
          </div>
        </nav>
        
        <div className={styles.userProfile}>
          <div className={styles.userProfileInner}>
            <div className={styles.avatar}>
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name || 'Admin User'}</span>
              <span className={styles.userRole}>{user?.role === 'ADMIN' ? 'Super Admin' : 'Moderator'}</span>
            </div>
          </div>
        </div>
      </aside>
      
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
