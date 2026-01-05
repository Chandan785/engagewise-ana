import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Eye } from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface EngagementBreakdownChartProps {
  sessionId?: string;
}

interface BreakdownData {
  metric: string;
  value: number;
  fullMark: number;
}

export const EngagementBreakdownChart = ({ sessionId }: EngagementBreakdownChartProps) => {
  const { user } = useAuth();
  const [data, setData] = useState<BreakdownData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);

      let metrics: { face_detected: boolean | null; eye_gaze_focused: boolean | null; head_pose_engaged: boolean | null; camera_on: boolean | null; screen_focused: boolean | null }[] | null = null;

      if (sessionId) {
        const { data } = await supabase
          .from('engagement_metrics')
          .select('face_detected, eye_gaze_focused, head_pose_engaged, camera_on, screen_focused')
          .eq('session_id', sessionId)
          .limit(500);
        metrics = data;
      } else {
        const { data } = await supabase
          .from('engagement_metrics')
          .select('face_detected, eye_gaze_focused, head_pose_engaged, camera_on, screen_focused, sessions!inner(host_id)')
          .eq('sessions.host_id', user.id)
          .limit(500);
        metrics = data;
      }

      if (metrics && metrics.length > 0) {
        const totals = {
          faceDetected: 0,
          eyeGaze: 0,
          headPose: 0,
          cameraOn: 0,
          screenFocused: 0,
        };

        metrics.forEach((m) => {
          if (m.face_detected) totals.faceDetected++;
          if (m.eye_gaze_focused) totals.eyeGaze++;
          if (m.head_pose_engaged) totals.headPose++;
          if (m.camera_on) totals.cameraOn++;
          if (m.screen_focused) totals.screenFocused++;
        });

        const total = metrics.length;
        setData([
          { metric: 'Face Detection', value: Math.round((totals.faceDetected / total) * 100), fullMark: 100 },
          { metric: 'Eye Gaze', value: Math.round((totals.eyeGaze / total) * 100), fullMark: 100 },
          { metric: 'Head Pose', value: Math.round((totals.headPose / total) * 100), fullMark: 100 },
          { metric: 'Camera On', value: Math.round((totals.cameraOn / total) * 100), fullMark: 100 },
          { metric: 'Screen Focus', value: Math.round((totals.screenFocused / total) * 100), fullMark: 100 },
        ]);
      } else {
        // No data available
        setData([]);
      }

      setLoading(false);
    };

    fetchData();
  }, [user, sessionId]);

  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <CardTitle className="font-display flex items-center gap-2">
          <Eye className="h-5 w-5 text-success" />
          Engagement Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading chart...</div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <Eye className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">No breakdown data yet</p>
            <p className="text-sm">Enable camera tracking during sessions to see metrics</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis 
                dataKey="metric" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <Radar
                name="Engagement"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value}%`, 'Score']}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
