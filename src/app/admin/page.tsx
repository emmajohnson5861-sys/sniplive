'use client';

import { useEffect, useState } from 'react';
import { getStats } from '@/lib/firebase-db';
import styles from './AdminPage.module.css';
import Link from 'next/link';

interface Stats {
  totalUsers: number;
  totalSnippets: number;
  reportedSnippets: number;
  newUsersThisMonth: number;
  snippetsCreatedToday: number;
  bannedUsers: number;
  unreadNotifications: number;
  totalViews: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading overview...</p>;
  if (!stats) return <p style={{ color: 'var(--error)' }}>Failed to load stats</p>;

  // Convert raw numbers to shortened format if needed (e.g. 1.2M) - simplified for now
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <div>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h2>Overview</h2>
          <p>Platform health and operational metrics for SnipLive.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnSecondary}>Export Report</button>
          <button className="btn-primary">Generate Insights</button>
        </div>
      </header>

      {/* Bento Stats Grid */}
      <section className={styles.bentoGrid}>
        
        {/* Total Users */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={`material-symbols-outlined ${styles.statIcon}`}>person</span>
            <span className={styles.statTrend}>+12%</span>
          </div>
          <h3 className={styles.statLabel}>Total Users</h3>
          <p className={styles.statValue}>{formatNumber(stats.totalUsers)}</p>
        </div>
        
        {/* Total Snippets */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={`material-symbols-outlined ${styles.statIcon}`}>code</span>
            <span className={styles.statTrend}>+24%</span>
          </div>
          <h3 className={styles.statLabel}>Total Snippets</h3>
          <p className={styles.statValue}>{formatNumber(stats.totalSnippets)}</p>
        </div>
        
        {/* Reported Snippets (Flagged) */}
        <div className={stats.reportedSnippets > 0 ? styles.statCardDanger : styles.statCard}>
          <div className={styles.statHeader}>
            <span className={`material-symbols-outlined ${stats.reportedSnippets > 0 ? styles.statIconDanger : styles.statIcon}`}>report</span>
            {stats.reportedSnippets > 0 && <span className={styles.statTrendDanger}>Urgent</span>}
          </div>
          <h3 className={stats.reportedSnippets > 0 ? styles.statLabelDanger : styles.statLabel}>Reported Snippets</h3>
          <p className={stats.reportedSnippets > 0 ? styles.statValueDanger : styles.statValue}>{stats.reportedSnippets}</p>
        </div>
        
        {/* New Users This Month */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={`material-symbols-outlined ${styles.statIcon}`}>person_add</span>
            <span className={styles.statTrend} style={{color: 'var(--text-secondary)'}}>Active</span>
          </div>
          <h3 className={styles.statLabel}>New Users (MTD)</h3>
          <p className={styles.statValue}>{formatNumber(stats.newUsersThisMonth)}</p>
        </div>
        
        {/* Complex Layout Element: Notification Stream */}
        <div className={styles.feedCard}>
          <div className={styles.feedHeader}>
            <h3>Critical Moderation Feed</h3>
            <Link href="/admin/moderation" className={styles.feedLink}>View All</Link>
          </div>
          
          <div className={styles.feedList}>
            {/* Hardcoded mock items for visual structure as per design */}
            <div className={styles.feedItem}>
              <div className={styles.feedIconError}>
                <span className="material-symbols-outlined">security</span>
              </div>
              <div className={styles.feedContent}>
                <div className={styles.feedTitleRow}>
                  <span className={styles.feedTitle}>Potential XSS payload detected</span>
                  <span className={styles.feedTime}>2m ago</span>
                </div>
                <p className={styles.feedDesc}>Snippet <span style={{color: 'var(--primary)', fontFamily: 'var(--font-mono)'}}>#88219</span> flagged by automated analysis.</p>
              </div>
              <button className={styles.feedAction}>Investigate</button>
            </div>
            
            <div className={styles.feedItem}>
              <div className={styles.feedIconPrimary}>
                <span className="material-symbols-outlined">person_alert</span>
              </div>
              <div className={styles.feedContent}>
                <div className={styles.feedTitleRow}>
                  <span className={styles.feedTitle}>New appeal submitted</span>
                  <span className={styles.feedTime}>45m ago</span>
                </div>
                <p className={styles.feedDesc}>User <span style={{fontStyle: 'italic'}}>dev_ninja_99</span> requesting ban review.</p>
              </div>
              <button className={styles.feedAction}>Review</button>
            </div>
            
            <div className={styles.feedItem}>
              <div className={styles.feedIconSecondary}>
                <span className="material-symbols-outlined">policy</span>
              </div>
              <div className={styles.feedContent}>
                <div className={styles.feedTitleRow}>
                  <span className={styles.feedTitle}>Policy update applied</span>
                  <span className={styles.feedTime}>2h ago</span>
                </div>
                <p className={styles.feedDesc}>V3 moderation filters deployed successfully.</p>
              </div>
              <button className={styles.feedAction}>Logs</button>
            </div>
          </div>
        </div>
        
        {/* Banned Users & System Load (Right Column) */}
        <div className={styles.rightCol}>
          <div className={styles.bannedCard}>
            <div className={styles.bannedBgIcon}>
              <span className="material-symbols-outlined">block</span>
            </div>
            <h3 className={styles.statLabelDanger} style={{marginBottom: '0.5rem'}}>Banned Users</h3>
            <p className={styles.statValueDanger} style={{marginBottom: '1rem'}}>{stats.bannedUsers}</p>
            <div className={styles.bannedList}>
              <div className={styles.bannedRow}>
                <span>Last 24h</span>
                <span style={{color: 'var(--error)'}}>+14</span>
              </div>
              <div className={styles.bannedRow}>
                <span>Appeals Pending</span>
                <span style={{color: 'var(--primary)'}}>28</span>
              </div>
            </div>
          </div>
          
          <div className={styles.systemCard}>
            <h3>System Load</h3>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{width: '65%'}}></div>
            </div>
            <p style={{fontSize: '11px', color: 'var(--text-secondary)'}}>DB Cluster: 65% capacity</p>
          </div>
        </div>
      </section>

      {/* Data Visualization Area */}
      <section className={styles.heatmapSection}>
        <div className={styles.heatmapHeader}>
          <h3>Engagement Heatmap</h3>
          <select className={styles.heatmapSelect}>
            <option>Last 30 Days</option>
            <option>Last Quarter</option>
          </select>
        </div>
        
        {/* Mock Chart Visualization */}
        <div className={styles.chart}>
          {[40, 55, 45, 70, 85, 60, 75, 95, 80, 70, 90, 100, 85, 70, 60].map((height, i) => (
            <div key={i} className={styles.chartBar} style={{ height: `${height}%` }}></div>
          ))}
        </div>
        <div className={styles.chartLabels}>
          <span>Oct 01</span>
          <span>Oct 15</span>
          <span>Oct 31</span>
        </div>
      </section>

    </div>
  );
}
