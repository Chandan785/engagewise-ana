import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface ParticipantDistributionChartProps {
  sessionId?: string;
}

interface DistributionData {
  name: string;
  value: number;
  color: string;
}

export const ParticipantDistributionChart = ({ sessionId }: ParticipantDistributionChartProps) => {
  const { user } = useAuth();
  const [data, setData] = useState<DistributionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);

      let metrics: { engagement_level: string | null }[] | null = null;

      if (sessionId) {
        const { data } = await supabase
          .from('engagement_metrics')
          .select('engagement_level')
          .eq('session_id', sessionId);
        metrics = data;
      } else {
        const { data } = await supabase
          .from('engagement_metrics')
          .select('engagement_level, sessions!inner(host_id)')
          .eq('sessions.host_id', user.id);
        metrics = data;
      }

      if (metrics && metrics.length > 0) {
        const counts = {
          fully_engaged: 0,
          partially_engaged: 0,
          passively_present: 0,
          away: 0,
        };

        metrics.forEach((m) => {
          const level = m.engagement_level as keyof typeof counts;
          if (level && counts[level] !== undefined) {
            counts[level]++;
          }
        });

        setData([
          { name: 'Fully Engaged', value: counts.fully_engaged, color: 'hsl(var(--success))' },
          { name: 'Partially Engaged', value: counts.partially_engaged, color: 'hsl(var(--warning))' },
          { name: 'Passively Present', value: counts.passively_present, color: 'hsl(var(--accent))' },
          { name: 'Away', value: counts.away, color: 'hsl(var(--muted-foreground))' },
        ].filter(d => d.value > 0));
      } else {
        // No data available
        setData([]);
      }

      setLoading(false);
    };

    fetchData();
  }, [user, sessionId]);

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <CardTitle className="font-display flex items-center gap-2">
          <Users className="h-5 w-5 text-accent" />
          Engagement Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading chart...</div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <Users className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">No distribution data yet</p>
            <p className="text-sm">Data will appear after sessions with participants</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                innerRadius={50}
                fill="#8884d8"
                dataKey="value"
                stroke="hsl(var(--background))"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
