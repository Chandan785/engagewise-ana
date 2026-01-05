import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Activity,
  Video,
  Camera,
  Eye,
  Shield,
  CheckCircle2,
  AlertCircle,
  Users,
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Session = Database['public']['Tables']['sessions']['Row'];

const JoinSession = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [alreadyJoined, setAlreadyJoined] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        toast({
          variant: 'destructive',
          title: 'Session not found',
          description: 'This session link may be invalid or expired.',
        });
        navigate('/');
        return;
      }

      if (data.status !== 'active') {
        toast({
          variant: 'destructive',
          title: 'Session not available',
          description: data.status === 'completed' 
            ? 'This session has ended.' 
            : 'This session has not started yet.',
        });
      }

      setSession(data);
      
      // Check if user already joined
      if (user) {
        const { data: participant } = await supabase
          .from('participants')
          .select('id')
          .eq('session_id', id)
          .eq('user_id', user.id)
          .is('left_at', null)
          .maybeSingle();

        if (participant) {
          setAlreadyJoined(true);
        }
      }
      
      setLoading(false);
    };

    fetchSession();
  }, [id, user, navigate, toast]);

  const handleJoin = async () => {
    if (!session || !user || !consentGiven) return;

    setJoining(true);

    try {
      // Check if already a participant
      const { data: existing } = await supabase
        .from('participants')
        .select('id')
        .eq('session_id', session.id)
        .eq('user_id', user.id)
        .is('left_at', null)
        .maybeSingle();

      if (existing) {
        // Already joined, go to live session
        navigate(`/live/${session.id}`);
        return;
      }

      // Join as new participant
      const { error } = await supabase
        .from('participants')
        .insert({
          session_id: session.id,
          user_id: user.id,
          joined_at: new Date().toISOString(),
          consent_given: true,
          consent_given_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: 'Joined successfully',
        description: 'You have joined the session. Your camera will be used for engagement tracking.',
      });

      navigate(`/live/${session.id}`);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to join',
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setJoining(false);
    }
  };

  const handleLoginAndJoin = () => {
    // Store the session ID to redirect back after login
    sessionStorage.setItem('joinSessionId', id || '');
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass">
          <CardHeader className="text-center">
            <Skeleton className="h-12 w-12 rounded-xl mx-auto mb-4" />
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-12" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) return null;

  const isActive = session.status === 'active';

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Activity className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold text-foreground">
            Focus<span className="text-gradient">Track</span>
          </span>
        </div>

        <Card className="glass">
          <CardHeader className="text-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Video className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="font-display text-2xl">{session.title}</CardTitle>
            <CardDescription>
              {session.description || 'You have been invited to join this engagement tracking session.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Session Status */}
            <div className={`p-4 rounded-xl ${isActive ? 'bg-success/10 border border-success/20' : 'bg-muted border border-border'}`}>
              <div className="flex items-center gap-3">
                {isActive ? (
                  <>
                    <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
                    <span className="text-success font-medium">Session is live</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">Session is {session.status}</span>
                  </>
                )}
              </div>
            </div>

            {alreadyJoined ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span className="text-success font-medium">You've already joined this session</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-gradient-primary hover:opacity-90"
                  onClick={() => navigate(`/live/${session.id}`)}
                >
                  Continue to Live Session
                </Button>
              </div>
            ) : (
              <>
                {/* Privacy Info */}
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    What we track
                  </h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                      <Camera className="h-4 w-4 text-primary" />
                      <span>Face presence detection</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                      <Eye className="h-4 w-4 text-primary" />
                      <span>Eye gaze and attention focus</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                      <Users className="h-4 w-4 text-primary" />
                      <span>Engagement level scoring</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All processing happens locally. No video is stored or transmitted.
                  </p>
                </div>

                {/* Consent Checkbox */}
                {user && isActive && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50 border border-border">
                    <Checkbox
                      id="consent"
                      checked={consentGiven}
                      onCheckedChange={(checked) => setConsentGiven(checked === true)}
                      className="mt-0.5"
                    />
                    <label htmlFor="consent" className="text-sm text-foreground cursor-pointer">
                      I consent to having my camera used for engagement tracking during this session. 
                      I understand that my engagement metrics will be visible to the session host.
                    </label>
                  </div>
                )}

                {/* Action Buttons */}
                {!user ? (
                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-gradient-primary hover:opacity-90"
                      onClick={handleLoginAndJoin}
                    >
                      Sign in to Join
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      You need to be signed in to join this session
                    </p>
                  </div>
                ) : !isActive ? (
                  <Button className="w-full" disabled>
                    Session Not Active
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-gradient-primary hover:opacity-90"
                    disabled={!consentGiven || joining}
                    onClick={handleJoin}
                  >
                    {joining ? 'Joining...' : 'Join Session'}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by FocusTrack · Real-time engagement analytics
        </p>
      </div>
    </div>
  );
};

export default JoinSession;
