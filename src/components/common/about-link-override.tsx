'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AboutLinkOverride() {
  const router = useRouter();

  useEffect(() => {
    const handleAboutClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href="/admin/about"]');
      
      if (link) {
        e.preventDefault();
        e.stopPropagation();
        router.push('/admin/about');
      }
    };

    // Add event listener to the document
    document.addEventListener('click', handleAboutClick, true);

    return () => {
      document.removeEventListener('click', handleAboutClick, true);
    };
  }, [router]);

  return null;
}