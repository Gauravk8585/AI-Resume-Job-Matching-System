import React, { useState } from 'react';
import { Download, ExternalLink, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = () => {
    if (isInstallable) {
      void install();
    } else {
      setShowGuide(true);
    }
  };

  const currentOrigin =
    typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 rounded-xl font-semibold transition-colors whitespace-nowrap ${
          compact
            ? 'px-2.5 py-1.5 text-xs bg-indigo-50 dark:bg-indigo-950/50 text-[#6425E8] dark:text-[#A78BFA] hover:bg-indigo-100 dark:hover:bg-indigo-950'
            : 'px-3 py-1.5 text-xs bg-[#6425E8] hover:bg-[#531BC9] text-white shadow-sm'
        }`}
      >
        {isInstallable ? (
          <Download className="w-3.5 h-3.5" />
        ) : (
          <Smartphone className="w-3.5 h-3.5" />
        )}
        <span className={compact ? 'hidden md:inline' : ''}>
          {isInstallable ? 'Install App' : isIOS ? 'Install on iOS' : 'Android / Install'}
        </span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#16122B] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#6425E8] dark:text-[#A78BFA] flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                    {isIOS ? 'Install on iPhone / iPad' : 'Install on Android / Export APK'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    PWA &amp; Android Packaging Ready
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install dialog"
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="text-sm text-slate-600 dark:text-slate-300 space-y-2 list-decimal list-inside">
                <li>Open this app in <strong>Safari</strong> (outside embedded preview).</li>
                <li>Tap the <strong>Share</strong> icon in Safari&apos;s toolbar.</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              </ol>
            ) : (
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1D1836] border border-slate-200 dark:border-slate-800 space-y-1">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Option 1 — Instant Android Install (No APK Needed)
                  </p>
                  <p>
                    Open the published app URL in <strong>Chrome on Android</strong>, tap the menu (⋮), and choose <strong>Install app</strong> to add ResumeMatch directly to your home screen.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 space-y-1.5">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Option 2 — Generate Downloadable .APK via PWABuilder
                  </p>
                  <p>
                    This app includes a Web App Manifest, Service Worker, and Android adaptive icons. Paste your deployed Shared App URL into PWABuilder to download a signed Android <code>.apk</code> package.
                  </p>
                  {currentOrigin && (
                    <p className="font-mono text-[11px] break-all bg-white dark:bg-[#16122B] px-2 py-1 rounded border border-indigo-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      {currentOrigin}
                    </p>
                  )}
                  <a
                    href="https://www.pwabuilder.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-semibold text-[#6425E8] dark:text-[#A78BFA] hover:underline pt-0.5"
                  >
                    Open PWABuilder
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
