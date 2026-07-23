'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, initAuthListener } from '@/store/auth-store';

export default function AuthPage() {
  const router = useRouter();
  const { user, initialized } = useAuthStore();

  useEffect(() => {
    initAuthListener();
  }, []);

  useEffect(() => {
    if (initialized) {
      router.push(user ? ((user.role === 'ADMIN' || user.role === 'EDITOR') ? '/admin' : '/') : '/');
    }
  }, [initialized, user, router]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)',
    }}>
      <p>Signing you in...</p>
    </div>
  );
}
