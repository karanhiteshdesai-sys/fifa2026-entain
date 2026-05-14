import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

function BroadcastAlert() {
  const [broadcast, setBroadcast] = useState(null);
  const lastChecked = useRef(new Date().toISOString());

  useEffect(() => {
    const checkBroadcast = async () => {
      try {
        const { data } = await api.get('/notifications/broadcast/latest', {
          params: { since: lastChecked.current }
        });
        if (data.broadcast) {
          setBroadcast(data.broadcast);
          lastChecked.current = data.broadcast.created_at;
        }
      } catch {
        // Silently ignore errors
      }
    };

    const interval = setInterval(checkBroadcast, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (!broadcast) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] px-4">
      <div className="bg-entain-navy rounded-xl p-6 w-full max-w-md border border-entain-accent/50 shadow-2xl animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">📢</span>
          <h3 className="text-white text-xl font-bold">Broadcast Message</h3>
        </div>

        <div className="bg-entain-dark rounded-lg p-4 mb-4 border border-entain-blue/20">
          <p className="text-entain-accent font-semibold text-base mb-2">{broadcast.title}</p>
          <p className="text-gray-300 text-sm whitespace-pre-wrap">{broadcast.message}</p>
        </div>

        <p className="text-gray-500 text-xs mb-4">
          {new Date(broadcast.created_at).toLocaleString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })}
        </p>

        <button
          onClick={() => setBroadcast(null)}
          className="w-full bg-entain-accent text-entain-dark font-bold py-2.5 rounded-lg hover:bg-entain-accent/90 transition"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export default BroadcastAlert;
