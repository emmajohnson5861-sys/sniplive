'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { getUsers, updateUser, deleteUser, FirestoreUser } from '@/lib/firebase-db';
import { Search, Ban, CheckCircle, Shield, User } from 'lucide-react';

export default function AdminUsers() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await getUsers({ search, page: 1, limitSize: 50 });
      setUsers(result.users);
      setTotal(result.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const toggleBan = async (u: FirestoreUser) => {
    await updateUser(u.id, { isBanned: !u.isBanned });
    fetchUsers();
  };

  const toggleRole = async (u: FirestoreUser) => {
    const newRole = u.role === 'ADMIN' ? 'USER' : 'ADMIN';
    await updateUser(u.id, { role: newRole });
    fetchUsers();
  };

  const handleDelete = async (u: FirestoreUser) => {
    if (!confirm(`Delete user ${u.email} and all their snippets?`)) return;
    await deleteUser(u.id);
    fetchUsers();
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Users</h1>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', position: 'relative', maxWidth: 400 }}>
        <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input
          type="text" placeholder="Search by name or email..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '0.5rem 0.5rem 0.5rem 2rem', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)',
            fontSize: '0.875rem', outline: 'none',
          }}
        />
      </form>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>User</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Role</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Snippets</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Last Active</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                    ) : (
                      <User size={28} style={{ color: 'var(--text-secondary)' }} />
                    )}
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.name || 'Unnamed'}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '0.75rem 1rem', color: u.role === 'ADMIN' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: u.role === 'ADMIN' ? 600 : 400 }}>{u.role}</td>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{u.snippetCount}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: u.isBanned ? 'var(--error)' : 'var(--success)', fontSize: '0.8rem' }}>
                    {u.isBanned ? 'Banned' : 'Active'}
                  </span>
                </td>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  {u.lastActiveAt?.toDate().toLocaleDateString() || '-'}
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {currentUser?.id !== u.id && (
                      <>
                        <button onClick={() => toggleRole(u)} title={u.role === 'ADMIN' ? 'Demote to user' : 'Promote to admin'} style={{
                          padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                          background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem',
                        }}>
                          <Shield size={14} />
                        </button>
                        <button onClick={() => toggleBan(u)} title={u.isBanned ? 'Unban' : 'Ban'} style={{
                          padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                          background: 'transparent', color: u.isBanned ? 'var(--success)' : 'var(--error)', cursor: 'pointer', fontSize: '0.8rem',
                        }}>
                          {u.isBanned ? <CheckCircle size={14} /> : <Ban size={14} />}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
