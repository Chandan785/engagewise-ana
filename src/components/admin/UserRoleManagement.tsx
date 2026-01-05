import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Users,
  Search,
  Plus,
  Trash2,
  Loader2,
  Shield,
  UserCog,
} from 'lucide-react';

interface UserWithRoles {
  user_id: string;
  email: string;
  full_name: string | null;
  roles: string[];
}

const AVAILABLE_ROLES = ['admin', 'host', 'participant', 'viewer'] as const;

const UserRoleManagement = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [roleToAdd, setRoleToAdd] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [roleToRemove, setRoleToRemove] = useState<{ userId: string; role: string; userName: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Merge profiles with their roles
      const usersWithRoles: UserWithRoles[] = (profiles || []).map((profile) => ({
        user_id: profile.user_id,
        email: profile.email,
        full_name: profile.full_name,
        roles: (roles || [])
          .filter((r) => r.user_id === profile.user_id)
          .map((r) => r.role),
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddRole = async () => {
    if (!selectedUser || !roleToAdd) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser.user_id,
          role: roleToAdd as 'admin' | 'host' | 'participant' | 'viewer',
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('User already has this role');
        } else {
          throw error;
        }
      } else {
        toast.success(`Added ${roleToAdd} role to ${selectedUser.full_name || selectedUser.email}`);
        fetchUsers();
      }
    } catch (error) {
      console.error('Error adding role:', error);
      toast.error('Failed to add role');
    } finally {
      setActionLoading(false);
      setIsDialogOpen(false);
      setRoleToAdd('');
    }
  };

  const confirmRemoveRole = (userId: string, role: string, userName: string) => {
    if (role === 'admin') {
      setRoleToRemove({ userId, role, userName });
      setIsRemoveDialogOpen(true);
    } else {
      handleRemoveRole(userId, role);
    }
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role as 'admin' | 'host' | 'participant' | 'viewer');

      if (error) throw error;

      toast.success(`Removed ${role} role`);
      fetchUsers();
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error('Failed to remove role');
    } finally {
      setActionLoading(false);
      setIsRemoveDialogOpen(false);
      setRoleToRemove(null);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeClass = (role: string): string => {
    switch (role) {
      case 'admin':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20';
      case 'host':
        return 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20';
      case 'participant':
        return 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20';
      default:
        return 'bg-muted text-muted-foreground border-muted hover:bg-muted/80';
    }
  };

  const getAvailableRolesForUser = (user: UserWithRoles) => {
    return AVAILABLE_ROLES.filter((role) => !user.roles.includes(role));
  };

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="font-display flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              User Role Management
            </CardTitle>
            <CardDescription>Assign and remove roles for users</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {user.full_name || 'No name'}
                            </p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <Badge
                                key={role}
                                variant="outline"
                                className={`capitalize gap-1 ${getRoleBadgeClass(role)}`}
                              >
                                {role === 'admin' && <Shield className="h-3 w-3" />}
                                {role}
                                <button
                                  onClick={() => confirmRemoveRole(user.user_id, role, user.full_name || user.email)}
                                  className="ml-1 hover:bg-background/20 rounded-full p-0.5"
                                  disabled={actionLoading}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">No roles</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {getAvailableRolesForUser(user).length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Role
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'No users found matching your search' : 'No users found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Add Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Role</DialogTitle>
            <DialogDescription>
              Add a new role to {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={roleToAdd} onValueChange={setRoleToAdd}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {selectedUser &&
                  getAvailableRolesForUser(selectedUser).map((role) => (
                    <SelectItem key={role} value={role} className="capitalize">
                      {role}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRole} disabled={!roleToAdd || actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Admin Role Confirmation Dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              Remove Admin Role
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove admin privileges from{' '}
              <span className="font-semibold text-foreground">{roleToRemove?.userName}</span>?
              This action will revoke their administrative access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => roleToRemove && handleRemoveRole(roleToRemove.userId, roleToRemove.role)}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remove Admin Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default UserRoleManagement;
