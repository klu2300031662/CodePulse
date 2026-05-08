"use client"

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthService } from '@/lib/api/auth.service';
import { useAuthStore } from '@/lib/store/auth.store';
import { Eye, EyeOff, Zap, UserCircle2, ArrowRight, Lock, Mail } from 'lucide-react';
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
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 600);
  };

  return (
    <>
      <LoadingOverlay isVisible={showOverlay} />
      
      <div className="fixed inset-0 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
        {/* Animated background orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full bg-violet-500/[0.06] blur-[100px] animate-pulse" />
          <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-blue-500/[0.06] blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[200px] w-[200px] rounded-full bg-cyan-500/[0.04] blur-[80px]" />
        </div>

        <div className="relative w-full max-w-[420px] px-4">
          {/* Logo */}
          <div className="mb-6 flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-2 text-primary">
              <Image src="/logo.png" alt="CodePulse" width={34} height={34} className="rounded-lg shadow-md" />
              <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-blue-600 dark:from-violet-400 dark:to-blue-400">CodePulse</span>
            </div>
            <p className="text-xs text-muted-foreground">Track, Analyze & Master Your Coding Journey</p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-zinc-200/60 dark:border-white/[0.06] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl shadow-violet-500/[0.03] p-6">
            <div className="text-center mb-5">
              <h1 className="text-xl font-bold tracking-tight">Welcome back</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off">
              <div className="space-y-1.5">
                <Label htmlFor="login-username" className="text-xs font-medium">Username or Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    id="login-username"
                    name="login-username"
                    placeholder="Enter your username or email"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    autoComplete="username"
                    className="pl-9 h-10 transition-all duration-200 focus:ring-2 focus:ring-violet-500/20 border-zinc-200 dark:border-zinc-700"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-xs font-medium">Password</Label>
                  <Link href="/forgot-password" className="text-[11px] text-violet-600 dark:text-violet-400 hover:underline transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    id="login-password"
                    name="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    autoComplete="current-password"
                    className="pl-9 pr-10 h-10 transition-all duration-200 focus:ring-2 focus:ring-violet-500/20 border-zinc-200 dark:border-zinc-700"
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

              {/* Captcha */}
              <CaptchaBox
                ref={captchaRef}
                onVerify={(v) => { setCaptchaVerified(v); if (v) setError(''); }}
                className="my-0.5"
              />

              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20 px-3 py-2">
                  <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-10 font-semibold bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300 border-0"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4 animate-pulse" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">Sign In <ArrowRight className="h-3.5 w-3.5" /></span>
                )}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-200 dark:border-zinc-700" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                <span className="bg-white dark:bg-zinc-900 px-3 text-muted-foreground">Or continue with</span>
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

            {/* Guest Mode */}
            <button
              id="guest-login-btn"
              type="button"
              onClick={handleGuestLogin}
              className="group w-full flex items-center justify-center gap-2 mt-3 rounded-xl border border-dashed border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02] px-4 py-2.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 transition-all duration-200 hover:border-violet-400/40 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/[0.04]"
            >
              <UserCircle2 className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              Continue as Guest
            </button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold text-violet-600 dark:text-violet-400 hover:underline transition-colors">
                Create account
              </Link>
            </p>
          </div>

          <p className="mt-4 text-center text-[11px] text-muted-foreground/50">
            © 2026 CodePulse. Built for developers, by developers.
          </p>
        </div>
      </div>
    </>
  );
}