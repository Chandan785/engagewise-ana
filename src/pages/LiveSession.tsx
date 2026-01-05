import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { VideoFeed } from '@/components/live-tracking/VideoFeed';
import { EngagementMetrics } from '@/components/live-tracking/EngagementMetrics';
import { ParticipantTracker } from '@/components/live-tracking/ParticipantTracker';
import { SessionStats } from '@/components/live-tracking/SessionStats';
import { EngagementTimeline } from '@/components/live-tracking/EngagementTimeline';
import { ConsentDialog } from '@/components/live-tracking/ConsentDialog';
import { ConsentStatusBanner } from '@/components/live-tracking/ConsentStatusBanner';
import { AppHeader } from '@/components/AppHeader';
import {
  Video,
  Square,
  Copy,
  Radio,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Session = Database['public']['Tables']['sessions']['Row'];
type EngagementLevel = Database['public']['Enums']['engagement_level'];

const LiveSession = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [lastMetricSent, setLastMetricSent] = useState(0);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  const {
    videoRef,
    canvasRef,
    isLoading: cameraLoading,
    isActive: cameraActive,
    error: cameraError,
    detection,
    startDetection,
    stopDetection,
  } = useFaceDetection();

  // Fetch session data
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
          description: 'The session you are looking for does not exist.',
        });
        navigate('/sessions');
        return;
      }

      if (data.status !== 'active') {
        toast({
          variant: 'destructive',
          title: 'Session not active',
          description: 'This session is not currently active.',
        });
        navigate(`/session/${id}`);
        return;
      }

      setSession(data);
      setLoading(false);
    };

    fetchSession();
  }, [id, navigate, toast]);

  // Check if user needs to give consent
  useEffect(() => {
    const checkParticipation = async () => {
      if (!id || !user || !session) return;

      // Host doesn't need consent dialog
      if (session.host_id === user.id) {
        setConsentGiven(true);
        return;
      }

      // Check if already a participant with consent
      const { data: existing } = await supabase
        .from('participants')
        .select('id, consent_given')
        .eq('session_id', id)
        .eq('user_id', user.id)
        .is('left_at', null)
        .maybeSingle();

      if (existing) {
        setParticipantId(existing.id);
        setConsentGiven(existing.consent_given || false);
        return;
      }

      // Show consent dialog for new participants
      setShowConsentDialog(true);
    };

    checkParticipation();
  }, [id, user, session]);

  // Join session after consent is given
  const handleConsentAccept = async () => {
    if (!id || !user) return;

    const { data, error } = await supabase
      .from('participants')
      .insert({
        session_id: id,
        user_id: user.id,
        joined_at: new Date().toISOString(),
        consent_given: true,
        consent_given_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (!error && data) {
      setParticipantId(data.id);
      setConsentGiven(true);
      setShowConsentDialog(false);
      toast({
        title: 'Joined session',
        description: 'You have successfully joined the session.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to join',
        description: error?.message || 'Could not join the session.',
      });
    }
  };

  const handleConsentDecline = () => {
    setShowConsentDialog(false);
    toast({
      title: 'Consent declined',
      description: 'You must accept the tracking terms to join this session.',
    });
    navigate(`/session/${id}`);
  };

  // Withdraw consent during session
  const handleWithdrawConsent = async () => {
    if (!participantId || !id || !user) return;

    const { error } = await supabase
      .from('participants')
      .update({ consent_given: false })
      .eq('id', participantId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to withdraw consent',
        description: error.message,
      });
    } else {
      setConsentGiven(false);
      stopDetection();
      toast({
        title: 'Consent withdrawn',
        description: 'Your engagement data will no longer be tracked.',
      });

      // Notify host via email (fire and forget)
      supabase.functions.invoke('notify-consent-withdrawal', {
        body: { sessionId: id, participantUserId: user.id },
      }).catch((err) => {
        console.error('Failed to send consent withdrawal notification:', err);
      });
    }
  };

  // Send engagement metrics
  const sendMetrics = useCallback(async () => {
    if (!id || !participantId || !detection) return;

    // Throttle to once per second
    const now = Date.now();
    if (now - lastMetricSent < 1000) return;
    setLastMetricSent(now);

    // Determine engagement level
    let engagementLevel: EngagementLevel = 'away';
    if (detection.faceDetected) {
      if (detection.attentionScore >= 0.7) {
        engagementLevel = 'fully_engaged';
      } else if (detection.attentionScore >= 0.4) {
        engagementLevel = 'partially_engaged';
      } else {
        engagementLevel = 'passively_present';
      }
    }

    await supabase.from('engagement_metrics').insert({
      session_id: id,
      participant_id: participantId,
      face_detected: detection.faceDetected,
      eye_gaze_focused: detection.eyeGazeFocused,
      head_pose_engaged: detection.headPoseEngaged,
      attention_score: detection.attentionScore,
      engagement_level: engagementLevel,
      camera_on: cameraActive,
      screen_focused: true,
    });
  }, [id, participantId, detection, lastMetricSent, cameraActive]);

  // Send metrics when detection updates (only if consent given)
  useEffect(() => {
    if (cameraActive && detection && consentGiven) {
      sendMetrics();
    }
  }, [detection, cameraActive, sendMetrics, consentGiven]);

  // Leave session on unmount
  useEffect(() => {
    return () => {
      if (participantId) {
        supabase
          .from('participants')
          .update({ left_at: new Date().toISOString() })
          .eq('id', participantId);
      }
    };
  }, [participantId]);

  const generateSessionReport = async (sessionId: string) => {
    try {
      // Fetch metrics for this session
      const { data: metrics } = await supabase
        .from('engagement_metrics')
        .select('*')
        .eq('session_id', sessionId);

      const { count: participantCount } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);

      if (metrics && metrics.length > 0) {
        const avgEngagement = metrics.reduce((sum, m) => sum + (m.attention_score || 0), 0) / metrics.length;
        const fullyEngaged = metrics.filter(m => m.engagement_level === 'fully_engaged').length;
        const partiallyEngaged = metrics.filter(m => m.engagement_level === 'partially_engaged').length;
        const passivelyPresent = metrics.filter(m => m.engagement_level === 'passively_present').length;

        // Calculate session duration
        const { data: sessionData } = await supabase
          .from('sessions')
          .select('started_at, ended_at')
          .eq('id', sessionId)
          .single();

        let durationMinutes = 0;
        if (sessionData?.started_at && sessionData?.ended_at) {
          durationMinutes = Math.round(
            (new Date(sessionData.ended_at).getTime() - new Date(sessionData.started_at).getTime()) / 60000
          );
        }

        // Insert report
        await supabase.from('session_reports').insert({
          session_id: sessionId,
          total_participants: participantCount || 0,
          avg_engagement_score: Math.round(avgEngagement * 100),
          fully_engaged_count: fullyEngaged,
          partially_engaged_count: partiallyEngaged,
          passively_present_count: passivelyPresent,
          total_duration_minutes: durationMinutes,
          report_data: {
            totalMetrics: metrics.length,
            cameraOnRate: metrics.filter(m => m.camera_on).length / metrics.length,
            faceDetectionRate: metrics.filter(m => m.face_detected).length / metrics.length,
          },
        });
      }
    } catch (err) {
      console.error('Failed to generate session report:', err);
    }
  };

  const endSession = async () => {
    if (!session) return;

    const { error } = await supabase
      .from('sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to end session',
        description: error.message,
      });
    } else {
      stopDetection();
      
      // Generate session report
      await generateSessionReport(session.id);

      // Notify participants via email (fire and forget)
      supabase.functions.invoke('notify-session-ended', {
        body: { sessionId: session.id },
      }).catch((err) => {
        console.error('Failed to send session ended notifications:', err);
      });

      navigate(`/session/${session.id}`);
    }
  };

  const copyJoinLink = () => {
    const joinLink = `${window.location.origin}/join/${session?.id}`;
    navigator.clipboard.writeText(joinLink);
    toast({
      title: 'Link copied',
      description: 'Session join link copied to clipboard.',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container py-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </nav>
        <main className="container py-8">
          <Skeleton className="h-12 w-64 mb-4" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="aspect-video" />
              <Skeleton className="h-48" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </main>
      </div>
    );
  }

  if (!session) return null;

  const isHost = session.host_id === user?.id;

  return (
    <>
      <ConsentDialog
        open={showConsentDialog}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
        sessionTitle={session.title}
      />
    <div className="min-h-screen bg-gradient-hero">
      <AppHeader 
        backTo={`/session/${session.id}`} 
        backLabel="Session Details"
        rightContent={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/90 text-destructive-foreground text-sm font-medium">
              <Radio className="h-4 w-4 animate-pulse" />
              LIVE
            </div>
            {isHost && (
              <Button variant="destructive" onClick={endSession}>
                <Square className="mr-2 h-4 w-4" />
                End Session
              </Button>
            )}
          </div>
        }
      />

      <main className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                {session.title}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {cameraActive ? (
                  <>
                    <Wifi className="h-4 w-4 text-success" />
                    <span>Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4" />
                    <span>Camera off</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <Button variant="outline" onClick={copyJoinLink}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Join Link
          </Button>
        </div>

        {/* Consent Status Banner */}
        <ConsentStatusBanner
          consentGiven={consentGiven}
          onWithdrawConsent={handleWithdrawConsent}
          isHost={isHost}
        />

        {/* Stats */}
        <SessionStats sessionId={session.id} startedAt={session.started_at} />

        {/* Main content */}
        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <VideoFeed
              videoRef={videoRef}
              canvasRef={canvasRef}
              isActive={cameraActive}
              isLoading={cameraLoading}
              error={cameraError}
              detection={detection}
              onStart={startDetection}
              onStop={stopDetection}
            />
            
            <EngagementMetrics 
              detection={detection}
              isActive={cameraActive}
            />
          </div>

          <div className="space-y-6">
            <ParticipantTracker sessionId={session.id} />
            <EngagementTimeline sessionId={session.id} />
          </div>
        </div>
      </main>
    </div>
    </>
  );
};

export default LiveSession;
