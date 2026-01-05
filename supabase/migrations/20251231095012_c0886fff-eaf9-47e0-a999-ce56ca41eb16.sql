-- Add column to track if reminder email was sent
ALTER TABLE public.sessions 
ADD COLUMN reminder_sent_at timestamp with time zone DEFAULT NULL;

-- Create index for efficient querying of upcoming sessions
CREATE INDEX idx_sessions_scheduled_reminder ON public.sessions (scheduled_at, reminder_sent_at) 
WHERE status = 'scheduled' AND scheduled_at IS NOT NULL;