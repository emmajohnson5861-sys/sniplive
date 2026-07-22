'use client';

import styles from './page.module.css';
import SplitPane from '@/components/SplitPane';
import Header from '@/components/Header';

export default function Home() {
  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.editorArea}>
        <SplitPane />
      </div>
    </div>
  );
}
