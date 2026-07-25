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
  const prevSlugRef = useRef<string | undefined>(undefined);
  const targetUsername = params.username as string;

  // Sync from URL to state — only runs when the URL slug changes, not on every snippets update
  useEffect(() => {
    if (!loadedFromCloud) return;
    const currentSlug = params.slug as string | undefined;

    // If the slug hasn't changed since last time we processed it, skip
    if (currentSlug === prevSlugRef.current) return;
    prevSlugRef.current = currentSlug;

    if (currentSlug) {
      const found = snippets.find(s => s.slug === currentSlug || s.id === currentSlug);
      if (found) {
        if (found.id !== activeSnippet?.id) {
          setActiveSnippetId(found.id);
        }
      } else if (user && targetUsername === user.username) {
        // Snippet not found in OUR snippets and we are viewing OUR profile.
        // Redirect to empty state only if snippets have loaded and it's genuinely missing.
        if (snippets.length > 0) {
          router.replace(`/${params.username}/snippets`);
        }
      }
    } else if (snippets.length > 0 && !activeSnippet) {
      setActiveSnippetId(snippets[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug, loadedFromCloud]);

  // Sync from state to URL — pushes when active snippet changes
  useEffect(() => {
    if (!loadedFromCloud || !params.username) return;

    if (activeSnippet) {
      const targetSlug = activeSnippet.slug || activeSnippet.id;
      const currentSlug = params.slug as string | undefined;

      if (currentSlug !== targetSlug) {
        // Update the ref so the URL→state effect won't re-trigger
        prevSlugRef.current = targetSlug;
        router.replace(`/${params.username}/snippets/${targetSlug}`);
      }
    } else if (snippets.length === 0 && params.slug) {
      router.replace(`/${params.username}/snippets`);
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
