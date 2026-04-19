"use client"

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AuthService } from '@/lib/api/auth.service';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const out = await AuthService.forgotPassword({ email });
      setResetToken(out.resetToken || '');
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
              <CheckCircle2 className="h-12 w-12 text-primary" />
              <p className="text-center font-medium">Reset instructions sent!</p>
              <p className="text-center text-sm text-muted-foreground">
                An email has been sent to <strong>{email}</strong> with instructions to reset your password.
              </p>
              
              {resetToken && (
                <div className="mt-6 p-4 border rounded-lg bg-orange-50 dark:bg-orange-950/20 text-orange-800 dark:text-orange-200 text-sm">
                  <p className="font-semibold mb-2">Demo Environment Notice:</p>
                  <p>Because this is a demo environment, no actual email is sent. You can click the button below to simulate opening the link from the email.</p>
                  <Link href={`/reset-password?token=${resetToken}`} className="mt-4 block">
                    <Button variant="outline" className="w-full border-orange-200 dark:border-orange-800">
                      Simulate opening email link
                    </Button>
                  </Link>
                </div>
              )}
              
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
                  placeholder="name@example.com"
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
