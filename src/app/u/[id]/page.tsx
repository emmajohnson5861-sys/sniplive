'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getUser, getPublicUserSnippets, getPublicUserGroups, getUserSnippets, FirestoreUser, FirestoreSnippet, FirestoreGroup } from '@/lib/firebase-db';
import { User, Code2, Folder, Globe, Home } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore, initAuthListener } from '@/store/auth-store';
import SnippetPreviewCard from '@/components/SnippetPreviewCard';

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [userProfile, setUserProfile] = useState<FirestoreUser | null>(null);
  const { firebaseUser, initialized } = useAuthStore();
  const [snippets, setSnippets] = useState<FirestoreSnippet[]>([]);
  const [groups, setGroups] = useState<FirestoreGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuthListener();
  }, []);

  useEffect(() => {
    // Wait until auth is initialized before deciding which snippets to fetch
    if (!id || !initialized) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const u = await getUser(id as string);
        setUserProfile(u);
        if (u) {
          const isOwner = firebaseUser?.uid === id;
          let s: FirestoreSnippet[] = [];
          if (isOwner) {
            s = await getUserSnippets(id as string);
          } else {
            s = await getPublicUserSnippets(id as string);
          }
          const g = await getPublicUserGroups(id as string);
          setSnippets(s);
          setGroups(g);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, [id, firebaseUser, initialized]);


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
      {/* Top nav bar with home link */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'var(--bg-secondary)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
            <User size={40} color="var(--text-secondary)" />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{userProfile.name || 'Anonymous User'}</h1>
            <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Globe size={16} /> {firebaseUser?.uid === id ? 'Your Profile' : 'Public Profile'}
            </div>
          </div>
        </div>

        {/* Public Groups */}
        {groups.length > 0 && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Folder size={20} color="var(--accent-primary)" />
              Public Collections
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {groups.map(g => (
                <Link key={g.id} href={`/g/${g.id}`} style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem', transition: 'border-color 0.2s', cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{g.title}</div>
                  {g.description && <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{g.description}</div>}
                  <div style={{ marginTop: 'auto', paddingTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {g.snippetIds?.length || 0} Snippets
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Public Snippets */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Code2 size={20} color="var(--accent-primary)" />
            {firebaseUser?.uid === id ? 'All Snippets' : 'Public Snippets'}
          </h2>
          {snippets.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No snippets available.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {snippets.map(s => (
                <SnippetPreviewCard key={s.id} snippet={s} isOwner={firebaseUser?.uid === id} />
              ))}
            </div>
          )}
        </div>

      </div>
      </div>
    </div>
  );
}
