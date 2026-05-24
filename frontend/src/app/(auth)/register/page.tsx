"use client"

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthService } from '@/lib/api/auth.service';
import { useAuthStore } from '@/lib/store/auth.store';
import { Eye, EyeOff, Check, X, ArrowRight, ShieldCheck, Loader2, ArrowLeft, Users, Sun, Moon } from 'lucide-react';
import Image from 'next/image';
import { GoogleLogin } from '@react-oauth/google';
import { useTheme } from 'next-themes';

type Step = 'form' | 'otp';

export default function RegisterPage() {
  const router = useRouter();
  const storeLogin = useAuthStore((state) => state.login);
  const { theme, setTheme } = useTheme();
  const [step, setStep] = useState<Step>('form');
  const [formData, setFormData] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // OTP state
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpSending, setOtpSending] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const passwordChecks = {
    length: formData.password.length >= 6,
    letter: /[a-zA-Z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(formData.password),
  };
  const allPasswordChecksPassed = Object.values(passwordChecks).every(Boolean);

  // OTP countdown timer
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => setOtpTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleSendOtp = async () => {
    setError('');

    if (!formData.email.toLowerCase().endsWith('@gmail.com')) {
      setError('Only Gmail addresses (@gmail.com) are allowed for registration.');
      return;
    }

    if (!allPasswordChecksPassed) {
      setError('Password must be at least 6 characters and contain a letter, a number, and a special character.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setOtpSending(true);
    try {
      await AuthService.sendOtp({ email: formData.email, name: formData.name });
      setStep('otp');
      setOtpTimer(600); // 10 min
      setOtpValues(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpValues];
    newOtp[index] = value.slice(-1);
    setOtpValues(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otpValues];
    pasted.split('').forEach((ch, i) => { if (i < 6) newOtp[i] = ch; });
    setOtpValues(newOtp);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerifyAndRegister = async () => {
    setError('');
    const otp = otpValues.join('');
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Verify OTP
      await AuthService.verifyOtp({ email: formData.email, otp });

      // Step 2: Register user
      await AuthService.register({
        name: formData.name,
        email: formData.email,
        username: formData.username,
        password: formData.password,
      });

      // Step 3: Auto-login and go straight to dashboard
      const userData = await AuthService.login({
        username: formData.username,
        password: formData.password,
      });
      storeLogin(userData);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 540) return; // Prevent spam — wait at least 60s
    setError('');
    setOtpSending(true);
    try {
      await AuthService.sendOtp({ email: formData.email, name: formData.name });
      setOtpTimer(600);
      setOtpValues(['', '', '', '', '', '']);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to resend OTP.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    // Clear stale auth data before fresh login
    localStorage.removeItem('user');
    localStorage.removeItem('cp_session_cache');

    setIsLoading(true);
    setError('');

    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (credentialResponse.credential) {
          const userData = await AuthService.googleLogin(credentialResponse.credential);
          storeLogin(userData);
          router.push('/dashboard');
          return;
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

    const errMsg = lastError?.response?.data?.message
      || lastError?.backendMessage
      || lastError?.message
      || 'Google Sign In failed. Please try again.';
    setError(errMsg);
    setIsLoading(false);
  }

  const handleGoogleError = () => {
    setError('Google Sign In was unsuccessful. This may be caused by browser privacy settings or extensions blocking Google\'s authentication. Try disabling ad-blockers or using an incognito window.');
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 flex bg-white dark:bg-[#050510] overflow-hidden">

      {/* ═══ LEFT PANEL — Form ═══ */}
      <div className="flex-1 flex items-center justify-center relative overflow-y-auto">
        {/* Theme toggle — top left */}
        <div className="absolute top-6 left-6 z-10">
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
        {/* Light mode background decoration */}
        <div className="pointer-events-none absolute inset-0 lg:hidden">
          <div className="absolute -top-32 -left-32 h-[400px] w-[400px] rounded-full bg-violet-500/[0.06] blur-[100px] animate-pulse" />
          <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-blue-500/[0.06] blur-[100px] animate-pulse" />
        </div>

        <div className="relative w-full max-w-[440px] px-6 py-8">
          {/* Mobile logo (hidden on desktop) */}
          <div className="mb-5 flex flex-col items-center gap-1.5 lg:hidden">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="CodePulse" width={34} height={34} className="rounded-lg shadow-md" />
              <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-blue-400">CodePulse</span>
            </div>
            <p className="text-xs text-zinc-500">Track, Analyze & Master Your Coding Journey</p>
          </div>

          {step === 'form' ? (
            <>
              <div className="mb-4">
                <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Create Account</h2>
                <p className="text-zinc-500 mt-1 uppercase tracking-[0.15em] text-[11px] font-medium">Enter your information to get started</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} className="space-y-3" autoComplete="off">
                {/* Name & Username row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="reg-name" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Full Name</Label>
                    <Input id="reg-name" name="reg-name" placeholder="John Doe" value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} required autoComplete="off"
                      className="h-10 text-sm bg-zinc-50 dark:bg-white/[0.04] border-zinc-200 dark:border-zinc-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="reg-username" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Username</Label>
                    <Input id="reg-username" name="reg-username" placeholder="developer123" value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })} required autoComplete="off"
                      className="h-10 text-sm bg-zinc-50 dark:bg-white/[0.04] border-zinc-200 dark:border-zinc-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700" />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <Label htmlFor="reg-email" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Email</Label>
                  <Input id="reg-email" name="reg-email" type="email" placeholder="name@gmail.com" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} required autoComplete="off"
                    className="h-10 text-sm bg-zinc-50 dark:bg-white/[0.04] border-zinc-200 dark:border-zinc-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700" />
                </div>

                {/* Password & Confirm row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="reg-password" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Password</Label>
                    <div className="relative">
                      <Input id="reg-password" name="reg-password" type={showPassword ? "text" : "password"} placeholder="Min 6 chars"
                        value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required autoComplete="new-password"
                        className="h-10 pr-10 text-sm bg-zinc-50 dark:bg-white/[0.04] border-zinc-200 dark:border-zinc-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl placeholder:text-zinc-400 dark:placeholder:text-zinc-600" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors" tabIndex={-1}>
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="reg-confirm-password" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Confirm</Label>
                    <div className="relative">
                      <Input id="reg-confirm-password" name="reg-confirm-password" type={showConfirmPassword ? "text" : "password"} placeholder="Re-enter"
                        value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required autoComplete="new-password"
                        className="h-10 pr-10 text-sm bg-zinc-50 dark:bg-white/[0.04] border-zinc-200 dark:border-zinc-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl placeholder:text-zinc-400 dark:placeholder:text-zinc-600" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors" tabIndex={-1}>
                        {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password checks */}
                {formData.password.length > 0 && (
                  <div className="grid grid-cols-4 gap-x-3 gap-y-0.5 px-1">
                    {[
                      { key: 'length' as const, label: '6+ chars' },
                      { key: 'letter' as const, label: 'Letter' },
                      { key: 'number' as const, label: 'Number' },
                      { key: 'special' as const, label: 'Special' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-1 text-[10px]">
                        {passwordChecks[key] ? <Check className="h-2.5 w-2.5 text-emerald-500 shrink-0" /> : <X className="h-2.5 w-2.5 text-zinc-600 shrink-0" />}
                        <span className={passwordChecks[key] ? 'text-emerald-500' : 'text-zinc-600'}>{label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5">
                    <p className="text-xs text-red-400">{error}</p>
                  </div>
                )}

                <Button type="submit" disabled={otpSending}
                  className="w-full h-11 font-semibold text-sm uppercase tracking-wider bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300 border-0 hover:scale-[1.01]">
                  {otpSending ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Sending OTP...</span>
                  ) : (
                    <span className="flex items-center gap-2">Verify Email & Sign Up <ArrowRight className="h-4 w-4" /></span>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200 dark:border-zinc-800" /></div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-[0.15em]">
                  <span className="bg-white dark:bg-[#050510] px-4 text-zinc-500 font-medium">Or continue with</span>
                </div>
              </div>

              <div className="flex justify-center w-full">
                <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} text="signup_with" theme={isDark ? "filled_black" : "outline"} size="large" shape="rectangular" width="380" />
              </div>

              <p className="text-sm text-zinc-500 mt-4">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-violet-400 hover:underline transition-colors">Sign in</Link>
              </p>
            </>
          ) : (
            /* ═══ OTP Verification Step ═══ */
            <>
              <div className="text-center mb-6">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center mb-4 border border-violet-500/10">
                  <ShieldCheck className="h-7 w-7 text-violet-400" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Verify your email</h2>
                <p className="text-sm text-zinc-500 mt-2">
                  We sent a 6-digit code to <span className="font-medium text-zinc-900 dark:text-white">{formData.email}</span>
                </p>
              </div>

              {/* OTP Input Boxes */}
              <div className="flex justify-center gap-3 mb-5" onPaste={handleOtpPaste}>
                {otpValues.map((val, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-white/[0.04] text-foreground focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all duration-200"
                  />
                ))}
              </div>

              {/* Timer */}
              <div className="text-center text-xs text-muted-foreground mb-5">
                {otpTimer > 0 ? (
                  <span>Code expires in <span className="font-semibold text-foreground">{formatTime(otpTimer)}</span></span>
                ) : (
                  <span className="text-red-500 font-medium">OTP expired</span>
                )}
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20 px-4 py-3 mb-4">
                  <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <Button onClick={handleVerifyAndRegister} disabled={isLoading || otpValues.join('').length !== 6}
                className="w-full h-12 font-semibold text-sm uppercase tracking-wider bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300 border-0 hover:scale-[1.01]">
                {isLoading ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</span>
                ) : (
                  <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Verify & Create Account</span>
                )}
              </Button>

              <div className="flex items-center justify-between mt-5 text-xs">
                <button onClick={() => { setStep('form'); setError(''); }} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" /> Back to form
                </button>
                <button onClick={handleResendOtp} disabled={otpSending || otpTimer > 540}
                  className="text-violet-600 dark:text-violet-400 hover:underline disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium">
                  {otpSending ? 'Sending...' : 'Resend OTP'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══ RIGHT PANEL — Immersive Brand Showcase ═══ */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-zinc-50 dark:bg-[#050510]">
        {/* Animated mesh gradient */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }} />
          <div className="absolute top-[15%] right-[20%] h-[500px] w-[500px] rounded-full bg-violet-600/[0.08] blur-[180px] animate-pulse" />
          <div className="absolute bottom-[15%] left-[15%] h-[400px] w-[400px] rounded-full bg-blue-600/[0.07] blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-indigo-500/[0.05] blur-[120px] animate-pulse" style={{ animationDelay: '4s' }} />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="absolute rounded-full" style={{
              width: `${2 + Math.random() * 3}px`, height: `${2 + Math.random() * 3}px`,
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              background: `hsla(${250 + Math.random() * 40}, 80%, 70%, ${0.15 + Math.random() * 0.2})`,
              animation: `float-particle ${6 + Math.random() * 10}s ease-in-out infinite ${Math.random() * 5}s`,
            }} />
          ))}
        </div>

        {/* Content */}
        <div className="relative flex flex-col justify-between w-full p-10">
          {/* Top badge */}
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-violet-400/15 bg-violet-400/[0.06] backdrop-blur-sm">
              <Users className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-violet-300/90 text-[11px] font-semibold uppercase tracking-[0.2em]">Community</span>
            </div>
          </div>

          {/* Center */}
          <div className="flex flex-col items-center justify-center flex-1 gap-7">
            <h2 className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Join Us</h2>

            {/* Animated visual with rotating rings */}
            <div className="relative w-52 h-52 flex items-center justify-center">
              <div className="absolute inset-0 rounded-[2rem] border border-violet-400/10" style={{ animation: 'spin 30s linear infinite' }} />
              <div className="absolute inset-2 rounded-[1.6rem] border border-blue-400/[0.07]" style={{ animation: 'spin 25s linear infinite reverse' }} />
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/15 via-blue-500/10 to-cyan-400/15 blur-[60px] rounded-full animate-pulse" />
              <div className="absolute inset-4 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.06] shadow-2xl" />

              <svg className="relative h-28 w-28 drop-shadow-[0_0_50px_rgba(139,92,246,0.4)]" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <linearGradient id="reg-bracket-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="50%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#60a5fa" />
                  </linearGradient>
                </defs>
                <polyline points="16 18 22 12 16 6" stroke="url(#reg-bracket-grad)" />
                <polyline points="8 6 2 12 8 18" stroke="url(#reg-bracket-grad)" />
              </svg>

              <div className="absolute top-1 right-6 h-2 w-2 rounded-full bg-violet-400/60 animate-ping" style={{ animationDuration: '3s' }} />
              <div className="absolute bottom-6 left-2 h-1.5 w-1.5 rounded-full bg-blue-400/50 animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
              <div className="absolute top-1/2 right-1 h-1 w-1 rounded-full bg-cyan-400/50 animate-ping" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
            </div>
          </div>

          {/* Bottom testimonial */}
          <div className="space-y-4">
            <div className="h-px w-16 bg-gradient-to-r from-violet-500/40 to-transparent mx-auto" />
            <p className="text-zinc-400/90 text-[15px] leading-relaxed italic max-w-sm mx-auto text-center">
              &quot;Unleash your potential with real-time coding analytics and intelligent tracking tools.&quot;
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="text-right">
                <div className="text-zinc-900 dark:text-white text-sm font-semibold">CodePulse</div>
                <div className="text-zinc-500 text-[11px] uppercase tracking-[0.15em]">Developer Platform</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-violet-500/25 ring-2 ring-violet-400/20">
                CP
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.7; }
          50% { transform: translateY(-40px) translateX(-5px); opacity: 0.4; }
          75% { transform: translateY(-20px) translateX(15px); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
