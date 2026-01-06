-- Enable realtime for user_roles table so role changes are pushed to users immediately
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;