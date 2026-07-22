'use client';

import { useEffect, useState } from 'react';
import { getStats } from '@/lib/firebase-db';

interface Stats {
  totalUsers: number;
  totalSnippets: number;
  reportedSnippets: number;
  newUsersThisMonth: number;
  snippetsCreatedToday: number;
  bannedUsers: number;
  unreadNotifications: number;
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

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>;
  if (!stats) return <p style={{ color: 'var(--error)' }}>Failed to load stats</p>;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers },
    { label: 'Total Snippets', value: stats.totalSnippets },
    { label: 'Reported Snippets', value: stats.reportedSnippets, warn: stats.reportedSnippets > 0 },
    { label: 'New Users (Month)', value: stats.newUsersThisMonth },
    { label: 'Unread Notifications', value: stats.unreadNotifications, warn: stats.unreadNotifications > 0 },
    { label: 'Banned Users', value: stats.bannedUsers, warn: stats.bannedUsers > 0 },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {cards.map((card) => (
          <div key={card.label} style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)', padding: '1.25rem',
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: card.warn ? 'var(--error)' : 'var(--accent-primary)' }}>{card.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
