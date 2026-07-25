import Sidebar from '@/components/Sidebar';
import styles from './layout.module.css';
import { SnippetProvider } from '@/context/SnippetContext';
import { SidebarProvider } from '@/context/SidebarContext';
import Header from '@/components/Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SnippetProvider>
      <SidebarProvider>
        <div className={styles.appContainer}>
          <Header />
          <div className={styles.bodyWrapper}>
            <Sidebar />
            <main className={styles.mainContent}>
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </SnippetProvider>
  );
}
