import { useState, useEffect } from "react";
import { X, Download, Share, Plus } from "lucide-react";

function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 이미 설치되었는지 확인
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setIsStandalone(standalone);

    // iOS 확인
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    // 이미 닫았는지 확인 (24시간 동안 다시 표시 안 함)
    const dismissed = localStorage.getItem("installPromptDismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      if (Date.now() - dismissedTime < 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Android/Chrome - beforeinstallprompt 이벤트
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!standalone) {
        setTimeout(() => setShowPrompt(true), 3000); // 3초 후 표시
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // iOS에서는 직접 표시
    if (ios && !standalone) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("installPromptDismissed", Date.now().toString());
  };

  // 이미 설치되었거나 표시하지 않음
  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 shadow-2xl shadow-black/50 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-tennis-500 to-tennis-600 flex items-center justify-center">
              <span className="text-2xl">🎾</span>
            </div>
            <div>
              <h3 className="text-white font-bold">앱처럼 사용하기</h3>
              <p className="text-slate-400 text-sm">홈 화면에 추가</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-slate-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <p className="text-slate-300 text-sm mb-4">
          홈 화면에 추가하면 앱처럼 빠르게 접속할 수 있어요!
        </p>

        {/* iOS Instructions */}
        {isIOS ? (
          <div className="bg-slate-700/50 rounded-xl p-3 mb-4">
            <p className="text-slate-300 text-sm flex items-center gap-2 mb-2">
              <span className="font-medium">Safari에서:</span>
            </p>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <div className="flex items-center gap-1">
                <span className="bg-slate-600 p-1 rounded">
                  <Share size={14} />
                </span>
                <span>공유</span>
              </div>
              <span>→</span>
              <div className="flex items-center gap-1">
                <span className="bg-slate-600 p-1 rounded">
                  <Plus size={14} />
                </span>
                <span>홈 화면에 추가</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2.5 px-4 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all text-sm font-medium"
          >
            나중에
          </button>
          {!isIOS && deferredPrompt ? (
            <button
              onClick={handleInstall}
              className="flex-1 py-2.5 px-4 rounded-xl bg-tennis-500 hover:bg-tennis-600 text-white font-medium flex items-center justify-center gap-2 transition-all text-sm"
            >
              <Download size={16} />
              추가하기
            </button>
          ) : isIOS ? (
            <button
              onClick={handleDismiss}
              className="flex-1 py-2.5 px-4 rounded-xl bg-tennis-500 hover:bg-tennis-600 text-white font-medium transition-all text-sm"
            >
              확인
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default InstallPrompt;

