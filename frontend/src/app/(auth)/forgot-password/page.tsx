"use client"

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { AuthService } from '@/lib/api/auth.service';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await AuthService.forgotPassword({ email });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
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
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tips</span>
                </div>
                <ul className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1.5 pl-6 list-disc">
                  <li>The link expires in <strong>1 hour</strong></li>
                  <li>Check your <strong>spam/junk folder</strong> if you don&apos;t see it</li>
                  <li>Make sure you entered the correct email address</li>
                </ul>
              </div>

              <Link href="/login" className="mt-4 block w-full">
                <Button className="w-full mt-2">Go to Login</Button>
              </Link>
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
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-sm">
          {!isSuccess && (
            <Link href="/login" className="flex items-center justify-center text-muted-foreground hover:text-primary">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
