import Sidebar from '@/components/Sidebar';
import styles from '../layout.module.css';
import { SnippetProvider } from '@/context/SnippetContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SnippetProvider>
      <div className={styles.appLayout}>
        <Sidebar />
        <div className={styles.mainWrapper}>
          {children}
        </div>
      </div>
    </SnippetProvider>
  );
}
