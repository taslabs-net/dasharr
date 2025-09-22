'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signIn } from '@/lib/auth-client';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn.email({
        email,
        password,
      });
      
      console.log('Login result:', result);
      
      // Redirect to admin after successful login
      router.push('/admin');
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Invalid credentials';
      
      // Check for specific error types
      if (errorMessage.includes('fetch')) {
        setError('Network error - please check your connection');
      } else if (errorMessage.includes('401') || errorMessage.includes('Invalid')) {
        setError('Invalid email or password');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-fd-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <Image 
              src="/dasharr-icon-192.png" 
              alt="Dasharr" 
              width={48}
              height={48}
              className="mx-auto hover:opacity-80 transition-opacity cursor-pointer"
            />
          </Link>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-fd-foreground">
            Admin Login
          </h2>
          <p className="mt-2 text-sm text-fd-muted-foreground">
            Sign in to access the admin panel
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full rounded-md border border-fd-border bg-fd-background px-3 py-2 text-fd-foreground placeholder-fd-muted-foreground focus:z-10 focus:border-dasharr-purple focus:outline-none focus:ring-2 focus:ring-dasharr-purple"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full rounded-md border border-fd-border bg-fd-background px-3 py-2 text-fd-foreground placeholder-fd-muted-foreground focus:z-10 focus:border-dasharr-purple focus:outline-none focus:ring-2 focus:ring-dasharr-purple"
                placeholder="Password"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-md bg-dasharr-purple px-3 py-2 text-sm font-semibold text-white hover:bg-dasharr-purple/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dasharr-purple disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      </div>
    </main>
  );
}