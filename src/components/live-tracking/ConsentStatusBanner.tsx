import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, ShieldOff, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ConsentStatusBannerProps {
  consentGiven: boolean;
  onWithdrawConsent: () => Promise<void>;
  isHost: boolean;
}

export const ConsentStatusBanner = ({
  consentGiven,
  onWithdrawConsent,
  isHost,
}: ConsentStatusBannerProps) => {
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Don't show for hosts
  if (isHost) return null;

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    try {
      await onWithdrawConsent();
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (consentGiven) {
    return (
      <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-success/10 border border-success/20 mb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-success shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Engagement tracking is active
            </p>
            <p className="text-xs text-muted-foreground">
              Your attention and engagement data is being shared with the host
            </p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
              <ShieldOff className="h-4 w-4 mr-1" />
              Withdraw
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Withdraw Tracking Consent?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  If you withdraw consent, your engagement data will no longer be tracked 
                  or shared with the session host.
                </p>
                <p className="text-sm text-muted-foreground">
                  You can continue to participate in the session, but your engagement 
                  metrics will not be recorded. To re-enable tracking, you'll need to 
                  leave and rejoin the session.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Tracking</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isWithdrawing ? 'Withdrawing...' : 'Withdraw Consent'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20 mb-6">
      <ShieldOff className="h-5 w-5 text-warning shrink-0" />
      <div>
        <p className="text-sm font-medium text-foreground">
          Tracking paused
        </p>
        <p className="text-xs text-muted-foreground">
          You've withdrawn consent. Rejoin the session to re-enable tracking.
        </p>
      </div>
    </div>
  );
};
