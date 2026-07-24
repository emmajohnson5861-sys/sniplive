import React, { useState, useEffect } from 'react';
import { sendNotification } from '@/lib/firebase-db';
import { useAuthStore } from '@/store/auth-store';
import styles from './BannedUserView.module.css';

export default function BannedUserView({ inline = false }: { inline?: boolean }) {
  const { user } = useAuthStore();
  const [requestSent, setRequestSent] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Expose shake function globally so layout click handlers can trigger it
  useEffect(() => {
    const handleGlobalShake = () => {
      if (!isShaking) {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    };
    window.addEventListener('trigger-ban-shake', handleGlobalShake);
    return () => window.removeEventListener('trigger-ban-shake', handleGlobalShake);
  }, [isShaking]);

  const handleInteraction = (e: React.MouseEvent) => {
    // If they click the background, we shake the button
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleRequestUnban = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await sendNotification({
        type: 'UNBAN_REQUEST',
        fromUserId: user.id,
        fromUserName: user.name || user.username || null,
        fromUserEmail: user.email,
      });
      setRequestSent(true);
    } catch (e) {
      console.error('Failed to send unban request', e);
    }
  };

  const content = (
    <div className={styles.bannedCard} style={inline ? { boxShadow: 'none', border: '1px solid var(--error)' } : {}} onClick={(e) => e.stopPropagation()}>
      <div className={styles.iconWrapper}>
        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--error)' }}>warning</span>
      </div>
      <h1 className={styles.title}>Account Suspended</h1>
      <p className={styles.description}>
        Your account has been banned due to violations of our community guidelines. You cannot create, edit, or view snippets while banned.
      </p>
      
      {!requestSent ? (
        <button 
          className={`${styles.unbanBtn} ${isShaking ? styles.shake : ''}`} 
          onClick={handleRequestUnban}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
          Request Unban
        </button>
      ) : (
        <div className={styles.successMessage}>
          <p>Your request has been sent to the administrators. Please wait for a response.</p>
        </div>
      )}
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className={styles.bannedOverlay} onClick={handleInteraction}>
      {content}
    </div>
  );
}
