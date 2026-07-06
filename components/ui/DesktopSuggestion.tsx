'use client';

import React, { useEffect, useState } from 'react';

interface DesktopSuggestionProps {
  featureName: string;
  message: string;
  onContinue: () => void;
  onDismiss: () => void;
}

export function DesktopSuggestion({ 
  featureName,
  message,
  onContinue,
  onDismiss
}: DesktopSuggestionProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  if (!isMobile) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4 text-left animate-page-enter">
      <div className="flex items-start gap-3">
        <span className="text-2xl select-none">💻</span>
        <div>
          <p className="text-text-1 font-medium text-sm mb-1">
            Better on a larger screen
          </p>
          <p className="text-text-3 text-xs mb-3 leading-relaxed font-semibold">
            {message}
          </p>
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={onContinue}
              className="text-xs bg-card border border-border text-text-1 hover:bg-surface-alt px-3 py-1.5 rounded-lg transition cursor-pointer font-bold"
            >
              Continue on mobile
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs text-text-3 hover:text-text-2 transition cursor-pointer font-bold px-2 py-1"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
