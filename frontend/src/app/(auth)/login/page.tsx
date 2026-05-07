"use client"

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AuthService } from '@/lib/api/auth.service';
import { useAuthStore } from '@/lib/store/auth.store';
import { Eye, EyeOff, Zap, UserCircle2 } from 'lucide-react';
import Image from 'next/image';
import { GoogleLogin } from '@react-oauth/google';
import LoadingOverlay from '@/components/LoadingOverlay';
import CaptchaBox, { type CaptchaHandle } from '@/components/CaptchaBox';

export default function LoginPage() {
  const router = useRouter();
  const storeLogin = useAuthStore((state) => state.login);
  const loginAsGuest = useAuthStore((state) => state.loginAsGuest);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const captchaRef = useRef<CaptchaHandle>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!captchaVerified) {
      setError('Please complete the security captcha first.');
      return;
    }

    setIsLoading(true);
    setShowOverlay(true);

    try {
      const userData = await AuthService.login({
        username: formData.username,
        password: formData.password,
      });
      storeLogin(userData);
      router.push('/dashboard');
    } catch (err: any) {
      setShowOverlay(false);
      setError(err.response?.data?.message || err.message || 'Invalid username or password. Please try again.');
      captchaRef.current?.reset();
      setCaptchaVerified(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setShowOverlay(true);
    setError('');
    try {
      if (credentialResponse.credential) {
        const userData = await AuthService.googleLogin(credentialResponse.credential);
        storeLogin(userData);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setShowOverlay(false);
      setError(err.response?.data?.message || err.message || 'Google Sign In failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign In was unsuccessful.');
  };

  const handleGuestLogin = () => {
    setShowOverlay(true);
    loginAsGuest();
    // Use window.location for a full navigation — guarantees the store
    // is persisted and the dashboard layout picks up the guest user
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 600);
  };

  return (
    <>
      <LoadingOverlay isVisible={showOverlay} />
      
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        {/* Decorative floating elements */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          {/* Logo / Brand */}
          <div className="mb-8 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-primary">
              <Image src="/logo.png" alt="CodePulse" width={32} height={32} className="rounded-md" />
              <span className="text-2xl font-bold tracking-tight">CodePulse</span>
            </div>
            <p className="text-sm text-muted-foreground">Track, Analyze & Master Your Coding Journey</p>
          </div>

          <Card className="border-border/50 shadow-xl backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center pb-4">
              <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
              <CardDescription>Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Username or Email</Label>
                  <Input
                    id="login-username"
                    name="login-username"
                    placeholder="Enter your username or email"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    autoComplete="username"
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-primary hover:underline hover:text-primary/80 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="login-password"
                      name="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      autoComplete="current-password"
                      className="pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Custom Text CAPTCHA */}
                <CaptchaBox
                  ref={captchaRef}
                  onVerify={(v) => { setCaptchaVerified(v); if (v) setError(''); }}
                  className="my-1"
                />

                {error && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4 animate-pulse" />
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="flex justify-center w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  text="signin_with"
                  theme="outline"
                  size="large"
                  shape="rectangular"
                  width="100%"
                />
              </div>

              {/* Guest Mode Button */}
              <button
                id="guest-login-btn"
                type="button"
                onClick={handleGuestLogin}
                className="group w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02] px-4 py-2.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 transition-all duration-200 hover:border-violet-400/40 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/[0.04]"
              >
                <UserCircle2 className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                Continue as Guest
              </button>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2 text-center text-sm pt-2">
              <p className="text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="font-semibold text-primary hover:underline transition-colors">
                  Create account
                </Link>
              </p>
            </CardFooter>
          </Card>

          {/* Bottom subtle branding */}
          <p className="mt-6 text-center text-xs text-muted-foreground/60">
            © 2026 CodePulse. Built for developers, by developers.
          </p>
        </div>
      </div>
    </>
  );
}