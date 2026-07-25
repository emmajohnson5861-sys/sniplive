'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSnippetContext } from '@/context/SnippetContext';
import { useAuthStore } from '@/store/auth-store';
import { getPublicUserSnippets, getUserByUsernameOrId, getSnippetById, getSnippetBySlug } from '@/lib/firebase-db';
import BannedUserView from '@/components/BannedUserView';
import styles from './page.module.css';
import SplitPane from '@/components/SplitPane';

export default function IDEPage() {
  const params = useParams();
  const router = useRouter();
  const { snippets, activeSnippet, setActiveSnippetId, setExternalSnippet, loadedFromCloud } = useSnippetContext();
  const { user, initialized } = useAuthStore();
  const isInitialMount = useRef(true);

  // Sync from URL to state
  useEffect(() => {
    if (!loadedFromCloud) return;
    const currentSlug = params.slug as string | undefined;

    if (currentSlug) {
      // Find snippet by slug or fallback to id
      const found = snippets.find(s => s.slug === currentSlug || s.id === currentSlug);
      if (found && found.id !== activeSnippet?.id) {
        setActiveSnippetId(found.id);
      }
    } else if (snippets.length > 0 && !activeSnippet) {
      // No slug in URL, set default
      setActiveSnippetId(snippets[0].id);
    }
  }, [params.slug, loadedFromCloud, snippets]);

  // Sync from state to URL
  useEffect(() => {
    if (activeSnippet && loadedFromCloud && params.username) {
      const targetSlug = activeSnippet.slug || activeSnippet.id;
      const currentSlug = params.slug as string | undefined;
      
      if (currentSlug !== targetSlug) {
        window.history.pushState(null, '', `/${params.username}/snippets/${targetSlug}`);
      }
    }
  }, [activeSnippet?.id, activeSnippet?.slug, loadedFromCloud]);
  const targetUsername = params.username as string;
  const targetSlug = params.slug as string | undefined;

  useEffect(() => {
    if (!initialized || !loadedFromCloud) return;

    const currentSlug = params.slug as string | undefined;
    const isExternalUser = targetUsername !== 'sandbox' && (!user || user.username !== targetUsername);

    if (isExternalUser && currentSlug) {
      // Fetch external snippet
      const fetchExternal = async () => {
        try {
          const u = await getUserByUsernameOrId(targetUsername);
          if (!u) return;
          const extSnippets = await getPublicUserSnippets(u.id);
          const found = extSnippets.find(s => s.slug === currentSlug || s.id === currentSlug);
          if (found) {
            setExternalSnippet({
              id: found.id, slug: found.slug, title: found.title, html: found.html, css: found.css, js: found.js,
              createdAt: found.createdAt?.toDate()?.getTime() || Date.now(),
              updatedAt: found.updatedAt?.toDate()?.getTime() || Date.now(),
              visibility: found.visibility, isLive: found.isLive, allowForking: found.allowForking, forkedFromId: found.forkedFromId,
              ownerId: found.ownerId, collaborators: found.collaborators, pendingRequests: found.pendingRequests,
            });
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchExternal();
    } else {
      setExternalSnippet(null);
    }
  }, [targetUsername, params.slug, initialized, loadedFromCloud, user]);

  if (!initialized) return null;

  if (user?.isBanned) {
    return <BannedUserView />;
  }

  return (
    <div className={styles.editorArea}>
      <SplitPane />
    </div>
  );
}
