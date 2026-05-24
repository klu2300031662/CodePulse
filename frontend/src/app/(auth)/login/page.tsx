"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthService } from '@/lib/api/auth.service';
import { useAuthStore } from '@/lib/store/auth.store';
import { Eye, EyeOff, ArrowRight, UserCircle2, ArrowLeft, Sparkles, Sun, Moon } from 'lucide-react';
import Image from 'next/image';
import { GoogleLogin } from '@react-oauth/google';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useTheme } from 'next-themes';

/* ── Floating particle background ── */
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-float-particle"
          style={{
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `hsla(${250 + Math.random() * 40}, 80%, 70%, ${0.15 + Math.random() * 0.25})`,
            animationDuration: `${6 + Math.random() * 10}s`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Animated code icon ── */
function AnimatedCodeIcon() {
  return (
    <div className="relative w-52 h-52 flex items-center justify-center group">
      {/* Rotating outer ring */}
      <div className="absolute inset-0 rounded-[2rem] border border-violet-400/10 animate-spin-very-slow" />
      <div className="absolute inset-2 rounded-[1.6rem] border border-blue-400/[0.07] animate-spin-reverse-slow" />

      {/* Glow backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/15 via-blue-500/10 to-cyan-400/15 blur-[60px] rounded-full animate-pulse" />

      {/* Glass card */}
      <div className="absolute inset-4 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.06] shadow-2xl" />

      {/* Code brackets SVG — main hero */}
      <svg
        className="relative h-24 w-24 drop-shadow-[0_0_40px_rgba(139,92,246,0.4)]"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          <linearGradient id="login-bracket-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
        <polyline points="16 18 22 12 16 6" stroke="url(#login-bracket-grad)" />
        <polyline points="8 6 2 12 8 18" stroke="url(#login-bracket-grad)" />
        <line x1="14" y1="4" x2="10" y2="20" stroke="url(#login-bracket-grad)" opacity="0.4" />
      </svg>

      {/* Orbiting dots */}
      <div className="absolute top-1 right-6 h-2 w-2 rounded-full bg-violet-400/60 animate-ping" style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-6 left-2 h-1.5 w-1.5 rounded-full bg-blue-400/50 animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-1 h-1 w-1 rounded-full bg-cyan-400/50 animate-ping" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
      <div className="absolute bottom-2 right-1/3 h-1.5 w-1.5 rounded-full bg-emerald-400/30 animate-pulse" style={{ animationDelay: '2s' }} />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const storeLogin = useAuthStore((state) => state.login);
  const loginAsGuest = useAuthStore((state) => state.loginAsGuest);
  const { theme, setTheme } = useTheme();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Clear any stale auth data that could interfere with the login request
    // (e.g., expired tokens, leftover guest mode state from previous sessions)
    localStorage.removeItem('user');
    localStorage.removeItem('cp_session_cache');

    setIsLoading(true);
    setShowOverlay(true);

    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const userData = await AuthService.login({
          username: formData.username.trim(),
          password: formData.password,
        });
        storeLogin(userData);
        router.push('/dashboard');
        return; // Success — exit
      } catch (err: any) {
        lastError = err;
        // Only retry on network/timeout errors, not on auth failures (4xx)
        const isRetryable = !err.response && attempt < maxRetries;
        if (isRetryable) {
          // Wait briefly before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
          continue;
        }
        break;
      }
    }

    setShowOverlay(false);
    // Extract error message — handle both MessageResponse and ErrorResponse formats
    const errMsg = lastError?.response?.data?.message
      || lastError?.backendMessage
      || lastError?.message
      || 'Invalid username or password. Please try again.';
    setError(errMsg);
    setIsLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    // Clear stale auth data before fresh login
    localStorage.removeItem('user');
    localStorage.removeItem('cp_session_cache');

    setIsLoading(true);
    setShowOverlay(true);
    setError('');

    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (credentialResponse.credential) {
          const userData = await AuthService.googleLogin(credentialResponse.credential);
          storeLogin(userData);
          router.push('/dashboard');
          return; // Success
        }
      } catch (err: any) {
        lastError = err;
        const isRetryable = !err.response && attempt < maxRetries;
        if (isRetryable) {
          await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
          continue;
        }
        break;
      }
    }

    setShowOverlay(false);
    const errMsg = lastError?.response?.data?.message
      || lastError?.backendMessage
      || lastError?.message
      || 'Google Sign In failed. Please try again.';
    setError(errMsg);
    setIsLoading(false);
  };

  const handleGoogleError = () => {
    setError('Google Sign In was unsuccessful. This may be caused by browser privacy settings or extensions blocking Google\'s authentication. Try disabling ad-blockers or using an incognito window.');
  };

  const handleGuestLogin = () => {
    setShowOverlay(true);
    loginAsGuest();
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 600);
  };

  const isDark = theme === 'dark';

  return (
    <>
      <LoadingOverlay isVisible={showOverlay} />

      <div className={`fixed inset-0 flex bg-white dark:bg-[#050510] overflow-hidden transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>

        {/* ═══ LEFT PANEL — Immersive Brand Showcase ═══ */}
        <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-zinc-50 dark:bg-[#050510]">
          {/* Animated mesh gradient background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'radial-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px)',
              backgroundSize: '32px 32px'
            }} />
            {/* Multi-layered animated orbs */}
            <div className="absolute top-[15%] left-[20%] h-[500px] w-[500px] rounded-full bg-violet-600/[0.08] blur-[180px] animate-pulse" />
            <div className="absolute bottom-[15%] right-[15%] h-[400px] w-[400px] rounded-full bg-blue-600/[0.07] blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-indigo-500/[0.05] blur-[120px] animate-pulse" style={{ animationDelay: '4s' }} />
          </div>

          <FloatingParticles />

          {/* Content */}
          <div className="relative flex flex-col justify-between w-full p-10">
            {/* Back to home */}
            <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-violet-400 transition-all duration-300 text-sm w-fit group">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="uppercase tracking-[0.2em] text-xs font-medium">Return to Home</span>
            </Link>

            {/* Center brand area */}
            <div className="flex flex-col items-center justify-center flex-1 gap-7">
              {/* Badge */}
              <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-violet-400/15 bg-violet-400/[0.06] backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                <span className="text-violet-600 dark:text-violet-300/90 text-[11px] font-semibold uppercase tracking-[0.2em]">Workspace</span>
              </div>

              {/* Brand name */}
              <div className="flex items-center gap-3.5">
                <Image src="/logo.png" alt="CodePulse" width={46} height={46} className="rounded-xl shadow-2xl shadow-violet-500/25 ring-1 ring-white/10" />
                <h1 className="text-[2.6rem] font-extrabold text-zinc-900 dark:text-white tracking-tight">CodePulse</h1>
              </div>

              {/* Animated visual */}
              <AnimatedCodeIcon />
            </div>

            {/* Testimonial */}
            <div className="space-y-4">
              <div className="h-px w-16 bg-gradient-to-r from-violet-500/40 to-transparent" />
              <p className="text-zinc-500 dark:text-zinc-400/90 text-[15px] leading-relaxed italic max-w-sm">
                &quot;The most seamless coding tracking experience we&apos;ve ever used. It feels like magic.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-violet-500/25 ring-2 ring-violet-400/20">
                  CP
                </div>
                <div>
                  <div className="text-zinc-900 dark:text-white text-sm font-semibold">CodePulse</div>
                  <div className="text-zinc-500 text-[11px] uppercase tracking-[0.15em]">Developer Platform</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT PANEL — Sign In Form ═══ */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          {/* Background decoration for mobile */}
          <div className="pointer-events-none absolute inset-0 lg:hidden">
            <div className="absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full bg-violet-500/[0.06] blur-[100px] animate-pulse" />
            <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-blue-500/[0.06] blur-[100px] animate-pulse" />
          </div>

          {/* Subtle gradient line on left edge (desktop only) */}
          <div className="hidden lg:block absolute left-0 top-[10%] bottom-[10%] w-px bg-gradient-to-b from-transparent via-violet-500/20 to-transparent" />

          {/* Theme toggle — top right */}
          <div className="absolute top-6 right-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="h-9 w-9 rounded-xl text-zinc-400 hover:text-violet-600 dark:text-zinc-500 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/[0.06] transition-all duration-200"
            >
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="h-4 w-4 hidden dark:block" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>

          <div className="relative w-full max-w-[420px] px-6 py-8">
            {/* Mobile logo (hidden on desktop) */}
            <div className="mb-6 flex flex-col items-center gap-1.5 lg:hidden">
              <div className="flex items-center gap-2">
                <Image src="/logo.png" alt="CodePulse" width={34} height={34} className="rounded-lg shadow-md" />
                <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-blue-400">CodePulse</span>
              </div>
              <p className="text-xs text-zinc-500">Track, Analyze & Master Your Coding Journey</p>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Welcome back</h2>
              <p className="text-muted-foreground mt-1.5 uppercase tracking-[0.15em] text-[11px] font-medium">Sign in to your account</p>
            </div>

            {/* Google Login — centered */}
            <div className="mb-5">
              <div className="flex justify-center w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  text="continue_with"
                  theme={isDark ? "filled_black" : "outline"}
                  size="large"
                  shape="rectangular"
                  width="380"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200 dark:border-zinc-800" /></div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[0.15em]">
                <span className="bg-white dark:bg-[#050510] px-4 text-zinc-500 font-medium">Or sign in with email</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div className="space-y-1.5">
                <Label htmlFor="login-username" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Username or Email</Label>
                <div className="relative group">
                  <Input
                    id="login-username"
                    name="login-username"
                    placeholder="name@company.com"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    autoComplete="username"
                    className="h-11 text-sm bg-zinc-50 dark:bg-white/[0.04] border-zinc-200 dark:border-zinc-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl transition-all duration-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 hover:border-zinc-300 dark:hover:border-zinc-700"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Password</Label>
                  <Link href="/forgot-password" className="text-[11px] text-violet-400 hover:text-violet-300 uppercase tracking-wider font-medium transition-colors">
                    Forgot?
                  </Link>
                </div>
                <div className="relative group">
                  <Input
                    id="login-password"
                    name="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    autoComplete="current-password"
                    className="h-11 pr-11 text-sm bg-zinc-50 dark:bg-white/[0.04] border-zinc-200 dark:border-zinc-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl transition-all duration-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 hover:border-zinc-300 dark:hover:border-zinc-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 animate-in slide-in-from-top-2">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 font-semibold text-sm uppercase tracking-wider bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300 border-0 hover:scale-[1.01]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">Signing in...</span>
                ) : (
                  <span className="flex items-center gap-2">Sign In <ArrowRight className="h-4 w-4" /></span>
                )}
              </Button>
            </form>

            {/* Guest Mode */}
            <button
              id="guest-login-btn"
              type="button"
              onClick={handleGuestLogin}
              className="group w-full flex items-center justify-center gap-2 mt-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-sm font-medium text-zinc-500 transition-all duration-300 hover:border-violet-400/40 hover:text-violet-400 hover:bg-violet-500/[0.04]"
            >
              <UserCircle2 className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              Continue as Guest
            </button>

            {/* Footer link */}
            <p className="text-sm text-zinc-500 mt-5 text-center">
              New user?{' '}
              <Link href="/register" className="font-semibold text-violet-400 hover:underline transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </div>

      </div>

      {/* Inline keyframes for custom animations */}
      <style jsx>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.7; }
          50% { transform: translateY(-40px) translateX(-5px); opacity: 0.4; }
          75% { transform: translateY(-20px) translateX(15px); opacity: 0.8; }
        }
        .animate-float-particle { animation: float-particle 8s ease-in-out infinite; }
        @keyframes spin-very-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-very-slow { animation: spin-very-slow 30s linear infinite; }
        @keyframes spin-reverse-slow { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        .animate-spin-reverse-slow { animation: spin-reverse-slow 25s linear infinite; }
      `}</style>
    </>
  );
}