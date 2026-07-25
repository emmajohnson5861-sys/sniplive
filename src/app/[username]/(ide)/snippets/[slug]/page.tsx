'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSnippetContext } from '@/context/SnippetContext';
import { useAuthStore } from '@/store/auth-store';
import PublicSnippet from '@/components/PublicSnippet';
import BannedUserView from '@/components/BannedUserView';
import styles from './page.module.css';
import SplitPane from '@/components/SplitPane';

export default function IDEPage() {
  const params = useParams();
  const router = useRouter();
  const { snippets, activeSnippet, setActiveSnippetId, loadedFromCloud } = useSnippetContext();
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

  // Wait for auth to initialize before making routing decisions
  if (!initialized) return null;

  if (user?.isBanned) {
    return <BannedUserView />;
  }

  if (user && user.username !== targetUsername) {
    return <PublicSnippet username={targetUsername} snippetSlug={targetSlug} />;
  }

  if (!user && targetUsername !== 'sandbox') {
     return <PublicSnippet username={targetUsername} snippetSlug={targetSlug} />;
  }

  return (
    <div className={styles.editorArea}>
      <SplitPane />
    </div>
  );
}
