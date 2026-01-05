import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/AppHeader';
import {
  Video,
  Calendar,
  Clock,
  Users,
  Play,
  Square,
  Settings,
  Trash2,
  ExternalLink,
  Copy,
  BarChart3,
  Eye,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Radio,
} from 'lucide-react';
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
import type { Database } from '@/integrations/supabase/types';

type Session = Database['public']['Tables']['sessions']['Row'];
type SessionStatus = Database['public']['Enums']['session_status'];

const SessionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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

      setSession(data);
      setLoading(false);
    };

    fetchSession();
  }, [id, navigate, toast]);

  const updateSessionStatus = async (newStatus: SessionStatus) => {
    if (!session) return;

    setUpdating(true);

    const updateData: Partial<Session> = { status: newStatus };
    
    if (newStatus === 'active') {
      updateData.started_at = new Date().toISOString();
    } else if (newStatus === 'completed') {
      updateData.ended_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', session.id);

    setUpdating(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error.message,
      });
    } else {
      setSession({ ...session, ...updateData });
      toast({
        title: 'Session updated',
        description: `Session is now ${newStatus}.`,
      });
    }
  };

  const deleteSession = async () => {
    if (!session) return;

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', session.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: error.message,
      });
    } else {
      toast({
        title: 'Session deleted',
        description: 'The session has been permanently deleted.',
      });
      navigate('/sessions');
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

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success border-success/20';
      case 'scheduled':
        return 'bg-info/10 text-info border-info/20';
      case 'completed':
        return 'bg-muted text-muted-foreground border-border';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
              <Skeleton className="h-64" />
              <Skeleton className="h-48" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </main>
      </div>
    );
  }

  if (!session) return null;

  const settings = session.settings as { attention_threshold?: number; alert_on_low_engagement?: boolean } | null;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <AppHeader 
        backTo="/sessions" 
        backLabel="All Sessions"
        rightContent={
          <div className="flex items-center gap-2">
            {session.status === 'scheduled' && (
              <Button
                onClick={() => updateSessionStatus('active')}
                disabled={updating}
                className="bg-success hover:bg-success/90"
              >
                <Play className="mr-2 h-4 w-4" />
                Start
              </Button>
            )}
            {session.status === 'active' && (
              <>
                <Button asChild className="bg-success hover:bg-success/90">
                  <Link to={`/live/${session.id}`}>
                    <Radio className="mr-2 h-4 w-4" />
                    Go Live
                  </Link>
                </Button>
                <Button
                  onClick={() => updateSessionStatus('completed')}
                  disabled={updating}
                  variant="destructive"
                >
                  <Square className="mr-2 h-4 w-4" />
                  End
                </Button>
              </>
            )}
          </div>
        }
      />

      <main className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Video className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                  {session.title}
                </h1>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize border ${getStatusColor(session.status)}`}>
                  {session.status === 'active' && (
                    <span className="h-2 w-2 rounded-full bg-success animate-pulse inline-block mr-1.5" />
                  )}
                  {session.status}
                </span>
              </div>
              {session.description && (
                <p className="text-muted-foreground">{session.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="glass">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-display font-bold text-foreground">0</p>
                      <p className="text-xs text-muted-foreground">Participants</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <Gauge className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-display font-bold text-foreground">—</p>
                      <p className="text-xs text-muted-foreground">Avg. Engagement</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Eye className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-display font-bold text-foreground">—</p>
                      <p className="text-xs text-muted-foreground">Attention Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Session Details */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Session Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Scheduled</p>
                    <p className="font-medium text-foreground">{formatDate(session.scheduled_at)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium text-foreground">{formatDate(session.created_at)}</p>
                  </div>
                  {session.started_at && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Started</p>
                      <p className="font-medium text-foreground">{formatDate(session.started_at)}</p>
                    </div>
                  )}
                  {session.ended_at && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Ended</p>
                      <p className="font-medium text-foreground">{formatDate(session.ended_at)}</p>
                    </div>
                  )}
                </div>

                {session.meeting_link && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">Meeting Link</p>
                    <a
                      href={session.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {session.meeting_link}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Engagement Settings */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Engagement Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${settings?.alert_on_low_engagement ? 'bg-success/10' : 'bg-muted'}`}>
                      {settings?.alert_on_low_engagement ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Low Engagement Alerts</p>
                      <p className="text-xs text-muted-foreground">
                        {settings?.alert_on_low_engagement ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Gauge className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Attention Threshold</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((settings?.attention_threshold || 0.7) * 100)}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="font-display">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={copyJoinLink}
                >
                  <Copy className="mr-3 h-4 w-4" />
                  Copy Join Link
                </Button>

                {session.meeting_link && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={session.meeting_link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-3 h-4 w-4" />
                      Open Meeting
                    </a>
                  </Button>
                )}

                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="mr-3 h-4 w-4" />
                  View Analytics
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                      <Trash2 className="mr-3 h-4 w-4" />
                      Delete Session
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Session</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{session.title}"? This action cannot be undone.
                        All engagement data for this session will be permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={deleteSession}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>

            {/* Participants Preview */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participants
                </CardTitle>
                <CardDescription>
                  No participants have joined yet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className="h-12 w-12 rounded-full bg-secondary mx-auto mb-3 flex items-center justify-center">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Share the join link to invite participants.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SessionDetail;
