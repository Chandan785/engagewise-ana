import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  ShieldCheck, 
  ShieldOff, 
  Loader2, 
  Copy, 
  Check,
  Smartphone
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TwoFactorSetupProps {
  onStatusChange?: (enabled: boolean) => void;
}

const TwoFactorSetup = ({ onStatusChange }: TwoFactorSetupProps) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [factorId, setFactorId] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      const verifiedTOTP = data.totp.find(factor => factor.status === 'verified');
      setIsEnabled(!!verifiedTOTP);
      if (verifiedTOTP) {
        setFactorId(verifiedTOTP.id);
      }
    } catch (error: any) {
      console.error('Error checking MFA status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setShowSetupDialog(true);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to start 2FA setup',
        description: error.message,
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
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
        code: verificationCode,
      });

      if (verifyError) throw verifyError;

      setIsEnabled(true);
      setShowSetupDialog(false);
      setVerificationCode('');
      onStatusChange?.(true);

      toast({
        title: '2FA enabled!',
        description: 'Two-factor authentication has been successfully enabled.',
      });
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

  const handleDisable = async () => {
    if (disableCode.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Invalid code',
        description: 'Please enter a 6-digit verification code to disable 2FA.',
      });
      return;
    }

    setIsDisabling(true);
    try {
      // First verify the code
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: disableCode,
      });

      if (verifyError) throw verifyError;

      // Then unenroll
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (unenrollError) throw unenrollError;

      setIsEnabled(false);
      setShowDisableDialog(false);
      setDisableCode('');
      setFactorId('');
      onStatusChange?.(false);

      toast({
        title: '2FA disabled',
        description: 'Two-factor authentication has been disabled.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to disable 2FA',
        description: error.message === 'Invalid TOTP code entered'
          ? 'Invalid code. Please check your authenticator app and try again.'
          : error.message,
      });
    } finally {
      setIsDisabling(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <Card className="glass">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account using an authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isEnabled ? (
                <>
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">2FA is enabled</p>
                    <p className="text-sm text-muted-foreground">
                      Your account is protected with two-factor authentication.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <ShieldOff className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">2FA is not enabled</p>
                    <p className="text-sm text-muted-foreground">
                      Enable two-factor authentication for enhanced security.
                    </p>
                  </div>
                </>
              )}
            </div>

            {isEnabled ? (
              <Button 
                variant="outline" 
                onClick={() => setShowDisableDialog(true)}
                className="text-destructive border-destructive/20 hover:bg-destructive/10"
              >
                Disable 2FA
              </Button>
            ) : (
              <Button 
                onClick={handleEnroll}
                disabled={isEnrolling}
                className="bg-gradient-primary hover:opacity-90"
              >
                {isEnrolling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Smartphone className="mr-2 h-4 w-4" />
                    Enable 2FA
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Set up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            </div>

            {/* Manual Entry */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Or enter this code manually:
              </Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm break-all">
                  {secret}
                </code>
                <Button variant="outline" size="icon" onClick={copySecret}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Verification */}
            <div className="space-y-2">
              <Label htmlFor="verification-code">Enter verification code</Label>
              <Input
                id="verification-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-lg tracking-widest font-mono"
              />
            </div>

            <Button
              onClick={handleVerify}
              disabled={isVerifying || verificationCode.length !== 6}
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Enable 2FA'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter the verification code from your authenticator app to disable 2FA.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disable-code">Verification code</Label>
              <Input
                id="disable-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-lg tracking-widest font-mono"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDisableDialog(false);
                  setDisableCode('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisable}
                disabled={isDisabling || disableCode.length !== 6}
                className="flex-1"
              >
                {isDisabling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Disabling...
                  </>
                ) : (
                  'Disable 2FA'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TwoFactorSetup;
