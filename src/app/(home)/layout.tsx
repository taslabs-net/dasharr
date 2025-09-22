'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/app/layout.config';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export default function Layout({ children }: { children: ReactNode }) {
  const [kioskMode, setKioskMode] = useState(false);
  const [layoutOptions, setLayoutOptions] = useState<BaseLayoutProps>(baseOptions);

  useEffect(() => {
    // Just use base options
    setLayoutOptions(baseOptions);
  }, []);

  useEffect(() => {
    // Double-click handler for the main content area
    const handleDoubleClick = (e: MouseEvent) => {
      // Check if the click is on the background (not on a widget or interactive element)
      const target = e.target as HTMLElement;
      
      // Check if clicked on main, body, or a div that's part of the background
      const isBackgroundClick = 
        target.tagName === 'MAIN' || 
        target.tagName === 'BODY' ||
        (target.tagName === 'DIV' && (
          target.classList.contains('grid') ||
          target.classList.contains('flex-1') ||
          target.classList.contains('flex-col') ||
          target === document.getElementById('dashboard-background')
        ));
      
      if (isBackgroundClick) {
        setKioskMode(prev => !prev);
      }
    };

    // ESC key handler to exit kiosk mode
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && kioskMode) {
        setKioskMode(false);
      }
    };

    document.addEventListener('dblclick', handleDoubleClick);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('dblclick', handleDoubleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [kioskMode]);

  // In kiosk mode, render children directly without the HomeLayout wrapper
  if (kioskMode) {
    return (
      <div id="dashboard-background" className="min-h-screen bg-fd-background relative">
        {children}
        {/* Subtle indicator that kiosk mode is active */}
        <div className="fixed top-2 right-2 opacity-20 hover:opacity-50 transition-opacity">
          <div className="w-2 h-2 bg-fd-foreground rounded-full" title="Kiosk Mode Active - Double-click background to exit" />
        </div>
      </div>
    );
  }

  // Normal mode with full layout
  return <HomeLayout {...layoutOptions}>{children}</HomeLayout>;
}