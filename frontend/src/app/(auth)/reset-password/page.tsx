"use client"

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, CheckCircle2, ShieldCheck, XCircle, AlertTriangle, Loader2, Check, X } from 'lucide-react';
import Image from 'next/image';
import { AuthService } from '@/lib/api/auth.service';

type PageState = 'loading' | 'valid' | 'expired' | 'success';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  const [pageState, setPageState] = useState<PageState>('loading');
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [expiredMessage, setExpiredMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Validate token on page load
  useEffect(() => {
    if (!token) {
      setExpiredMessage('Invalid or missing reset token. Please request a new password reset link.');
      setPageState('expired');
      return;
    }

    const validateToken = async () => {
      try {
        await AuthService.validateResetToken(token);
        setPageState('valid');
      } catch (err: any) {
        const message = err.response?.data?.message || err.message || 'This reset link is no longer valid.';
        setExpiredMessage(message);
        setPageState('expired');
      }
    };

    validateToken();
  }, [token]);

  const passwordChecks = {
    length: formData.newPassword.length >= 6,
    letter: /[a-zA-Z]/.test(formData.newPassword),
    number: /[0-9]/.test(formData.newPassword),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(formData.newPassword),
  };
  const allPasswordChecksPassed = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError('');

    if (!allPasswordChecksPassed) {
      setError('Password must be at least 6 characters and contain a letter, a number, and a special character.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      await AuthService.resetPassword({ token, newPassword: formData.newPassword });
      setPageState('success');
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Something went wrong.';
      if (message.toLowerCase().includes('invalid') || message.toLowerCase().includes('expired')) {
        setExpiredMessage('This reset link has already been used or has expired. Please request a new password reset.');
        setPageState('expired');
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Loading state ---
  const renderLoading = () => (
    <Card className="border-border/50 shadow-xl backdrop-blur-sm">
      <CardContent className="py-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Verifying your reset link...</p>
        </div>
      </CardContent>
    </Card>
  );

  // --- Expired / already used state ---
  const renderExpired = () => (
    <Card className="border-border/50 shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight">Link Expired</CardTitle>
        <CardDescription>This reset link is no longer active</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center space-y-4 py-4">
          <div className="rounded-full bg-amber-500/10 p-4">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
          </div>
          <div className="space-y-2 text-center">
            <p className="text-sm text-muted-foreground max-w-xs">
              {expiredMessage || 'This password reset link has already been used or has expired.'}
            </p>
          </div>
          <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 w-full">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Why did this happen?</p>
                <p>For your security, each reset link can only be used once and expires after 1 hour. If you still need to reset your password, please request a new link.</p>
              </div>
            </div>
          </div>
          <Link href="/forgot-password" className="w-full mt-2">
            <Button className="w-full font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-primary/25">
              Request New Reset Link
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  // --- Success state ---
  const renderSuccess = () => (
    <Card className="border-border/50 shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight">All Done!</CardTitle>
        <CardDescription>Your password has been updated</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center space-y-4 py-6">
          <div className="rounded-full bg-emerald-500/10 p-4">
            <ShieldCheck className="h-12 w-12 text-emerald-500" />
          </div>
          <div className="space-y-2 text-center">
            <p className="text-lg font-semibold text-foreground">
              Password Reset Successful!
            </p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your password has been changed successfully. You can now close this page and sign in with your new password.
            </p>
          </div>
          <div className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 w-full">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">What&apos;s next?</p>
                <p>This reset link has been deactivated for your security. Head over to the login page whenever you&apos;re ready.</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // --- Form state ---
  const renderForm = () => (
    <Card className="border-border/50 shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight">Set New Password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Min 6 chars, letter, number & special"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                required
                minLength={6}
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
            {/* Password strength checklist */}
            {formData.newPassword.length > 0 && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1.5 px-1">
                {[
                  { key: 'length' as const, label: 'At least 6 characters' },
                  { key: 'letter' as const, label: 'Contains a letter' },
                  { key: 'number' as const, label: 'Contains a number' },
                  { key: 'special' as const, label: 'Special character' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-1.5 text-xs">
                    {passwordChecks[key] ? (
                      <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                    )}
                    <span className={passwordChecks[key] ? 'text-emerald-500' : 'text-muted-foreground/70'}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                minLength={6}
                className="pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}
          
          <Button
            type="submit"
            className="w-full font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
            disabled={isLoading}
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="relative w-full max-w-md">
      {/* Logo / Brand */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-primary">
          <Image src="/logo.png" alt="CodePulse" width={32} height={32} className="rounded-md" />
          <span className="text-2xl font-bold tracking-tight">CodePulse</span>
        </div>
        <p className="text-sm text-muted-foreground">Track, Analyze & Master Your Coding Journey</p>
      </div>

      {pageState === 'loading' && renderLoading()}
      {pageState === 'expired' && renderExpired()}
      {pageState === 'valid' && renderForm()}
      {pageState === 'success' && renderSuccess()}

      {/* Bottom subtle branding */}
      <p className="mt-6 text-center text-xs text-muted-foreground/60">
        © 2026 CodePulse. Built for developers, by developers.
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      {/* Decorative floating elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
