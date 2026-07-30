import { useState, useEffect } from "react";

/**
 * Shows a custom "Install App" banner when the browser
 * fires the beforeinstallprompt event (Android Chrome).
 * Also shows a manual iOS instruction since iOS doesn't support the event.
 */
function InstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (running as standalone)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const isIos =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !window.navigator.standalone;

    if (isIos) {
      // Show iOS tip after 3 seconds if not dismissed before
      const dismissed = localStorage.getItem("pwa-ios-dismissed");
      if (!dismissed) {
        setTimeout(() => setShowIosTip(true), 3000);
      }
      return;
    }

    // Android / Chrome — capture the install prompt
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      const dismissed = localStorage.getItem("pwa-banner-dismissed");
      if (!dismissed) setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Listen for successful install
    window.addEventListener("appinstalled", () => {
      setShowBanner(false);
      setIsInstalled(true);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  };

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-banner-dismissed", "1");
  };

  const dismissIosTip = () => {
    setShowIosTip(false);
    localStorage.setItem("pwa-ios-dismissed", "1");
  };

  if (isInstalled) return null;

  // ── Android Install Banner ────────────────────────────────
  if (showBanner) {
    return (
      <div className="pwa-banner">
        <img src="/logo.jpeg" alt="Jageshwar Cafe" className="pwa-banner-logo" />
        <div className="pwa-banner-text">
          <strong>Install Jageshwar Cafe</strong>
          <span>Add to your home screen for quick access!</span>
        </div>
        <div className="pwa-banner-actions">
          <button className="pwa-install-btn" onClick={handleInstall}>
            Install
          </button>
          <button className="pwa-dismiss-btn" onClick={dismissBanner}>
            ✕
          </button>
        </div>
      </div>
    );
  }

  // ── iOS Install Tip ───────────────────────────────────────
  if (showIosTip) {
    return (
      <div className="pwa-ios-tip">
        <button className="pwa-dismiss-btn pwa-ios-close" onClick={dismissIosTip}>✕</button>
        <img src="/logo.jpeg" alt="Jageshwar Cafe" className="pwa-banner-logo" />
        <div className="pwa-ios-text">
          <strong>Install this app on iPhone</strong>
          <p>
            Tap <span className="pwa-ios-share-icon">⎋</span> <strong>Share</strong> then{" "}
            <strong>"Add to Home Screen"</strong>
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export default InstallPrompt;
