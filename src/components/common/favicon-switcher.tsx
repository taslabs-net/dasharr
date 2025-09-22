'use client';

import { useEffect } from 'react';

export function FaviconSwitcher() {
  useEffect(() => {
    const updateFavicon = (isDark: boolean) => {
      const theme = isDark ? 'dark' : 'light';
      
      // Update favicon links
      const links = document.querySelectorAll('link[rel*="icon"]');
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href?.includes('/favicons/')) {
          const newHref = href.replace(/\/favicons\/(light|dark)\//, `/favicons/${theme}/`);
          link.setAttribute('href', newHref);
        }
      });
    };

    // Check initial theme
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    updateFavicon(isDark);

    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => updateFavicon(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return null;
}