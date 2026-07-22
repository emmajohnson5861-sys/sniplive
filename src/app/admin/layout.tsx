'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore, initAuthListener } from '@/store/auth-store';
import { getUnreadNotificationCount } from '@/lib/firebase-db';
import { LayoutDashboard, Users, Flag, ArrowLeft, Shield, Bell } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    initAuthListener();
  }, []);

  useEffect(() => {
    if (initialized && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [initialized, user, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
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
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/moderation', label: 'Moderation', icon: Flag },
    { href: '/admin/notifications', label: 'Notifications', icon: Bell, badge: unread },
  ];

  if (loading || !initialized || !user || user.role !== 'ADMIN') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <p>Checking access...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)' }}>
      <aside style={{
        width: 220, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div style={{
          height: 56, display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0 1.25rem', borderBottom: '1px solid var(--border-color)',
          fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)',
        }}>
          <Shield size={20} color="var(--accent-primary)" />
          Admin
        </div>
        <nav style={{ flex: 1, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                  padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--bg-tertiary)' : 'transparent',
                }}
              >
                <Icon size={16} />
                {item.label}
                {item.badge !== undefined && item.badge > 0 && (
                  <span style={{
                    marginLeft: 'auto', background: 'var(--error)', color: '#fff',
                    fontSize: '0.7rem', fontWeight: 700, borderRadius: '10px',
                    padding: '0.1rem 0.45rem', lineHeight: '1.3',
                  }}>{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-color)' }}>
          <Link
            href="/"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none',
            }}
          >
            <ArrowLeft size={14} />
            Back to app
          </Link>
        </div>
      </aside>
      <main style={{ flex: 1, overflow: 'auto', padding: '1.5rem 2rem' }}>
        {children}
      </main>
    </div>
  );
}
