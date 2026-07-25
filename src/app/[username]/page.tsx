'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSnippetContext } from '@/context/SnippetContext';
import { useAuthStore } from '@/store/auth-store';
import SplitPane from '@/components/SplitPane';
import styles from './snippets/[slug]/page.module.css'; // Reuse styles from the snippet page

export default function UserDashboard() {
  const { setActiveSnippetId } = useSnippetContext();
  const { initialized } = useAuthStore();

  useEffect(() => {
    // When landing on the bare /[username] route, clear the active snippet
    // to show the empty state design.
    setActiveSnippetId(null);
  }, [setActiveSnippetId]);

  if (!initialized) return null;

  return (
    <div className={styles.editorArea}>
      <SplitPane />
    </div>
  );
}
