"use client"

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthService } from '@/lib/api/auth.service';
import { useAuthStore } from '@/lib/store/auth.store';
import { Eye, EyeOff, Check, X, ArrowRight, Mail, Lock, User, AtSign, ShieldCheck, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { GoogleLogin } from '@react-oauth/google';
import CaptchaBox, { type CaptchaHandle } from '@/components/CaptchaBox';

type Step = 'form' | 'otp';

export default function RegisterPage() {
  const router = useRouter();
  const storeLogin = useAuthStore((state) => state.login);
  const [step, setStep] = useState<Step>('form');
  const [formData, setFormData] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const captchaRef = useRef<CaptchaHandle>(null);

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

    if (!captchaVerified) {
      setError('Please complete the security captcha first.');
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
      captchaRef.current?.reset();
      setCaptchaVerified(false);
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

      router.push('/login');
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

    setError(lastError?.response?.data?.message || lastError?.message || 'Google Sign In failed. Please try again.');
    setIsLoading(false);
  }

  const handleGoogleError = () => {
    setError('Google Sign In was unsuccessful. This may be caused by browser privacy settings or extensions blocking Google\'s authentication. Try disabling ad-blockers or using an incognito window.');
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-[400px] w-[400px] rounded-full bg-violet-500/[0.06] blur-[100px] animate-pulse" />
        <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-blue-500/[0.06] blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative w-full max-w-[440px] px-4">
        {/* Logo */}
        <div className="mb-5 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="CodePulse" width={34} height={34} className="rounded-lg shadow-md" />
            <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-blue-600 dark:from-violet-400 dark:to-blue-400">CodePulse</span>
          </div>
          <p className="text-xs text-muted-foreground">Track, Analyze & Master Your Coding Journey</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-200/60 dark:border-white/[0.06] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl shadow-violet-500/[0.03] p-6">

          {step === 'form' ? (
            <>
              <div className="text-center mb-4">
                <h1 className="text-xl font-bold tracking-tight">Create an account</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Enter your information to get started</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} className="space-y-2.5" autoComplete="off">
                {/* Row: Name + Username */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="reg-name" className="text-xs font-medium">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                      <Input id="reg-name" name="reg-name" placeholder="John Doe" value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })} required autoComplete="off"
                        className="pl-8 h-9 text-sm border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-violet-500/20" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="reg-username" className="text-xs font-medium">Username</Label>
                    <div className="relative">
                      <AtSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                      <Input id="reg-username" name="reg-username" placeholder="developer123" value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })} required autoComplete="off"
                        className="pl-8 h-9 text-sm border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-violet-500/20" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reg-email" className="text-xs font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                    <Input id="reg-email" name="reg-email" type="email" placeholder="john@gmail.com" value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })} required autoComplete="off"
                      className="pl-8 h-9 text-sm border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-violet-500/20" />
                  </div>
                </div>

                {/* Row: Password + Confirm */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="reg-password" className="text-xs font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                      <Input id="reg-password" name="reg-password" type={showPassword ? "text" : "password"} placeholder="Min 6 chars"
                        value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required autoComplete="new-password"
                        className="pl-8 pr-8 h-9 text-sm border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-violet-500/20" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="reg-confirm-password" className="text-xs font-medium">Confirm</Label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                      <Input id="reg-confirm-password" name="reg-confirm-password" type={showConfirmPassword ? "text" : "password"} placeholder="Re-enter"
                        value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required autoComplete="new-password"
                        className="pl-8 pr-8 h-9 text-sm border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-violet-500/20" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                        {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password checks */}
                {formData.password.length > 0 && (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 px-0.5">
                    {[
                      { key: 'length' as const, label: '6+ characters' },
                      { key: 'letter' as const, label: 'Has letter' },
                      { key: 'number' as const, label: 'Has number' },
                      { key: 'special' as const, label: 'Special char' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-1 text-[11px]">
                        {passwordChecks[key] ? <Check className="h-3 w-3 text-emerald-500 shrink-0" /> : <X className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
                        <span className={passwordChecks[key] ? 'text-emerald-500' : 'text-muted-foreground/60'}>{label}</span>
                      </div>
                    ))}
                  </div>
                )}

                <CaptchaBox ref={captchaRef} onVerify={(v) => { setCaptchaVerified(v); if (v) setError(''); }} className="my-0.5" />

                {error && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20 px-3 py-2">
                    <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <Button type="submit" disabled={otpSending}
                  className="w-full h-10 font-semibold bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300 border-0">
                  {otpSending ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Sending OTP...</span>
                  ) : (
                    <span className="flex items-center gap-2">Verify Email & Sign Up <ArrowRight className="h-3.5 w-3.5" /></span>
                  )}
                </Button>
              </form>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200 dark:border-zinc-700" /></div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                  <span className="bg-white dark:bg-zinc-900 px-3 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="flex justify-center w-full">
                <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} text="signup_with" theme="outline" size="large" shape="rectangular" width="100%" />
              </div>

              <p className="text-center text-xs text-muted-foreground mt-3">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-violet-600 dark:text-violet-400 hover:underline transition-colors">Sign in</Link>
              </p>
            </>
          ) : (
            /* OTP Verification Step */
            <>
              <div className="text-center mb-6">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 dark:from-violet-500/20 dark:to-blue-500/20 flex items-center justify-center mb-4">
                  <ShieldCheck className="h-7 w-7 text-violet-600 dark:text-violet-400" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">Verify your email</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  We sent a 6-digit code to <span className="font-medium text-foreground">{formData.email}</span>
                </p>
              </div>

              {/* OTP Input Boxes */}
              <div className="flex justify-center gap-2.5 mb-4" onPaste={handleOtpPaste}>
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
                    className="w-11 h-12 text-center text-xl font-bold rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-foreground focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all duration-200"
                  />
                ))}
              </div>

              {/* Timer */}
              <div className="text-center text-xs text-muted-foreground mb-4">
                {otpTimer > 0 ? (
                  <span>Code expires in <span className="font-medium text-foreground">{formatTime(otpTimer)}</span></span>
                ) : (
                  <span className="text-red-500">OTP expired</span>
                )}
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20 px-3 py-2 mb-3">
                  <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <Button onClick={handleVerifyAndRegister} disabled={isLoading || otpValues.join('').length !== 6}
                className="w-full h-10 font-semibold bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-500/20 transition-all duration-300 border-0">
                {isLoading ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</span>
                ) : (
                  <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Verify & Create Account</span>
                )}
              </Button>

              <div className="flex items-center justify-between mt-4 text-xs">
                <button onClick={() => { setStep('form'); setError(''); }} className="text-muted-foreground hover:text-foreground transition-colors">
                  ← Back to form
                </button>
                <button onClick={handleResendOtp} disabled={otpSending || otpTimer > 540}
                  className="text-violet-600 dark:text-violet-400 hover:underline disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  {otpSending ? 'Sending...' : 'Resend OTP'}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground/50">
          © 2026 CodePulse. Built for developers, by developers.
        </p>
      </div>
    </div>
  );
}
