'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getUserByUsernameOrId, getPublicUserSnippets, getUserSnippets, FirestoreUser, FirestoreSnippet, sendNotification } from '@/lib/firebase-db';
import { User, Code2, Globe, Home, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore, initAuthListener } from '@/store/auth-store';
import SnippetPreviewCard from '@/components/SnippetPreviewCard';
import BannedUserView from '@/components/BannedUserView';
import styles from './ProfileClient.module.css';

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [userProfile, setUserProfile] = useState<FirestoreUser | null>(null);
  const { firebaseUser, initialized } = useAuthStore();
  const [snippets, setSnippets] = useState<FirestoreSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [unbanRequested, setUnbanRequested] = useState(false);

  useEffect(() => {
    initAuthListener();
  }, []);

  useEffect(() => {
    if (!username || !initialized) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const u = await getUserByUsernameOrId(username as string);
        setUserProfile(u);
        if (u) {
          const isOwner = firebaseUser?.uid === u.id;
          let s: FirestoreSnippet[] = [];
          if (isOwner) {
            s = await getUserSnippets(u.id);
          } else {
            s = await getPublicUserSnippets(u.id);
          }
          setSnippets(s);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, [username, firebaseUser, initialized]);

  const handleRequestUnban = async () => {
    if (!firebaseUser || !userProfile) return;
    try {
      await sendNotification({
        type: 'UNBAN_REQUEST',
        fromUserId: firebaseUser.uid,
        fromUserName: userProfile.name,
        fromUserEmail: userProfile.email,
      });
      setUnbanRequested(true);
      alert('Unban request sent to administrators.');
    } catch (err) {
      console.error(err);
      alert('Failed to send request.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading profile...</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)', flexDirection: 'column', gap: '1rem' }}>
        <User size={48} style={{ color: 'var(--text-secondary)' }} />
        <h1 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.5rem' }}>User not found</h1>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Top nav bar */}
      <div style={{ padding: '0.85rem 2rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem' }}>
          <Code2 size={20} color="var(--accent-primary)" />
          <span>SnipLive</span>
        </Link>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>/</span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Profile</span>
        <Link href="/" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
          <Home size={14} /> Home
        </Link>
      </div>
      <div style={{ padding: '2rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Profile Header */}
          <div className={styles.profileHeader}>
            <div className={styles.avatar}>
              <User size={40} color="var(--text-secondary)" />
            </div>
            <div className={styles.info}>
              <h1 className={styles.title}>{userProfile.name || 'Anonymous User'}</h1>
              <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <Globe size={16} /> {firebaseUser?.uid === userProfile.id ? 'Your Profile' : 'Public Profile'}
              </div>
            </div>
          </div>

          {/* Banned Message */}
          {userProfile.isBanned && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {firebaseUser?.uid === userProfile.id ? (
                 <BannedUserView inline={true} />
              ) : (
                <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--error)', textAlign: 'center', width: '100%' }}>
                  <AlertTriangle size={48} color="var(--error)" style={{ margin: '0 auto 1rem' }} />
                  <h2 style={{ color: 'var(--error)' }}>This account has been suspended.</h2>
                </div>
              )}
            </div>
          )}

          {!userProfile.isBanned && (
            <>
              {/* Snippets */}
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Code2 size={20} color="var(--accent-primary)" />
                  {firebaseUser?.uid === userProfile.id ? 'All Snippets' : 'Public Snippets'}
                </h2>
                {snippets.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No snippets available.</div>
                ) : (
                  <div className={styles.grid}>
                    {snippets.map(s => (
                      <SnippetPreviewCard key={s.id} snippet={s} isOwner={firebaseUser?.uid === userProfile.id} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
