import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Show browser notification for new unread
  useEffect(() => {
    if (unreadCount > 0 && 'Notification' in window && Notification.permission === 'granted') {
      // Only show if tab is not focused
      if (document.hidden) {
        new Notification('FIFA 2026 Predictions', {
          body: `You have ${unreadCount} new notification${unreadCount > 1 ? 's' : ''}`,
          icon: '/entain-logo.svg'
        });
      }
    }
  }, [unreadCount]);

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnreadCount(data.count);
    } catch (err) {}
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (err) {}
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark-read');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {}
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen} className="relative text-gray-300 hover:text-white transition">
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-entain-red text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-entain-navy border border-entain-blue/30 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-entain-blue/20 flex items-center justify-between">
            <p className="text-white text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-entain-accent text-xs hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No notifications yet</p>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className={`px-4 py-3 border-b border-entain-blue/10 ${!notif.read ? 'bg-entain-blue/10' : ''}`}>
                  <div className="flex items-start justify-between">
                    <p className="text-white text-sm font-medium">{notif.title}</p>
                    <span className="text-gray-500 text-[10px] ml-2 whitespace-nowrap">{formatTime(notif.created_at)}</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
