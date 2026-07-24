import Sidebar from '@/components/Sidebar';
import styles from './layout.module.css';
import { SnippetProvider } from '@/context/SnippetContext';
import { SidebarProvider } from '@/context/SidebarContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SnippetProvider>
      <SidebarProvider>
        <div className={styles.appLayout}>
          <Sidebar />
          <div className={styles.mainWrapper}>
            {children}
          </div>
        </div>
      </SidebarProvider>
    </SnippetProvider>
  );
}
