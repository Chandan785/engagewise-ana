import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Activity, ArrowLeft, LogOut, Settings, User, Sun, Moon, Monitor, Shield, Video } from 'lucide-react';

interface AppHeaderProps {
  backTo?: string;
  backLabel?: string;
  rightContent?: React.ReactNode;
}

export const AppHeader = ({ backTo, backLabel, rightContent }: AppHeaderProps) => {
  const { user, profile, signOut, roles, isAdmin, isHost } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return user?.email?.[0]?.toUpperCase() || 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container py-4">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-4 min-w-0">
            {backTo ? (
              <Link
                to={backTo}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{backLabel || 'Back'}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                  <Activity className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-display text-xl font-bold text-foreground">
                  Engagement<span className="text-gradient">Analyzer</span>
                </span>
              </div>
            )}
          </div>

          {/* Center Logo (when back button is shown) */}
          {backTo && (
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-foreground hidden sm:inline">
                Focus<span className="text-gradient">Track</span>
              </span>
            </Link>
          )}

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {rightContent}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-10 w-10 border-2 border-primary/20 hover:border-primary/40 transition-colors">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground font-display">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-3 p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground font-display text-sm">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">
                      {profile?.full_name || 'User'}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </span>
                    {roles.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {roles.map((role) => (
                          <span
                            key={role}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${
                              role === 'admin'
                                ? 'bg-destructive/10 text-destructive'
                                : role === 'host'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-green-500/10 text-green-500'
                            }`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                {isHost && (
                  <DropdownMenuItem asChild>
                    <Link to="/host-dashboard" className="cursor-pointer">
                      <Video className="mr-2 h-4 w-4" />
                      Host Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer">
                    {theme === 'dark' ? (
                      <Moon className="mr-2 h-4 w-4" />
                    ) : theme === 'light' ? (
                      <Sun className="mr-2 h-4 w-4" />
                    ) : (
                      <Monitor className="mr-2 h-4 w-4" />
                    )}
                    Theme
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="bg-popover">
                      <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
                        <Sun className="mr-2 h-4 w-4" />
                        Light
                        {theme === 'light' && <span className="ml-auto text-primary">✓</span>}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
                        <Moon className="mr-2 h-4 w-4" />
                        Dark
                        {theme === 'dark' && <span className="ml-auto text-primary">✓</span>}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
                        <Monitor className="mr-2 h-4 w-4" />
                        System
                        {theme === 'system' && <span className="ml-auto text-primary">✓</span>}
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};
