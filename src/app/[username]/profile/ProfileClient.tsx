'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getUserByUsernameOrId, getPublicUserSnippets, getUserSnippets, FirestoreUser, FirestoreSnippet, sendNotification, updateUser } from '@/lib/firebase-db';
import { User, Code2, Globe, Home, AlertTriangle, Edit2, Save, X, Camera } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore, initAuthListener } from '@/store/auth-store';
import SnippetPreviewCard from '@/components/SnippetPreviewCard';
import BannedUserView from '@/components/BannedUserView';
import styles from './ProfileClient.module.css';
import gridStyles from '@/app/components/Components.module.css';

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [userProfile, setUserProfile] = useState<FirestoreUser | null>(null);
  const { firebaseUser, initialized } = useAuthStore();
  const [snippets, setSnippets] = useState<FirestoreSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [unbanRequested, setUnbanRequested] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // For Bento Grid styling logic
  const getLangLabel = (s: FirestoreSnippet) => s.liveCategory || (s.js ? 'JS' : s.css ? 'CSS' : 'HTML');

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

  useEffect(() => {
    if (userProfile) setEditName(userProfile.name || '');
  }, [userProfile]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser || !userProfile) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        await updateUser(userProfile.id, { avatarUrl: base64 });
        setUserProfile({ ...userProfile, avatarUrl: base64 });
      } catch (err) {
        console.error(err);
        alert('Failed to upload avatar.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!firebaseUser || !userProfile) return;
    setIsSaving(true);
    try {
      await updateUser(userProfile.id, { name: editName });
      setUserProfile({ ...userProfile, name: editName });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save profile.');
    }
    setIsSaving(false);
  };

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
            <div 
              className={styles.avatar} 
              style={{ position: 'relative', cursor: isEditing ? 'pointer' : 'default', overflow: 'hidden' }}
              onClick={() => isEditing && fileInputRef.current?.click()}
            >
              {userProfile.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={40} color="var(--text-secondary)" />
              )}
              {isEditing && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Camera size={24} />
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" style={{ display: 'none' }} />
            </div>
            
            <div className={styles.info} style={{ flex: 1 }}>
              {isEditing ? (
                <input 
                  type="text" 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  style={{ fontSize: '1.5rem', fontWeight: 700, background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outline: 'none', borderRadius: 'var(--radius-sm)', padding: '0.25rem 0.5rem', width: '100%', maxWidth: '300px' }}
                />
              ) : (
                <h1 className={styles.title}>{userProfile.name || 'Anonymous User'}</h1>
              )}
              <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <Globe size={16} /> {firebaseUser?.uid === userProfile.id ? 'Your Profile' : 'Public Profile'}
              </div>
            </div>

            {firebaseUser?.uid === userProfile.id && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {isEditing ? (
                  <>
                    <button className="btn-primary" onClick={handleSaveProfile} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Save size={16} /> Save
                    </button>
                    <button onClick={() => { setIsEditing(false); setEditName(userProfile.name || ''); }} style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-DEFAULT)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <X size={16} /> Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-DEFAULT)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Edit2 size={16} /> Edit Profile
                  </button>
                )}
              </div>
            )}
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
                  <div className={gridStyles.grid}>
                    {snippets.map((s, idx) => {
                      const isLarge = idx === 0;
                      const isTrending = (s.viewCount || 0) > 100;
                      const snippetUrl = s.ownerUsername
                        ? `/${s.ownerUsername}/snippets/${s.slug || s.id}`
                        : `/${s.ownerId}/snippets/${s.slug || s.id}`;

                      return (
                        <article
                          key={s.id}
                          className={`${gridStyles.card} ${isLarge ? gridStyles.cardLarge : ''}`}
                        >
                          {isTrending && <span className={gridStyles.trendingBadge}>Trending</span>}
                          
                          <div className={gridStyles.cardHeader}>
                            <div className={gridStyles.cardHeaderLeft}>
                              <span className={gridStyles.cardLang}>{getLangLabel(s)}</span>
                              <h2 className={gridStyles.cardTitle}>{s.liveTitle || s.title}</h2>
                            </div>
                            <div className={gridStyles.cardActions}>
                              <Link
                                href={snippetUrl}
                                className={gridStyles.openBtn}
                                title="Open snippet"
                              >
                                <span className="material-symbols-outlined">open_in_new</span>
                              </Link>
                            </div>
                          </div>

                          <div className={gridStyles.cardPreview}>
                            <iframe
                              srcDoc={`
                                <!DOCTYPE html>
                                <html>
                                  <head>
                                    <style>
                                      body { margin: 0; padding: 0; overflow: hidden; background: transparent; transform: scale(0.6); transform-origin: top left; width: 166%; height: 166%; }
                                      ${s.css}
                                    </style>
                                  </head>
                                  <body>
                                    ${s.html}
                                    <script>try { ${s.js} } catch(e){}</script>
                                  </body>
                                </html>
                              `}
                              sandbox="allow-scripts"
                              style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                            />
                          </div>

                          <div className={gridStyles.cardFooter}>
                            <div className={gridStyles.cardAuthor}>
                              {userProfile.avatarUrl ? (
                                <img src={userProfile.avatarUrl} alt="" className={gridStyles.cardAvatarImg} />
                              ) : (
                                <div className={gridStyles.cardAvatarText}>{(userProfile.name || userProfile.username || 'U')[0].toUpperCase()}</div>
                              )}
                              <span>{userProfile.name || userProfile.username}</span>
                            </div>
                            <div className={gridStyles.cardStats}>
                              <div className={gridStyles.stat}><span className="material-symbols-outlined">visibility</span> {s.viewCount || 0}</div>
                              <div className={gridStyles.stat}><span className="material-symbols-outlined">favorite</span> {s.favoriteCount || 0}</div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
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
