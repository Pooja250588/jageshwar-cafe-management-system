import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

/**
 * Shows a toast at the top when a new app version is available.
 * User taps "Update Now" → page reloads with the new version instantly.
 */
function UpdatePrompt() {
  const [show, setShow] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every 60 seconds (in case user keeps app open)
      r && setInterval(() => r.update(), 60 * 1000);
    },
  });

  useEffect(() => {
    if (needRefresh) setShow(true);
  }, [needRefresh]);

  if (!show) return null;

  return (
    <div className="pwa-update-bar">
      <span className="pwa-update-icon">🔄</span>
      <div className="pwa-update-text">
        <strong>New update available!</strong>
        <span>Tap to get the latest version</span>
      </div>
      <button
        className="pwa-update-btn"
        onClick={() => {
          updateServiceWorker(true);
          setShow(false);
        }}
      >
        Update Now
      </button>
      <button
        className="pwa-dismiss-btn"
        onClick={() => setShow(false)}
      >
        ✕
      </button>
    </div>
  );
}

export default UpdatePrompt;
