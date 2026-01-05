import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, Activity, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      }
      setIsChecking(false);
    };

    // Listen for auth state changes (password recovery flow)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
        setIsChecking(false);
      }
    });

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Password reset failed',
        description: error.message,
      });
    } else {
      setIsSuccess(true);
      toast({
        title: 'Password updated!',
        description: 'Your password has been successfully reset.',
      });
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-gradient-hero flex flex-col">
        <header className="container py-6">
          <Link to="/auth" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to login</span>
          </Link>
        </header>

        <div className="flex-1 flex items-center justify-center px-4 pb-12">
          <Card className="glass shadow-lg w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-2xl">Invalid or Expired Link</CardTitle>
              <CardDescription>
                This password reset link is invalid or has expired. Please request a new one.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-gradient-primary">
                <Link to="/auth">Back to Login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-hero flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4 pb-12">
          <Card className="glass shadow-lg w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <CardTitle className="font-display text-2xl">Password Reset Complete</CardTitle>
              <CardDescription>
                Your password has been successfully updated. Redirecting to dashboard...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <header className="container py-6">
        <Link to="/auth" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to login</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Activity className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold text-foreground">
              Engagement<span className="text-gradient">Analyzer</span>
            </span>
          </div>

          <Card className="glass shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="font-display text-2xl">Set New Password</CardTitle>
              <CardDescription>
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(handleResetPassword)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...form.register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...form.register('confirmPassword')}
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90 transition-opacity" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;