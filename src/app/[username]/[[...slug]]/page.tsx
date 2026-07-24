'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSnippetContext } from '@/context/SnippetContext';
import { useAuthStore } from '@/store/auth-store';
import PublicSnippet from '@/components/PublicSnippet';
import BannedUserView from '@/components/BannedUserView';
import styles from './page.module.css';
import SplitPane from '@/components/SplitPane';
import Header from '@/components/Header';

export default function IDEPage() {
  const params = useParams();
  const router = useRouter();
  const { snippets, activeSnippet, setActiveSnippetId, loadedFromCloud } = useSnippetContext();
  const { user, initialized } = useAuthStore();
  const isInitialMount = useRef(true);

  // Sync from URL to state
  useEffect(() => {
    if (!loadedFromCloud) return;
    const slugArray = params.slug as string[] | undefined;
    const currentSlug = slugArray ? slugArray[0] : null;

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
      const slugArray = params.slug as string[] | undefined;
      const currentSlug = slugArray ? slugArray[0] : null;
      
      if (currentSlug !== targetSlug) {
        window.history.pushState(null, '', `/${params.username}/${targetSlug}`);
      }
    }
  }, [activeSnippet?.id, activeSnippet?.slug, loadedFromCloud]);
  const targetUsername = params.username as string;
  const slugArray = params.slug as string[] | undefined;
  const targetSlug = slugArray ? slugArray[0] : undefined;

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
    <div className={styles.container}>
      <Header />
      <div className={styles.editorArea}>
        <SplitPane />
      </div>
    </div>
  );
}
