"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, Mail, Code2, Clock, RefreshCw } from 'lucide-react';
import { AuthService } from '@/lib/api/auth.service';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer to prevent spamming
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await AuthService.forgotPassword({ email });
      setIsSuccess(true);
      setCooldown(60); // 60-second cooldown before allowing resend
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setIsLoading(true);
    try {
      await AuthService.forgotPassword({ email });
      setCooldown(60);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to resend. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
            <Code2 className="h-8 w-8" />
            <span className="text-2xl font-bold tracking-tight">CodePulse</span>
          </div>
          <p className="text-sm text-muted-foreground">Track, Analyze & Master Your Coding Journey</p>
        </div>

        <Card className="border-border/50 shadow-xl backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="text-2xl font-bold tracking-tight">Forgot Password</CardTitle>
            <CardDescription>Enter your email address to receive a reset link</CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-4">
                <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-center font-semibold text-zinc-900 dark:text-white text-lg">Check your inbox!</p>
                <p className="text-center text-sm text-muted-foreground leading-relaxed">
                  We&apos;ve sent a password reset link to <strong className="text-zinc-700 dark:text-zinc-300">{email}</strong>. Please check your email and click the link to reset your password.
                </p>
                
                <div className="w-full mt-4 p-4 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.02] space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-violet-500" />
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Important</span>
                  </div>
                  <ul className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1.5 pl-6 list-disc">
                    <li>Email may take <strong>up to 5 minutes</strong> to arrive</li>
                    <li>Check your <strong>spam/junk folder</strong> if you don&apos;t see it</li>
                    <li>The link expires in <strong>1 hour</strong></li>
                    <li><strong>Don&apos;t request multiple times</strong> — wait for the email to arrive</li>
                  </ul>
                </div>

                {/* Resend button with cooldown */}
                <div className="w-full mt-2 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleResend}
                    disabled={cooldown > 0 || isLoading}
                  >
                    {cooldown > 0 ? (
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Resend available in {cooldown}s
                      </span>
                    ) : isLoading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Resending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Resend Email
                      </span>
                    )}
                  </Button>
                  <Link href="/login" className="block w-full">
                    <Button className="w-full">Go to Login</Button>
                  </Link>
                </div>

                {error && (
                  <p className="text-sm text-destructive mt-2">{error}</p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                {error && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                <Button type="submit" className="w-full font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-primary/25" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 text-center text-sm pt-2">
            {!isSuccess && (
              <Link href="/login" className="flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
              </Link>
            )}
          </CardFooter>
        </Card>

        {/* Bottom subtle branding */}
        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          © 2026 CodePulse. Built for developers, by developers.
        </p>
      </div>
    </div>
  );
}
