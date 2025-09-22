'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [authEnabled, setAuthEnabled] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        // Check if auth is enabled
        const response = await fetch('/api/auth/status');
        const { authEnabled: enabled } = await response.json();
        setAuthEnabled(enabled);
        
        // If auth is enabled and no session, redirect to login
        if (enabled && !isPending && !session) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/');
      } finally {
        setChecking(false);
      }
    }
    
    if (!isPending) {
      checkAuth();
    }
  }, [session, isPending, router]);

  // Show loading while checking auth
  if (checking || isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-fd-muted-foreground" />
      </div>
    );
  }

  // If auth is disabled, allow access
  if (authEnabled === false) {
    return <>{children}</>;
  }

  // If auth is enabled and user has session, allow access
  if (authEnabled && session) {
    return <>{children}</>;
  }

  // Otherwise, redirect is happening
  return null;
}