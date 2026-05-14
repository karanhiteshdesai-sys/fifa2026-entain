import { useState, useEffect, useRef } from 'react';

function UpdateBanner() {
  const [showUpdate, setShowUpdate] = useState(false);
  const currentVersion = useRef(null);

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const res = await fetch('/version.json?t=' + Date.now());
        if (!res.ok) return;
        const data = await res.json();

        if (currentVersion.current === null) {
          // First load — store the current version
          currentVersion.current = data.version;
        } else if (data.version !== currentVersion.current) {
          // Version changed — new deployment detected
          setShowUpdate(true);
        }
      } catch {
        // Silently ignore fetch errors
      }
    };

    checkForUpdates();
    const interval = setInterval(checkForUpdates, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-fade-in">
      <div className="bg-entain-navy border border-entain-accent/50 rounded-xl shadow-2xl px-6 py-4 flex items-center gap-4 max-w-md">
        <div className="flex-shrink-0 text-2xl">🔄</div>
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">New updates available</p>
          <p className="text-gray-400 text-xs">Please refresh to get the latest version.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-entain-accent text-entain-dark font-bold px-4 py-2 rounded-lg text-sm hover:bg-entain-accent/90 transition flex-shrink-0"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

export default UpdateBanner;
