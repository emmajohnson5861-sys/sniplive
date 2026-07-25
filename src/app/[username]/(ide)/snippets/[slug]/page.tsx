'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSnippetContext } from '@/context/SnippetContext';
import { useAuthStore } from '@/store/auth-store';
import { getPublicUserSnippets, getUserByUsernameOrId } from '@/lib/firebase-db';
import BannedUserView from '@/components/BannedUserView';
import styles from './page.module.css';
import SplitPane from '@/components/SplitPane';

export default function IDEPage() {
  const params = useParams();
  const router = useRouter();
  const { snippets, activeSnippet, setActiveSnippetId, setExternalSnippet, loadedFromCloud } = useSnippetContext();
  const { user, initialized } = useAuthStore();
  const isInitialMount = useRef(true);
  const targetUsername = params.username as string;

  // Sync from URL to state
  useEffect(() => {
    if (!loadedFromCloud) return;
    const currentSlug = params.slug as string | undefined;

    if (currentSlug) {
      // Find snippet by slug or fallback to id
      const found = snippets.find(s => s.slug === currentSlug || s.id === currentSlug);
      if (found) {
        if (found.id !== activeSnippet?.id) {
          setActiveSnippetId(found.id);
        }
      } else if (user && targetUsername === user.username) {
        // Snippet not found in OUR snippets, and we are viewing OUR profile.
        // It was either deleted or the slug is invalid.
        // Redirect to empty state.
        router.replace(`/${params.username}/snippets`);
      }
    } else if (snippets.length > 0 && !activeSnippet) {
      // No slug in URL, set default
      setActiveSnippetId(snippets[0].id);
    }
  }, [params.slug, loadedFromCloud, snippets, user, targetUsername, params.username, router]);

  // Sync from state to URL
  useEffect(() => {
    if (!loadedFromCloud || !params.username) return;

    if (activeSnippet) {
      const targetSlug = activeSnippet.slug || activeSnippet.id;
      const currentSlug = params.slug as string | undefined;
      
      if (currentSlug !== targetSlug) {
        router.replace(`/${params.username}/snippets/${targetSlug}`);
      }
    } else if (snippets.length === 0) {
      // If there are no snippets (e.g. last one was deleted), go to empty state
      if (params.slug) {
        router.replace(`/${params.username}/snippets`);
      }
    }
  }, [activeSnippet?.id, activeSnippet?.slug, loadedFromCloud, snippets.length, params.slug, params.username, router]);
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
