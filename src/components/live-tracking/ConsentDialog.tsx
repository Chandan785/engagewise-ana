import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { Camera, Eye, Brain, Shield } from 'lucide-react';

interface ConsentDialogProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
  sessionTitle: string;
}

export const ConsentDialog = ({
  open,
  onAccept,
  onDecline,
  sessionTitle,
}: ConsentDialogProps) => {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-5 w-5 text-primary" />
            Engagement Tracking Consent
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                To join <span className="font-medium text-foreground">"{sessionTitle}"</span>, 
                please review and accept the engagement tracking terms below.
              </p>

              <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-4">
                <h4 className="font-medium text-foreground text-sm">
                  Data we collect during this session:
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Camera className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>Camera feed to detect face presence (video is not recorded)</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>Eye gaze and head position to measure attention</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Brain className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>Engagement metrics shared with the session host</span>
                  </li>
                </ul>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Checkbox
                  id="consent"
                  checked={acknowledged}
                  onCheckedChange={(checked) => setAcknowledged(checked === true)}
                  className="mt-0.5"
                />
                <label
                  htmlFor="consent"
                  className="text-sm text-foreground cursor-pointer leading-relaxed"
                >
                  I understand and agree that my engagement data will be tracked 
                  and shared with the session host for the duration of this session.
                </label>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel onClick={onDecline}>
            Decline & Leave
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onAccept}
            disabled={!acknowledged}
            className="bg-primary hover:bg-primary/90"
          >
            Accept & Join Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
