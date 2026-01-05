import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface EngagementTrendChartProps {
  sessionId?: string;
}

interface ChartData {
  time: string;
  engagement: number;
  attention: number;
}

export const EngagementTrendChart = ({ sessionId }: EngagementTrendChartProps) => {
  const { user } = useAuth();
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);

      let metrics: { timestamp: string; attention_score: number | null }[] | null = null;

      if (sessionId) {
        const { data } = await supabase
          .from('engagement_metrics')
          .select('timestamp, attention_score')
          .eq('session_id', sessionId)
          .order('timestamp', { ascending: true })
          .limit(100);
        metrics = data;
      } else {
        const { data } = await supabase
          .from('engagement_metrics')
          .select('timestamp, attention_score, sessions!inner(host_id)')
          .eq('sessions.host_id', user.id)
          .order('timestamp', { ascending: true })
          .limit(100);
        metrics = data;
      }

      if (metrics && metrics.length > 0) {
        // Group by time intervals (every 5 minutes)
        const grouped = new Map<string, number[]>();
        
        metrics.forEach((m) => {
          const date = new Date(m.timestamp);
          const key = `${date.getHours()}:${Math.floor(date.getMinutes() / 5) * 5}`;
          
          if (!grouped.has(key)) {
            grouped.set(key, []);
          }
          grouped.get(key)!.push(m.attention_score || 0);
        });

        const chartData: ChartData[] = Array.from(grouped.entries()).map(([time, scores]) => ({
          time,
          engagement: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100),
          attention: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100),
        }));

        setData(chartData.slice(-12)); // Last 12 intervals
      } else {
        // Generate sample data for demo
        setData([
          { time: '10:00', engagement: 85, attention: 82 },
          { time: '10:05', engagement: 78, attention: 75 },
          { time: '10:10', engagement: 82, attention: 80 },
          { time: '10:15', engagement: 75, attention: 72 },
          { time: '10:20', engagement: 88, attention: 85 },
          { time: '10:25', engagement: 92, attention: 90 },
          { time: '10:30', engagement: 85, attention: 83 },
          { time: '10:35', engagement: 78, attention: 76 },
        ]);
      }

      setLoading(false);
    };

    fetchData();
  }, [user, sessionId]);

  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <CardTitle className="font-display flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Engagement Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading chart...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="attentionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area
                type="monotone"
                dataKey="engagement"
                stroke="hsl(var(--primary))"
                fill="url(#engagementGradient)"
                strokeWidth={2}
                name="Engagement"
              />
              <Area
                type="monotone"
                dataKey="attention"
                stroke="hsl(var(--accent))"
                fill="url(#attentionGradient)"
                strokeWidth={2}
                name="Attention"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
