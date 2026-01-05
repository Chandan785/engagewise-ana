import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/AppHeader';
import { 
  Loader2, 
  Calendar,
  Video,
  Settings2,
  Link as LinkIcon,
  Clock,
  Save,
  Mail,
  X,
  Plus
} from 'lucide-react';

const sessionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  meeting_link: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  scheduled_at: z.string().optional(),
  scheduled_time: z.string().optional(),
});

type SessionFormData = z.infer<typeof sessionSchema>;

const SessionNew = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertOnLowEngagement, setAlertOnLowEngagement] = useState(true);
  const [attentionThreshold, setAttentionThreshold] = useState(0.7);
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      title: '',
      description: '',
      meeting_link: '',
      scheduled_at: '',
      scheduled_time: '',
    },
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase();
    setEmailError('');
    
    if (!email) return;
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    if (inviteEmails.includes(email)) {
      setEmailError('This email is already added');
      return;
    }
    
    if (inviteEmails.length >= 50) {
      setEmailError('Maximum 50 invitations allowed');
      return;
    }
    
    setInviteEmails([...inviteEmails, email]);
    setEmailInput('');
  };

  const removeEmail = (emailToRemove: string) => {
    setInviteEmails(inviteEmails.filter(e => e !== emailToRemove));
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  const handleSubmit = async (data: SessionFormData) => {
    if (!user) return;

    setIsSubmitting(true);

    // Combine date and time if both are provided
    let scheduledAt: string | null = null;
    if (data.scheduled_at) {
      if (data.scheduled_time) {
        scheduledAt = new Date(`${data.scheduled_at}T${data.scheduled_time}`).toISOString();
      } else {
        scheduledAt = new Date(`${data.scheduled_at}T09:00:00`).toISOString();
      }
    }

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        title: data.title.trim(),
        description: data.description?.trim() || null,
        meeting_link: data.meeting_link || null,
        scheduled_at: scheduledAt,
        host_id: user.id,
        status: 'scheduled',
        settings: {
          attention_threshold: attentionThreshold,
          alert_on_low_engagement: alertOnLowEngagement,
        },
      })
      .select()
      .single();

    if (error) {
      setIsSubmitting(false);
      toast({
        variant: 'destructive',
        title: 'Failed to create session',
        description: error.message,
      });
      return;
    }

    // Send invitations if any emails were added
    if (inviteEmails.length > 0) {
      try {
        await supabase.functions.invoke('send-session-invite', {
          body: {
            sessionId: session.id,
            emails: inviteEmails,
            hostName: profile?.full_name || user.email || 'A host',
            sessionTitle: data.title.trim(),
            sessionDescription: data.description?.trim(),
            scheduledAt,
          },
        });
        toast({
          title: 'Invitations sent!',
          description: `Sent ${inviteEmails.length} invitation(s) via email.`,
        });
      } catch (inviteError) {
        console.error('Failed to send invitations:', inviteError);
        toast({
          variant: 'destructive',
          title: 'Invitations failed',
          description: 'Session created but some invitations could not be sent.',
        });
      }
    }

    // Notify past participants via email (fire and forget)
    supabase.functions.invoke('notify-session-scheduled', {
      body: { sessionId: session.id, hostId: user.id },
    }).catch((err) => {
      console.error('Failed to send session scheduled notifications:', err);
    });

    setIsSubmitting(false);
    toast({
      title: 'Session created!',
      description: 'Your engagement tracking session has been created.',
    });

    navigate(`/session/${session.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <AppHeader backTo="/dashboard" backLabel="Back to Dashboard" />

      <main className="container py-8 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Video className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Create New Session
          </h1>
          <p className="text-muted-foreground">
            Set up an engagement tracking session for your meeting or class.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Video className="h-5 w-5" />
                Session Details
              </CardTitle>
              <CardDescription>
                Basic information about your engagement tracking session.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Session Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Weekly Team Standup, CS101 Lecture"
                  {...form.register('title')}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the session (optional)"
                  rows={3}
                  {...form.register('description')}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting_link" className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  Meeting Link
                </Label>
                <Input
                  id="meeting_link"
                  type="url"
                  placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                  {...form.register('meeting_link')}
                />
                {form.formState.errors.meeting_link && (
                  <p className="text-sm text-destructive">{form.formState.errors.meeting_link.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule
              </CardTitle>
              <CardDescription>
                When will this session take place? Leave empty for an immediate session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled_at" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Date
                  </Label>
                  <Input
                    id="scheduled_at"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    {...form.register('scheduled_at')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled_time" className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Time
                  </Label>
                  <Input
                    id="scheduled_time"
                    type="time"
                    {...form.register('scheduled_time')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invite Participants */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Invite Participants
              </CardTitle>
              <CardDescription>
                Send email invitations to participants. They'll receive a link to join the session.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite_email">Email Addresses</Label>
                <div className="flex gap-2">
                  <Input
                    id="invite_email"
                    type="email"
                    placeholder="participant@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={handleEmailKeyDown}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addEmail}
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {emailError && (
                  <p className="text-sm text-destructive">{emailError}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Press Enter or click + to add each email
                </p>
              </div>

              {inviteEmails.length > 0 && (
                <div className="space-y-2">
                  <Label>Invited ({inviteEmails.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {inviteEmails.map((email) => (
                      <Badge
                        key={email}
                        variant="secondary"
                        className="flex items-center gap-1 py-1 px-2"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => removeEmail(email)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Engagement Settings
              </CardTitle>
              <CardDescription>
                Configure how engagement is tracked and reported.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alert on Low Engagement</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications when overall engagement drops
                  </p>
                </div>
                <Switch
                  checked={alertOnLowEngagement}
                  onCheckedChange={setAlertOnLowEngagement}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Attention Threshold</Label>
                  <span className="text-sm font-medium text-primary">
                    {Math.round(attentionThreshold * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="0.9"
                  step="0.05"
                  value={attentionThreshold}
                  onChange={(e) => setAttentionThreshold(parseFloat(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="text-sm text-muted-foreground">
                  Participants scoring below this threshold are considered disengaged.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="submit"
              className="flex-1 bg-gradient-primary hover:opacity-90 transition-opacity shadow-md"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Session...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Session
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default SessionNew;
