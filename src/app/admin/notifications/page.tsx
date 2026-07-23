'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { subscribeToNotifications, markNotificationRead, markAllNotificationsRead, Notification, approveAccess, denyAccess, updateUser } from '@/lib/firebase-db';
import { Bell, CheckCheck, UserPlus, Check, X, ExternalLink, ShieldAlert } from 'lucide-react';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToNotifications(50, (data) => {
      setNotifications(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleApprove = async (e: React.MouseEvent, n: Notification) => {
    e.stopPropagation();
    try {
      await approveAccess(n.snippetId, n.fromUserId);
      await handleMarkRead(n.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeny = async (e: React.MouseEvent, n: Notification) => {
    e.stopPropagation();
    try {
      if (n.type === 'UNBAN_REQUEST') {
        // Just mark as read
      } else {
        await denyAccess(n.snippetId, n.fromUserId);
      }
      await handleMarkRead(n.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveUnban = async (e: React.MouseEvent, n: Notification) => {
    e.stopPropagation();
    try {
      await updateUser(n.fromUserId, { isBanned: false } as any);
      await handleMarkRead(n.id);
      alert(`${n.fromUserName || n.fromUserEmail} has been unbanned.`);
    } catch (err) {
      console.error(err);
      alert('Failed to unban user.');
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'ACCESS_REQUEST': return <UserPlus size={16} style={{color:'var(--accent-primary)'}} />;
      case 'ACCESS_GRANTED': return <Check size={16} style={{color:'var(--success)'}} />;
      case 'ACCESS_DENIED': return <X size={16} style={{color:'var(--error)'}} />;
      case 'UNBAN_REQUEST': return <ShieldAlert size={16} style={{color:'var(--error)'}} />;
      default: return <Bell size={16} />;
    }
  };

  const getText = (n: Notification) => {
    switch (n.type) {
      case 'ACCESS_REQUEST': return `${n.fromUserName || n.fromUserEmail} requested edit access to "${n.snippetTitle}"`;
      case 'ACCESS_GRANTED': return `You were granted edit access to "${n.snippetTitle}"`;
      case 'ACCESS_DENIED': return `Access denied for "${n.snippetTitle}"`;
      case 'UNBAN_REQUEST': return `${n.fromUserName || n.fromUserEmail} requested to be unbanned.`;
      default: return '';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</h1>
        {unreadCount > 0 && (
          <button className="btn-secondary" onClick={handleMarkAllRead} style={{fontSize:'0.8rem', padding:'0.4rem 0.75rem'}}>
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      ) : notifications.length === 0 ? (
        <div style={{background:'var(--bg-secondary)', border:'1px solid var(--border-color)', borderRadius:'var(--radius-lg)', padding:'2rem', textAlign:'center'}}>
          <Bell size={32} style={{color:'var(--text-secondary)', marginBottom:'0.75rem'}} />
          <p style={{color:'var(--text-primary)', fontWeight:500}}>No notifications yet</p>
        </div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
          {notifications.map(n => (
            <div key={n.id} style={{
              display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem 1rem', flexWrap: 'wrap',
              background: n.read ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
              cursor: 'pointer', opacity: n.read ? 0.7 : 1,
            }} onClick={() => handleMarkRead(n.id)}>
              {getIcon(n.type)}
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:'0.85rem', color:'var(--text-primary)', fontWeight: n.read ? 400 : 600}}>{getText(n)}</div>
                <div style={{fontSize:'0.75rem', color:'var(--text-secondary)', marginTop:'0.15rem'}}>
                  {n.createdAt?.toDate().toLocaleString() || ''}
                </div>
                {n.type === 'ACCESS_REQUEST' && !n.read && (
                  <div style={{display:'flex', gap:'0.5rem', marginTop:'0.5rem'}}>
                    <button className="btn-primary" style={{padding:'0.25rem 0.75rem', fontSize:'0.75rem'}} onClick={(e) => handleApprove(e, n)}>Approve</button>
                    <button className="btn-secondary" style={{padding:'0.25rem 0.75rem', fontSize:'0.75rem', background:'var(--bg-primary)'}} onClick={(e) => handleDeny(e, n)}>Deny</button>
                  </div>
                )}
                {n.type === 'UNBAN_REQUEST' && !n.read && (
                  <div style={{display:'flex', gap:'0.5rem', marginTop:'0.5rem'}}>
                    <button className="btn-primary" style={{padding:'0.25rem 0.75rem', fontSize:'0.75rem', background:'var(--success)', borderColor:'var(--success)'}} onClick={(e) => handleApproveUnban(e, n)}>Allow (Unban)</button>
                    <button className="btn-secondary" style={{padding:'0.25rem 0.75rem', fontSize:'0.75rem', background:'var(--bg-primary)'}} onClick={(e) => handleDeny(e, n)}>Ignore</button>
                  </div>
                )}
              </div>
              {!n.read && <div style={{width:8, height:8, borderRadius:'50%', background:'var(--accent-primary)', flexShrink:0}} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
