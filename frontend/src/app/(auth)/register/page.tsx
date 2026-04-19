"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AuthService } from '@/lib/api/auth.service';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const generatedUsername = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 10000);
      
      await AuthService.register({
        name: formData.name,
        email: formData.email,
        username: generatedUsername,
        password: formData.password
      });
      router.push('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      await AuthService.googleDemo();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google Sign In failed.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
          <CardDescription>Enter your information to get started with CodePulse</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          
          <Button variant="outline" type="button" className="w-full gap-2" onClick={handleGoogleSignIn}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path d="M12.0003 4.75001C13.7703 4.75001 15.3563 5.36001 16.6053 6.54901L20.0303 3.12601C17.9503 1.19201 15.2353 0 12.0003 0C7.31028 0 3.25528 2.69001 1.25028 6.60701L5.32228 9.77101C6.27628 6.74501 9.12328 4.75001 12.0003 4.75001Z" fill="#EA4335" />
              <path d="M23.4903 12.275C23.4903 11.49 23.4153 10.73 23.2853 10H12.0003V14.51H18.4703C18.1803 16.1 17.2103 17.439 15.8903 18.319L19.8653 21.4C22.2053 19.249 23.4903 16.039 23.4903 12.275Z" fill="#4285F4" />
              <path d="M5.32132 14.2289C5.07132 13.4869 4.94132 12.7219 4.94132 11.9999C4.94132 11.2779 5.07132 10.5129 5.32132 9.77094L1.24932 6.60693C0.463319 8.16393 0.000318857 9.99994 0.000318857 11.9999C0.000318857 13.9999 0.463319 15.8359 1.25032 17.3929L5.32132 14.2289Z" fill="#FBBC05" />
              <path d="M12.0003 24.0001C15.2353 24.0001 17.9653 22.9351 19.8653 21.4001L15.8903 18.3201C14.8503 19.0111 13.5413 19.4501 12.0003 19.4501C9.12328 19.4501 6.27628 17.4561 5.32228 14.4301L1.25028 17.5941C3.25528 21.5111 7.31028 24.0001 12.0003 24.0001Z" fill="#34A853" />
            </svg>
            Sign up with Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-sm">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
