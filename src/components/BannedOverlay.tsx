'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { AlertTriangle } from 'lucide-react';
import { sendNotification } from '@/lib/firebase-db';

export default function BannedOverlay() {
  const { user, firebaseUser, initialized } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [shake, setShake] = useState(false);
  const [unbanRequested, setUnbanRequested] = useState(false);

  // Do not show anything if not initialized, user is not logged in, or user is not banned
  if (!initialized || !user || !user.isBanned) return null;

  // Let them view profiles unhindered (where they can already request unban)
  if (pathname.startsWith('/u/')) return null;

  const handleOverlayClick = () => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  const handleRequestUnban = async (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent overlay click from shaking it again
    if (!firebaseUser || !user) return;
    try {
      await sendNotification({
        type: 'UNBAN_REQUEST',
        fromUserId: firebaseUser.uid,
        fromUserName: user.name,
        fromUserEmail: user.email,
      });
      setUnbanRequested(true);
      alert('Unban request sent to administrators.');
    } catch (err) {
      console.error(err);
      alert('Failed to send request.');
    }
  };

  const handleGoToProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/u/${user.username || firebaseUser?.uid}`);
  };

  return (
    <div 
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--error)',
          padding: '2.5rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '90%',
        }}
      >
        <AlertTriangle size={48} color="var(--error)" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ color: 'var(--error)', marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Account Suspended</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.5 }}>
          Your account has been banned due to a violation of our terms. You can no longer create or interact with snippets.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button 
            onClick={handleRequestUnban}
            disabled={unbanRequested}
            className={shake ? 'shake-animation' : ''}
            style={{
              background: unbanRequested ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
              color: unbanRequested ? 'var(--text-secondary)' : '#fff',
              border: 'none', 
              padding: '0.85rem', 
              borderRadius: 'var(--radius-md)',
              fontWeight: 600, 
              cursor: unbanRequested ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              transition: 'background 0.2s',
            }}
          >
            {unbanRequested ? 'Request Sent' : 'Request Unban'}
          </button>
          
          <button 
            onClick={handleGoToProfile}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s',
            }}
          >
            View My Profile
          </button>
        </div>
      </div>
    </div>
  );
}
