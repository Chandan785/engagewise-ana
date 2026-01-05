import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Participant = Database['public']['Tables']['participants']['Row'];
type EngagementLevel = Database['public']['Enums']['engagement_level'];

interface ParticipantWithProfile extends Participant {
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    organization: string | null;
  };
  latestEngagement?: {
    engagement_level: EngagementLevel | null;
    attention_score: number | null;
  };
}

interface ParticipantTrackerProps {
  sessionId: string;
}

export const ParticipantTracker = ({ sessionId }: ParticipantTrackerProps) => {
  const [participants, setParticipants] = useState<ParticipantWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParticipants = async () => {
      // First fetch participants for this session
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('*')
        .eq('session_id', sessionId)
        .is('left_at', null);

      if (participantsError || !participantsData) {
        setLoading(false);
        return;
      }

      // Use secure RPC function to get limited profile data (excludes emails)
      const { data: profilesData } = await supabase
        .rpc('get_participant_profiles_for_host', { p_session_id: sessionId });

      // Create a map of user_id to profile for quick lookup
      const profileMap = new Map<string, { full_name: string | null; avatar_url: string | null; organization: string | null }>();
      if (profilesData) {
        profilesData.forEach((p: { user_id: string; full_name: string | null; avatar_url: string | null; organization: string | null }) => {
          profileMap.set(p.user_id, {
            full_name: p.full_name,
            avatar_url: p.avatar_url,
            organization: p.organization,
          });
        });
      }

      // Fetch latest engagement for each participant
      const participantsWithEngagement = await Promise.all(
        participantsData.map(async (p) => {
          const { data: metrics } = await supabase
            .from('engagement_metrics')
            .select('engagement_level, attention_score')
            .eq('participant_id', p.id)
            .order('timestamp', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...p,
            profile: profileMap.get(p.user_id) || null,
            latestEngagement: metrics,
          } as ParticipantWithProfile;
        })
      );
      setParticipants(participantsWithEngagement);
      setLoading(false);
    };

    fetchParticipants();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`participants-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchParticipants();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'engagement_metrics',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const getEngagementBadge = (level: EngagementLevel | null | undefined) => {
    switch (level) {
      case 'fully_engaged':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <TrendingUp className="mr-1 h-3 w-3" />
            Engaged
          </Badge>
        );
      case 'partially_engaged':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Minus className="mr-1 h-3 w-3" />
            Partial
          </Badge>
        );
      case 'passively_present':
        return (
          <Badge className="bg-accent/10 text-accent border-accent/20">
            <TrendingDown className="mr-1 h-3 w-3" />
            Passive
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Away
          </Badge>
        );
    }
  };

  const getInitials = (name: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'U?';
  };

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <CardTitle className="font-display flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participants
          </div>
          <Badge variant="secondary">{participants.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : participants.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No participants yet</p>
            <p className="text-xs mt-1">Share the join link to invite participants</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {participants.map((participant) => (
              <div 
                key={participant.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={participant.profile?.avatar_url || ''} />
                    <AvatarFallback>
                      {getInitials(participant.profile?.full_name || null)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {participant.profile?.full_name || 'Participant'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {participant.latestEngagement?.attention_score
                        ? `${Math.round(participant.latestEngagement.attention_score * 100)}% attention`
                        : 'No data yet'}
                    </p>
                  </div>
                </div>
                {getEngagementBadge(participant.latestEngagement?.engagement_level)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
