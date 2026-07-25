'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getUserByUsernameOrId, getPublicUserSnippets, getUserSnippets, FirestoreUser, FirestoreSnippet, updateUser, toggleFavoriteSnippet } from '@/lib/firebase-db';
import { useAuthStore, initAuthListener } from '@/store/auth-store';
import { useToast } from '@/components/Toast';
import BannedUserView from '@/components/BannedUserView';
import styles from './ProfileClient.module.css';

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<FirestoreUser | null>(null);
  const { firebaseUser, user: authUser, initialized } = useAuthStore();
  const [snippets, setSnippets] = useState<FirestoreSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Edit State
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    initAuthListener();
  }, []);

  useEffect(() => {
    if (!username || !initialized) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const u = await getUserByUsernameOrId(username as string);
        if (u) {
          setUserProfile(u);
          setEditName(u.name || '');
          setEditUsername(u.username || '');
          setEditBio(u.bio || '');
          const isOwner = authUser?.id === u.id;
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
  }, [username, authUser, initialized]);

  const isOwner = authUser?.id === userProfile?.id;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser || !userProfile || !isOwner) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Image must be less than 2MB.", 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        await updateUser(userProfile.id, { avatarUrl: base64 });
        setUserProfile({ ...userProfile, avatarUrl: base64 });
      } catch (err) {
        console.error('Avatar upload error:', err);
        showToast('Failed to upload avatar.', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!authUser || !userProfile || !isOwner) return;
    setIsSaving(true);
    try {
      await updateUser(userProfile.id, { name: editName, username: editUsername, bio: editBio });
      setUserProfile({ ...userProfile, name: editName, username: editUsername, bio: editBio });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Save error:', err);
      showToast('Failed to save profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, snippetId: string) => {
    e.stopPropagation();
    if (!authUser) return;
    const isFavorited = authUser.favoriteSnippets?.includes(snippetId);
    
    // Optimistic UI update
    const newFavorites = isFavorited 
      ? (authUser.favoriteSnippets || []).filter(id => id !== snippetId)
      : [...(authUser.favoriteSnippets || []), snippetId];
    
    useAuthStore.getState().updateLocalUser({ favoriteSnippets: newFavorites });

    try {
      await toggleFavoriteSnippet(authUser.id, snippetId, !isFavorited);
    } catch (err) {
      console.error(err);
      // Revert on error
      useAuthStore.getState().updateLocalUser({ favoriteSnippets: authUser.favoriteSnippets });
    }
  };

  if (loading || !initialized) {
    return (
      <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className={styles.container} style={{ textAlign: 'center', paddingTop: '10vh' }}>
        <h2 className={styles.headerTitle}>User not found</h2>
        <p className={styles.headerDesc}>The user you are looking for does not exist or has been removed.</p>
      </div>
    );
  }

  if (userProfile.isBanned) {
    return <BannedUserView />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <button 
            onClick={() => router.back()} 
            title="Go back"
            style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className={styles.headerTitle} style={{ margin: 0 }}>{isOwner ? 'Profile Settings' : `${userProfile.name || userProfile.username}'s Profile`}</h2>
        </div>
        <p className={styles.headerDesc}>{isOwner ? 'Manage your public profile and developer identity.' : 'View developer identity and code snippets.'}</p>
      </header>

      <div className={styles.profileGrid}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatarCircle}>
              {userProfile.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt="Avatar" className={styles.avatarImg} />
              ) : (
                <div className={styles.avatarImg}>
                  {(userProfile.name || userProfile.username || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>
            {isOwner && (
              <>
                <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>photo_camera</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarUpload} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
              </>
            )}
          </div>
          <div className={styles.avatarInfo}>
            <h3 className={styles.avatarName}>{userProfile.name || userProfile.username}</h3>
            <p className={styles.avatarUsername}>@{userProfile.username}</p>
            <p className={styles.avatarRole}>{userProfile.role === 'SUBSCRIBER' ? 'Pro Developer Account' : `${userProfile.role} Account`}</p>
          </div>
        </div>

        {isOwner ? (
          <div className={styles.formSection}>
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>FULL NAME</label>
                <input 
                  className={styles.input} 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>USERNAME</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.prefix}>@</span>
                  <input 
                    className={`${styles.input} ${styles.withPrefix}`} 
                    type="text" 
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>BIO</label>
              <textarea 
                className={styles.textarea} 
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
              />
            </div>
            <div className={styles.formActions}>
              <button 
                className={`${styles.saveBtn} ${saveSuccess ? styles.saveBtnSuccess : ''}`} 
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : saveSuccess ? 'Changes Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.formSection} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
             <h3 className={styles.avatarName} style={{ marginBottom: '1rem' }}>About {userProfile.name || userProfile.username}</h3>
             <p className={styles.headerDesc}>{userProfile.bio || 'No bio provided yet.'}</p>
          </div>
        )}
      </div>

      <section className={styles.showcaseSection}>
        <div className={styles.showcaseHeader}>
          <div>
            <h2 className={styles.showcaseTitle}>{isOwner ? 'My Snippets' : 'Snippets'}</h2>
            <p className={styles.showcaseDesc}>
              {isOwner ? `You have created ${snippets.length} reusable code blocks.` : `Explore ${snippets.length} reusable code blocks.`}
            </p>
          </div>
          <button className={styles.viewAllBtn}>
            View all <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
          </button>
        </div>

        <div className={styles.snippetGrid}>
          {snippets.map(snippet => {
            const isFavorited = authUser?.favoriteSnippets?.includes(snippet.id);
            const tagLabel = snippet.liveCategory || (snippet.js ? 'JS / Logic' : snippet.css ? 'CSS / Styling' : 'HTML / Structure');
            const iframeSrc = `data:text/html;charset=utf-8,${encodeURIComponent(`
              <html>
                <head><style>body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: transparent; color: white; font-family: sans-serif; } ${snippet.css}</style></head>
                <body>${snippet.html}<script>${snippet.js}</script></body>
              </html>
            `)}`;

            return (
              <div 
                key={snippet.id} 
                className={styles.snippetCard}
                onClick={() => window.location.href = `/${userProfile.username}/snippets/${snippet.slug || snippet.id}`}
              >
                <div className={styles.cardBody}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardTag}>{tagLabel}</span>
                    {authUser && (
                      <button 
                        className={`${styles.iconBtn} ${isFavorited ? styles.active : ''}`}
                        onClick={(e) => handleToggleFavorite(e, snippet.id)}
                        title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: isFavorited ? "'FILL' 1" : "'FILL' 0", color: isFavorited ? 'var(--primary)' : 'inherit' }}>
                          favorite
                        </span>
                      </button>
                    )}
                  </div>
                  <h3 className={styles.cardTitle}>{snippet.title}</h3>
                  <div className={styles.cardPreview} style={{ padding: 0, overflow: 'hidden', background: '#0a0a0a' }}>
                    <iframe 
                      src={iframeSrc}
                      style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                      sandbox="allow-scripts"
                      title={snippet.title}
                    />
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <div className={styles.cardMeta}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                    <span className={styles.cardMetaText}>{snippet.viewCount || 0} views</span>
                  </div>
                  <button className={styles.iconBtn} onClick={(e) => {
                    e.stopPropagation();
                    const url = `${window.location.origin}/s/${snippet.id}-${snippet.slug || snippet.id}`;
                    navigator.clipboard.writeText(url);
                    showToast('Link copied!', 'success');
                  }}>
                    <span className="material-symbols-outlined">share</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.statsSection}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>CONTRIBUTIONS</p>
          <p className={styles.statValueAlt} style={{ fontSize: '32px', fontFamily: 'var(--font-geist)', fontWeight: 600, margin: 0 }}>
            {snippets.length}
          </p>
          <p className={styles.statTrend} style={{ color: 'var(--text-secondary)' }}>
            Total Snippets Created
          </p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>TOTAL VIEWS</p>
          <p className={styles.statValueAlt} style={{ fontSize: '32px', fontFamily: 'var(--font-geist)', fontWeight: 600, margin: 0 }}>
            {snippets.reduce((acc, s) => acc + (s.viewCount || 0), 0)}
          </p>
          <p className={styles.statTrend} style={{ color: 'var(--text-secondary)' }}>
            Across all snippets
          </p>
        </div>
        <div className={styles.planCard}>
          <div>
            <p className={styles.planLabel}>CURRENT PLAN</p>
            <h3 className={styles.planTitle}>{userProfile.role === 'ADMIN' ? 'Admin Tier' : userProfile.role === 'EDITOR' ? 'Editor Tier' : 'Free Tier'}</h3>
            <p className={styles.planDesc}>Since {userProfile.createdAt ? new Date(userProfile.createdAt.toMillis()).toLocaleDateString() : 'Unknown'}</p>
          </div>
          {isOwner && (
            <button className={styles.planBtn}>Manage</button>
          )}
        </div>
      </section>
    </div>
  );
}
