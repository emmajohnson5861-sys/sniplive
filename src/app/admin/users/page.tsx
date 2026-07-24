'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { getUsers, updateUser, deleteUser, FirestoreUser } from '@/lib/firebase-db';
import styles from './AdminUsers.module.css';

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
    if (u.role === 'ADMIN') {
      if (!confirm(`Ban admin ${u.email}? They will lose admin access.`)) return;
      await updateUser(u.id, { isBanned: !u.isBanned, role: 'SUBSCRIBER' } as any);
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
    fetchUsers();
  };

  const admins = users.filter(u => u.role === 'ADMIN');
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
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1>User Management</h1>
          <nav className={styles.breadcrumb}>
            <span style={{ cursor: 'pointer' }} className={styles.active}>ADMIN</span>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_right</span>
            <span className={styles.active}>USERS</span>
          </nav>
        </div>
        
        {/* Search and Filter Bar */}
        <div className={styles.actions}>
          <form onSubmit={handleSearch} className={styles.searchBox}>
            <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
            <input 
              type="text" 
              className={styles.searchInput}
              placeholder="Search by name, email or ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <button className={styles.inviteBtn}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
            INVITE ADMIN
          </button>
        </div>
      </header>

      {/* Administrators Highlights (Bento-like Section) */}
      <section className={styles.adminsSection}>
        <div className={styles.topAdminsCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardSubtitle}>Top Active Administrators</h3>
              <p className={styles.cardTitle}>Session Efficiency</p>
            </div>
            <span className={`material-symbols-outlined ${styles.cardIcon}`}>verified_user</span>
          </div>
          <div className={styles.adminList}>
            <div className={styles.avatarCluster}>
              {admins.slice(0, 3).map((admin, idx) => (
                <div key={admin.id} className={styles.avatarItem} style={{ zIndex: 3 - idx }}>
                  {admin.avatarUrl ? (
                    <img src={admin.avatarUrl} alt="" className={styles.avatarImg} />
                  ) : (
                    <div className={styles.avatarMore}>{admin.name?.charAt(0) || 'A'}</div>
                  )}
                </div>
              ))}
              {admins.length > 3 && (
                <div className={styles.avatarItem} style={{ zIndex: 0 }}>
                  <div className={styles.avatarMore}>+{admins.length - 3}</div>
                </div>
              )}
            </div>
            <div className={styles.adminCountInfo}>
              <div className={styles.adminCountTitle}>{admins.length} Administrators</div>
              <div className={styles.activeAdminStatus}>
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>trending_up</span>
                <span>{admins.length > 0 ? 'Active now' : 'No active'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.queueCard}>
          <div style={{ zIndex: 10 }}>
            <h3 className={styles.cardSubtitle}>System Health</h3>
            <p className={styles.cardTitle}>Moderation Queue</p>
            <div className={styles.queueValue}>
              <span className={styles.queueNumber}>08</span>
              <span className={styles.queueLabel}>pending reports</span>
            </div>
          </div>
          <div className={styles.queueBgIcon}>
            <span className="material-symbols-outlined">security</span>
          </div>
        </div>
      </section>

      {/* User Data Table Container */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitle}>
            <h2>All Platform Users</h2>
            <span className={styles.totalBadge}>{total} TOTAL</span>
          </div>
          <div className={styles.tableActions}>
            <button className={styles.iconBtn}>
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button className={styles.iconBtn} onClick={fetchUsers}>
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </div>
        </div>
        
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User Profile</th>
                <th>Access Role</th>
                <th>Status</th>
                <th>Snippets</th>
                <th style={{ textAlign: 'right' }}>Administrative Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No users found</td>
                </tr>
              ) : users.map((u) => {
                const isMainAdmin = u.id === mainAdminId;
                const isSelf = currentUser?.id === u.id;
                
                return (
                  <tr key={u.id} className={u.isBanned ? styles.bannedRow : ''}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.userAvatar} style={{ opacity: u.isBanned ? 0.5 : 1, filter: u.isBanned ? 'grayscale(1)' : 'none' }}>
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt="" />
                          ) : (
                            <span>{u.name?.charAt(0).toUpperCase() || 'U'}</span>
                          )}
                        </div>
                        <div className={styles.userInfo}>
                          <span className={styles.userName}>
                            {u.name || 'Unnamed'} 
                            {isMainAdmin && <span style={{ color: 'var(--primary)', fontSize: '10px', marginLeft: '4px' }}>(Main)</span>}
                            {isSelf && !isMainAdmin && <span style={{ color: 'var(--text-secondary)', fontSize: '10px', marginLeft: '4px' }}>(You)</span>}
                          </span>
                          <span className={styles.userEmail}>{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {u.role === 'ADMIN' ? (
                        <span className={styles.roleBadgeAdmin}>Administrator</span>
                      ) : u.role === 'EDITOR' ? (
                        <span className={styles.roleBadgeEditor}>Editor</span>
                      ) : (
                        <span className={styles.roleBadgeStandard}>Standard User</span>
                      )}
                    </td>
                    <td>
                      {u.isBanned ? (
                        <div className={styles.statusBanned}>
                          <span className={styles.statusDotBanned}></span>
                          <span className={styles.statusTextBanned}>Banned</span>
                        </div>
                      ) : (
                        <div className={styles.statusActive}>
                          <span className={styles.statusDotActive}></span>
                          <span className={styles.statusTextActive}>Active</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={styles.timeText}>{u.snippetCount || 0} snippets</span>
                    </td>
                    <td>
                      <div className={styles.actionCell}>
                        {canEditUser(u) && (
                          <>
                            {u.role !== 'ADMIN' && (
                              <button 
                                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} 
                                title="Promote to Admin"
                                onClick={() => handleRoleChange(u, 'ADMIN')}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>keyboard_double_arrow_up</span>
                              </button>
                            )}
                            {u.role === 'ADMIN' && (
                              <button 
                                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} 
                                title="Demote to User"
                                onClick={() => handleRoleChange(u, 'SUBSCRIBER')}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>keyboard_double_arrow_down</span>
                              </button>
                            )}
                            
                            {u.isBanned ? (
                              <button 
                                className={`${styles.actionBtn} ${styles.actionBtnSuccess}`} 
                                title="Unban User"
                                onClick={() => toggleBan(u)}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                              </button>
                            ) : (
                              <button 
                                className={`${styles.actionBtn} ${styles.actionBtnDanger}`} 
                                title="Ban User"
                                onClick={() => toggleBan(u)}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>block</span>
                              </button>
                            )}
                            
                            <button 
                              className={`${styles.actionBtn} ${styles.actionBtnDanger}`} 
                              title="Delete Account"
                              onClick={() => handleDelete(u.id)}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>SHOWING {users.length > 0 ? '1' : '0'}-{users.length} OF {total} USERS</span>
          <div className={styles.paginationControls}>
            <button className={styles.pageBtn} disabled>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
            </button>
            <button className={`${styles.pageBtn} ${styles.active}`}>1</button>
            <button className={styles.pageBtn} disabled>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
