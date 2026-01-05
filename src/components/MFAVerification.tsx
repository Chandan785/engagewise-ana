import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield, Loader2 } from 'lucide-react';

interface MFAVerificationProps {
  factorId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const MFAVerification = ({ factorId, onSuccess, onCancel }: MFAVerificationProps) => {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Invalid code',
        description: 'Please enter a 6-digit verification code.',
      });
      return;
    }

    setIsVerifying(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) throw verifyError;

      onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Verification failed',
        description: error.message === 'Invalid TOTP code entered'
          ? 'Invalid code. Please check your authenticator app and try again.'
          : error.message,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="glass w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="font-display">Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app to continue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mfa-code">Verification code</Label>
          <Input
            id="mfa-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && code.length === 6) {
                handleVerify();
              }
            }}
            className="text-center text-2xl tracking-[0.5em] font-mono"
            autoFocus
          />
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            disabled={isVerifying || code.length !== 6}
            className="flex-1 bg-gradient-primary hover:opacity-90"
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MFAVerification;
