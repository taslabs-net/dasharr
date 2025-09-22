'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, signUp } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/admin';
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [authEnabled, setAuthEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    // Check auth status
    fetch('/api/auth/status')
      .then(res => res.json())
      .then(data => {
        setHasAdmin(data.hasAdmin);
        setAuthEnabled(data.authEnabled);
      })
      .catch(() => {
        setHasAdmin(false);
        setAuthEnabled(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        
        await signUp.email({
          email,
          password,
          name: email.split('@')[0], // Use email prefix as name
        });
      }
      
      await signIn.email({
        email,
        password,
      });
      
      router.push(from);
      router.refresh();
    } catch (error) {
      console.error('Auth error:', error);
      setError(isSignUp ? 'Failed to create account' : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <Image
              src="/dasharr-icon-192.png"
              alt="Dasharr Logo"
              width={48}
              height={48}
            />
          </div>
          <CardTitle className="text-2xl text-center">
            {authEnabled && hasAdmin === false && !isSignUp 
              ? 'Create Admin Account'
              : hasAdmin === false && !isSignUp 
              ? 'Welcome to Dasharr Admin'
              : isSignUp 
              ? 'Create Admin Account' 
              : 'Admin Login'}
          </CardTitle>
          <CardDescription className="text-center">
            {authEnabled && hasAdmin === false && !isSignUp
              ? 'Authentication is enabled. Create your admin account to continue.'
              : hasAdmin === false && !isSignUp
              ? 'No admin account found. Click below to enable admin login.'
              : isSignUp 
              ? 'Set up your admin credentials to manage Dasharr'
              : 'Sign in to access the admin panel'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {authEnabled && hasAdmin === false ? (
            // Show signup form directly when auth is enabled but no admin
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="border-red-500 text-red-600">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create Admin Account'}
              </Button>
            </form>
          ) : hasAdmin === false && !isSignUp ? (
            <div className="space-y-4">
              <Button 
                onClick={() => setIsSignUp(true)}
                className="w-full"
                size="lg"
              >
                Enable Admin Login
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Click to set up admin authentication for your Dasharr instance
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="border-red-500 text-red-600">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                />
              </div>
              
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={8}
                  />
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Please wait...' : (isSignUp ? 'Create Admin Account' : 'Sign In')}
              </Button>
              
              {hasAdmin !== false && (
                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setError('');
                    }}
                    className="text-primary hover:underline"
                    disabled={loading}
                  >
                    {isSignUp 
                      ? 'Back to login'
                      : 'Forgot password?'
                    }
                  </button>
                </div>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}