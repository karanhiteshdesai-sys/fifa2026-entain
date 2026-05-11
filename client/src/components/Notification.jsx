import { useState, useEffect } from 'react';

function Notification({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 10000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-20 right-5 z-50 max-w-sm animate-slide-in ${
      type === 'success' ? 'bg-entain-green/20 border-entain-green/40' : 'bg-red-500/20 border-red-500/40'
    } border rounded-xl p-4 shadow-xl backdrop-blur-sm`}>
      <div className="flex items-start gap-3">
        <span className="text-lg">{type === 'success' ? '✅' : '❌'}</span>
        <div className="flex-1">
          <p className="text-white text-sm font-medium">{message}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">✕</button>
      </div>
    </div>
  );
}

export default Notification;
