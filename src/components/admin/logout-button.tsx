'use client';

import { Button } from '@/components/ui/button';
import { signOut, useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

export function LogoutButton() {
  const router = useRouter();
  const { data: session } = useSession();
  const [authEnabled, setAuthEnabled] = useState(false);

  useEffect(() => {
    // Check if auth is enabled
    fetch('/api/auth/status')
      .then(res => res.json())
      .then(data => setAuthEnabled(data.authEnabled))
      .catch(() => setAuthEnabled(false));
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      // If logout fails, still redirect to login
      console.error('Logout error:', error);
    }
    router.push('/admin/login');
    router.refresh();
  };

  // Only show logout button if auth is enabled and user has a session
  if (!authEnabled || !session) {
    return null;
  }

  return (
    <Button 
      onClick={handleLogout}
      variant="outline"
      size="sm"
      className="w-full"
    >
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </Button>
  );
}