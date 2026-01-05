import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/AppHeader';
import TwoFactorSetup from '@/components/TwoFactorSetup';
import { 
  User, 
  Mail, 
  Building2, 
  Loader2,
  Save,
  Shield,
  Calendar,
  Camera,
  Key
} from 'lucide-react';

const Profile = () => {
  const { user, profile, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    organization: profile?.organization || '',
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload an image file.',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB.',
      });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update the profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl + '?t=' + Date.now()); // Cache bust
      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message,
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        organization: formData.organization,
      })
      .eq('user_id', user.id);
    
    setIsSaving(false);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error.message,
      });
    } else {
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      });
      setIsEditing(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } else {
      toast({
        title: 'Password reset email sent',
        description: 'Check your email for a link to reset your password.',
      });
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'host':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'participant':
        return 'bg-success/10 text-success border-success/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <AppHeader backTo="/dashboard" backLabel="Back to Dashboard" />

      <main className="container py-8 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <Avatar className="h-24 w-24 border-4 border-primary/20">
              <AvatarImage src={avatarUrl || profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-display">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2 mt-4">
            {profile?.full_name || 'Your Profile'}
          </h1>
          <p className="text-muted-foreground">{user?.email}</p>
          
          {/* Role Badges */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {roles.map((role) => (
              <span
                key={role}
                className={`text-xs px-3 py-1 rounded-full font-medium capitalize border ${getRoleBadgeColor(role)}`}
              >
                {role}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile Information */}
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and preferences.
                  </CardDescription>
                </div>
                {!isEditing && (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Full Name
                  </Label>
                  {isEditing ? (
                    <Input
                      id="fullName"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-foreground py-2">{profile?.full_name || '—'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email Address
                  </Label>
                  <p className="text-foreground py-2">{user?.email}</p>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="organization" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Organization
                  </Label>
                  {isEditing ? (
                    <Input
                      id="organization"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      placeholder="Enter your organization name"
                    />
                  ) : (
                    <p className="text-foreground py-2">{profile?.organization || '—'}</p>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        full_name: profile?.full_name || '',
                        organization: profile?.organization || '',
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <TwoFactorSetup />

          {/* Account Information */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Your account details and security settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Member Since
                  </Label>
                  <p className="text-foreground py-2">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    Account Status
                  </Label>
                  <p className="text-success py-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    Active
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <Button variant="outline" onClick={handleChangePassword}>
                  <Key className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="glass border-destructive/20">
            <CardHeader>
              <CardTitle className="font-display text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleSignOut}>
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
