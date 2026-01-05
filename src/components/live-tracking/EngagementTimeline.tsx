import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface EngagementTimelineProps {
  sessionId: string;
}

interface TimelineData {
  time: string;
  engagement: number;
}

export const EngagementTimeline = ({ sessionId }: EngagementTimelineProps) => {
  const [data, setData] = useState<TimelineData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: metrics } = await supabase
        .from('engagement_metrics')
        .select('timestamp, attention_score')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true })
        .limit(50);

      if (metrics && metrics.length > 0) {
        // Group by minute
        const grouped = new Map<string, number[]>();
        
        metrics.forEach((m) => {
          const date = new Date(m.timestamp);
          const key = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
          
          if (!grouped.has(key)) {
            grouped.set(key, []);
          }
          grouped.get(key)!.push(m.attention_score || 0);
        });

        const chartData: TimelineData[] = Array.from(grouped.entries()).map(([time, scores]) => ({
          time,
          engagement: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100),
        }));

        setData(chartData.slice(-20));
      }
    };

    fetchData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`timeline-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'engagement_metrics',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  if (data.length === 0) {
    return null;
  }

  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <CardTitle className="font-display flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-primary" />
          Live Engagement Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10}
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10}
              domain={[0, 100]}
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value}%`, 'Engagement']}
            />
            <Line
              type="monotone"
              dataKey="engagement"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
