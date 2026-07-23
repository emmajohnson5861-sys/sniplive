'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { getUsers, updateUser, deleteUser, FirestoreUser } from '@/lib/firebase-db';
import { Search, Ban, CheckCircle, Shield, User, Trash2, Crown, AlertTriangle } from 'lucide-react';

export default function AdminUsers() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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
    if (u.role === 'ADMIN') {
      if (!confirm(`Ban admin ${u.email}? They will lose admin access.`)) return;
      await updateUser(u.id, { isBanned: !u.isBanned, role: 'USER' } as any);
    } else {
      await updateUser(u.id, { isBanned: !u.isBanned } as any);
    }
    fetchUsers();
  };

  const handleRoleChange = async (u: FirestoreUser, newRole: 'SUBSCRIBER' | 'EDITOR' | 'ADMIN') => {
    if (!confirm(`Change ${u.email}'s role to ${newRole}?`)) return;
    await updateUser(u.id, { role: newRole } as any);
    fetchUsers();
  };

  const handleDelete = async (id: string) => {
    const u = users.find(x => x.id === id);
    if (!u) return;
    if (u.role === 'ADMIN' && !confirm(`Delete admin ${u.email}? This will also delete all their snippets.`)) return;
    if (u.role !== 'ADMIN' && !confirm(`Delete user ${u.email} and all their snippets?`)) return;
    await deleteUser(id);
    setConfirmDelete(null);
    fetchUsers();
  };

  const admins = users.filter(u => u.role === 'ADMIN');
  const regularUsers = users.filter(u => u.role === 'USER');
  
  const mainAdmin = admins.reduce((oldest, current) => {
    if (!oldest || !oldest.createdAt) return current;
    if (!current || !current.createdAt) return oldest;
    return current.createdAt.seconds < oldest.createdAt.seconds ? current : oldest;
  }, admins[0]);
  const mainAdminId = mainAdmin?.id;

  const canEditUser = (u: FirestoreUser) => {
    if (currentUser?.role === 'EDITOR') return false;
    if (u.id === mainAdminId) return false;
    if (u.id === currentUser?.id) return false;
    return true;
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>User Management</h1>

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

      {admins.length > 0 && (
        <div style={{marginBottom: '2rem'}}>
          <h2 style={{fontSize:'0.9rem', fontWeight:600, color:'var(--accent-primary)', marginBottom:'0.75rem', display:'flex', alignItems:'center', gap:'0.5rem'}}>
            <Crown size={16} /> Administrators ({admins.length})
          </h2>
          {admins.map(u => (
            <div key={u.id} style={{
              display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem 1rem',
              background:'var(--bg-secondary)', border:'1px solid var(--border-color)',
              borderRadius:'var(--radius-md)', marginBottom:'0.5rem',
            }}>
              {u.avatarUrl ? <img src={u.avatarUrl} alt="" style={{width:32, height:32, borderRadius:'50%'}} /> : <User size={32} style={{color:'var(--text-secondary)'}} />}
              <div style={{flex:1}}>
                <div style={{fontWeight:600, color:'var(--text-primary)', fontSize:'0.9rem'}}>{u.name || 'Unnamed'}</div>
                <div style={{color:'var(--text-secondary)', fontSize:'0.8rem'}}>{u.email}</div>
              </div>
              {canEditUser(u) && (
                <div style={{display:'flex', gap:'0.25rem', alignItems: 'center'}}>
                  <select 
                    value={u.role} 
                    onChange={(e) => handleRoleChange(u, e.target.value as any)}
                    style={{
                      padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none'
                    }}
                  >
                    <option value="SUBSCRIBER">Subscriber</option>
                    <option value="EDITOR">Editor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <button onClick={() => handleDelete(u.id)} title="Delete admin" style={{
                    padding:'0.35rem 0.6rem', borderRadius:'var(--radius-sm)', border:'1px solid var(--error)',
                    background:'transparent', color:'var(--error)', cursor:'pointer',
                  }}><Trash2 size={14} /></button>
                </div>
              )}
              {currentUser?.id === u.id && u.id !== mainAdminId && (
                <span style={{fontSize:'0.8rem', color:'var(--accent-primary)', fontWeight:500}}>You</span>
              )}
              {u.id === mainAdminId && (
                <span style={{fontSize:'0.8rem', color:'var(--accent-primary)', fontWeight:500}}>Main Admin</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div>
        <h2 style={{fontSize:'0.9rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.75rem'}}>
          All Users ({total})
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>User</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Role</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Snippets</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No users found</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {u.avatarUrl ? <img src={u.avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} /> : <User size={28} style={{ color: 'var(--text-secondary)' }} />}
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.name || 'Unnamed'}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: u.role === 'ADMIN' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: u.role === 'ADMIN' ? 600 : 400 }}>
                    {u.role === 'ADMIN' ? <><Crown size={12} style={{marginRight:'0.25rem'}} /> Admin</> : u.role === 'EDITOR' ? 'Editor' : 'Subscriber'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{u.snippetCount}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: u.isBanned ? 'var(--error)' : 'var(--success)', fontSize: '0.8rem' }}>
                      {u.isBanned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {canEditUser(u) && (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <select 
                          value={u.role} 
                          onChange={(e) => handleRoleChange(u, e.target.value as any)}
                          style={{
                            padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none'
                          }}
                        >
                          <option value="SUBSCRIBER">Subscriber</option>
                          <option value="EDITOR">Editor</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <button onClick={() => toggleBan(u)} title={u.isBanned ? 'Unban' : 'Ban'} style={{
                          padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                          background: 'transparent', color: u.isBanned ? 'var(--success)' : 'var(--error)', cursor: 'pointer',
                        }}>{u.isBanned ? <CheckCircle size={14} /> : <Ban size={14} />}</button>
                        <button onClick={() => handleDelete(u.id)} title="Delete user" style={{
                          padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--error)',
                          background: 'transparent', color: 'var(--error)', cursor: 'pointer',
                        }}><Trash2 size={14} /></button>
                      </div>
                    )}
                    {currentUser?.id === u.id && u.id !== mainAdminId && (
                      <span style={{fontSize:'0.8rem', color:'var(--text-secondary)'}}>You</span>
                    )}
                    {u.id === mainAdminId && (
                      <span style={{fontSize:'0.8rem', color:'var(--accent-primary)', fontWeight:500}}>Main Admin</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
