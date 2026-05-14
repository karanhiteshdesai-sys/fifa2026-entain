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
          currentVersion.current = data.version;
        } else if (data.version !== currentVersion.current) {
          setShowUpdate(true);
        }
      } catch {
        // Silently ignore fetch errors
      }
    };

    checkForUpdates();
    const interval = setInterval(checkForUpdates, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    // Save current path so user stays on the same page after refresh
    sessionStorage.setItem('returnPath', window.location.pathname);
    window.location.reload();
  };

  // On mount, check if we need to navigate back after a refresh
  useEffect(() => {
    const returnPath = sessionStorage.getItem('returnPath');
    if (returnPath) {
      sessionStorage.removeItem('returnPath');
      if (window.location.pathname !== returnPath) {
        window.history.replaceState(null, '', returnPath);
      }
    }
  }, []);

  if (!showUpdate) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] px-4">
      <div className="bg-entain-navy rounded-xl p-6 w-full max-w-sm border border-entain-accent/50 shadow-2xl text-center">
        <div className="text-4xl mb-4">🔄</div>
        <h3 className="text-white text-xl font-bold mb-2">New Update Available</h3>
        <p className="text-gray-400 text-sm mb-6">A new version has been deployed. Please refresh to get the latest changes.</p>
        <button
          onClick={handleRefresh}
          className="w-full bg-entain-accent text-entain-dark font-bold py-2.5 rounded-lg hover:bg-entain-accent/90 transition"
        >
          Refresh Now
        </button>
      </div>
    </div>
  );
}

export default UpdateBanner;
