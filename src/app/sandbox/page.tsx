'use client';

import { useEffect, useRef } from 'react';
import { useSnippetContext } from '@/context/SnippetContext';
import styles from './page.module.css';
import SplitPane from '@/components/SplitPane';
import Header from '@/components/Header';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';

export default function SandboxPage() {
  const { snippets, activeSnippet, setActiveSnippetId, loadedFromCloud } = useSnippetContext();
  const { user, firebaseUser, initialized } = useAuthStore();
  const router = useRouter();

  // If user signs in while in sandbox, redirect to their dashboard
  useEffect(() => {
    if (initialized && firebaseUser && user?.username) {
      router.replace(`/${user.username}`);
    }
  }, [initialized, firebaseUser, user?.username, router]);

  // Set default if none selected
  useEffect(() => {
    if (loadedFromCloud && snippets.length > 0 && !activeSnippet) {
      setActiveSnippetId(snippets[0].id);
    }
  }, [loadedFromCloud, snippets, activeSnippet, setActiveSnippetId]);

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.editorArea}>
        <SplitPane />
      </div>
    </div>
  );
}
