'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSnippetContext } from '@/context/SnippetContext';
import { useAuthStore } from '@/store/auth-store';
import SplitPane from '@/components/SplitPane';
import styles from './[slug]/page.module.css'; // Reuse styles from the snippet page

export default function SnippetsBasePage() {
  const { setActiveSnippetId, activeSnippetId, snippets } = useSnippetContext();
  const { initialized } = useAuthStore();
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    // When landing on the bare /[username]/snippets route, clear the active snippet
    // to show the empty state design.
    setActiveSnippetId(null);
  }, [setActiveSnippetId]); 

  useEffect(() => {
    if (activeSnippetId) {
      const activeSnippet = snippets.find(s => s.id === activeSnippetId);
      if (activeSnippet) {
        const slug = activeSnippet.slug || activeSnippet.id;
        router.push(`/${params.username}/snippets/${slug}`);
      }
    }
  }, [activeSnippetId, snippets, router, params.username]);

  if (!initialized) return null;

  return (
    <div className={styles.editorArea}>
      <SplitPane />
    </div>
  );
}
