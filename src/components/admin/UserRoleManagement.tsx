import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Users,
  Search,
  Plus,
  Trash2,
  Loader2,
  Shield,
  UserCog,
  UsersRound,
  X,
  Minus,
  Download,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow, differenceInHours } from 'date-fns';

interface UserWithRoles {
  user_id: string;
  email: string;
  full_name: string | null;
  roles: string[];
  last_login_at: string | null;
}

const AVAILABLE_ROLES = ['admin', 'host', 'participant', 'viewer'] as const;

const UserRoleManagement = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [roleToAdd, setRoleToAdd] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [roleToRemove, setRoleToRemove] = useState<{ userId: string; role: string; userName: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Bulk selection state
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isBulkRemoveDialogOpen, setIsBulkRemoveDialogOpen] = useState(false);
  const [bulkRole, setBulkRole] = useState<string>('');
  const [bulkRemoveRole, setBulkRemoveRole] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

  const sendRoleChangeNotification = async (targetUserId: string, action: 'add' | 'remove', role: string) => {
    try {
      const { error } = await supabase.functions.invoke('notify-role-change', {
        body: {
          targetUserId,
          action,
          role,
          adminName: profile?.full_name || profile?.email || 'Admin',
        },
      });

      if (error) {
        console.error('Failed to send role change notification:', error);
      }
    } catch (err) {
      console.error('Error sending notification:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, last_login_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRoles[] = (profiles || []).map((profile) => ({
        user_id: profile.user_id,
        email: profile.email,
        full_name: profile.full_name,
        last_login_at: profile.last_login_at,
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
        sendRoleChangeNotification(selectedUser.user_id, 'add', roleToAdd);
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
      sendRoleChangeNotification(userId, 'remove', role);
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

  // Bulk selection handlers
  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUserIds);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUserIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map((u) => u.user_id)));
    }
  };

  const clearSelection = () => {
    setSelectedUserIds(new Set());
  };

  const handleBulkAddRole = async () => {
    if (!bulkRole || selectedUserIds.size === 0) return;

    setActionLoading(true);
    let successCount = 0;
    let skipCount = 0;

    try {
      const selectedUsers = users.filter((u) => selectedUserIds.has(u.user_id));
      
      for (const user of selectedUsers) {
        // Skip if user already has the role
        if (user.roles.includes(bulkRole)) {
          skipCount++;
          continue;
        }

        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.user_id,
            role: bulkRole as 'admin' | 'host' | 'participant' | 'viewer',
          });

        if (!error) {
          successCount++;
          // Send notification in background
          sendRoleChangeNotification(user.user_id, 'add', bulkRole);
        }
      }

      if (successCount > 0) {
        toast.success(`Added ${bulkRole} role to ${successCount} user${successCount > 1 ? 's' : ''}`);
      }
      if (skipCount > 0) {
        toast.info(`${skipCount} user${skipCount > 1 ? 's' : ''} already had the ${bulkRole} role`);
      }

      fetchUsers();
      clearSelection();
    } catch (error) {
      console.error('Error in bulk role assignment:', error);
      toast.error('Some role assignments failed');
    } finally {
      setActionLoading(false);
      setIsBulkDialogOpen(false);
      setBulkRole('');
    }
  };

  const handleBulkRemoveRole = async () => {
    if (!bulkRemoveRole || selectedUserIds.size === 0) return;

    // Show confirmation for admin role
    if (bulkRemoveRole === 'admin') {
      const confirmRemove = window.confirm(
        `Are you sure you want to remove admin privileges from ${selectedUserIds.size} user(s)? This will revoke their administrative access.`
      );
      if (!confirmRemove) return;
    }

    setActionLoading(true);
    let successCount = 0;
    let skipCount = 0;

    try {
      const selectedUsers = users.filter((u) => selectedUserIds.has(u.user_id));
      
      for (const user of selectedUsers) {
        // Skip if user doesn't have the role
        if (!user.roles.includes(bulkRemoveRole)) {
          skipCount++;
          continue;
        }

        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.user_id)
          .eq('role', bulkRemoveRole as 'admin' | 'host' | 'participant' | 'viewer');

        if (!error) {
          successCount++;
          // Send notification in background
          sendRoleChangeNotification(user.user_id, 'remove', bulkRemoveRole);
        }
      }

      if (successCount > 0) {
        toast.success(`Removed ${bulkRemoveRole} role from ${successCount} user${successCount > 1 ? 's' : ''}`);
      }
      if (skipCount > 0) {
        toast.info(`${skipCount} user${skipCount > 1 ? 's' : ''} didn't have the ${bulkRemoveRole} role`);
      }

      fetchUsers();
      clearSelection();
    } catch (error) {
      console.error('Error in bulk role removal:', error);
      toast.error('Some role removals failed');
    } finally {
      setActionLoading(false);
      setIsBulkRemoveDialogOpen(false);
      setBulkRemoveRole('');
    }
  };

  // Get common roles among selected users for bulk removal
  const getCommonRolesForSelectedUsers = () => {
    const selectedUsers = users.filter((u) => selectedUserIds.has(u.user_id));
    if (selectedUsers.length === 0) return [];
    
    // Get all roles that at least one selected user has
    const allRoles = new Set<string>();
    selectedUsers.forEach((user) => {
      user.roles.forEach((role) => allRoles.add(role));
    });
    
    return Array.from(allRoles);
  };

  const filteredUsers = users
    .filter((user) => {
      const matchesSearch =
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      const matchesRole =
        roleFilter === 'all' ||
        (roleFilter === 'no-roles' && user.roles.length === 0) ||
        user.roles.includes(roleFilter);
      
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return (a.full_name || '').localeCompare(b.full_name || '');
        case 'name-desc':
          return (b.full_name || '').localeCompare(a.full_name || '');
        case 'email-asc':
          return a.email.localeCompare(b.email);
        case 'email-desc':
          return b.email.localeCompare(a.email);
        case 'roles-asc':
          return a.roles.length - b.roles.length;
        case 'roles-desc':
          return b.roles.length - a.roles.length;
        default:
          return 0;
      }
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, sortBy, pageSize]);

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

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'User ID', 'Roles', 'Export Date'];
    const exportDate = new Date().toISOString();
    
    const rows = users.map((user) => [
      user.full_name || 'No name',
      user.email,
      user.user_id,
      user.roles.join('; ') || 'No roles',
      exportDate,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => 
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `user-roles-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${users.length} users to CSV`);
  };

  const isAllSelected = paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedUserIds.has(u.user_id));
  const isSomeSelected = paginatedUsers.some((u) => selectedUserIds.has(u.user_id)) && !isAllSelected;

  const handleToggleSelectAllOnPage = () => {
    if (isAllSelected) {
      // Deselect all on current page
      const newSelection = new Set(selectedUserIds);
      paginatedUsers.forEach((u) => newSelection.delete(u.user_id));
      setSelectedUserIds(newSelection);
    } else {
      // Select all on current page
      const newSelection = new Set(selectedUserIds);
      paginatedUsers.forEach((u) => newSelection.add(u.user_id));
      setSelectedUserIds(newSelection);
    }
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
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={users.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-36">
                <Filter className="h-4 w-4 mr-1" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="no-roles">No Roles</SelectItem>
                {AVAILABLE_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <ArrowUpDown className="h-4 w-4 mr-1" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="email-asc">Email (A-Z)</SelectItem>
                <SelectItem value="email-desc">Email (Z-A)</SelectItem>
                <SelectItem value="roles-asc">Roles (Fewest)</SelectItem>
                <SelectItem value="roles-desc">Roles (Most)</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Bulk Action Bar */}
        {selectedUserIds.size > 0 && (
          <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <UsersRound className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium">
                {selectedUserIds.size} user{selectedUserIds.size > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setIsBulkDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Assign Role
              </Button>
              {getCommonRolesForSelectedUsers().length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => setIsBulkRemoveDialogOpen(true)}
                >
                  <Minus className="h-4 w-4 mr-1" />
                  Remove Role
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleToggleSelectAllOnPage}
                        aria-label="Select all on page"
                        className={isSomeSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Session Status</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user) => (
                      <TableRow 
                        key={user.user_id}
                        className={selectedUserIds.has(user.user_id) ? 'bg-primary/5' : ''}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedUserIds.has(user.user_id)}
                            onCheckedChange={() => toggleUserSelection(user.user_id)}
                            aria-label={`Select ${user.full_name || user.email}`}
                          />
                        </TableCell>
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
                          {(() => {
                            const SESSION_EXPIRY_HOURS = 168; // 7 days default
                            if (!user.last_login_at) {
                              return (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <AlertCircle className="h-4 w-4" />
                                  <span className="text-sm">Never logged in</span>
                                </div>
                              );
                            }
                            const lastLogin = new Date(user.last_login_at);
                            const hoursSinceLogin = differenceInHours(new Date(), lastLogin);
                            const isExpired = hoursSinceLogin >= SESSION_EXPIRY_HOURS;
                            const hoursRemaining = SESSION_EXPIRY_HOURS - hoursSinceLogin;
                            
                            return (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">
                                    {formatDistanceToNow(lastLogin, { addSuffix: true })}
                                  </span>
                                </div>
                                <Badge 
                                  variant={isExpired ? "destructive" : hoursRemaining < 24 ? "secondary" : "outline"}
                                  className="text-xs"
                                >
                                  {isExpired 
                                    ? "Session expired" 
                                    : hoursRemaining < 24 
                                      ? `Expires in ${hoursRemaining}h`
                                      : `Expires in ${Math.floor(hoursRemaining / 24)}d`
                                  }
                                </Badge>
                              </div>
                            );
                          })()}
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
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {searchQuery || roleFilter !== 'all' ? 'No users found matching your filters' : 'No users found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {filteredUsers.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Show</span>
                  <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                    <SelectTrigger className="w-16 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span>per page</span>
                  <span className="ml-2">
                    · Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </>
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

      {/* Bulk Assign Role Dialog */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UsersRound className="h-5 w-5" />
              Bulk Role Assignment
            </DialogTitle>
            <DialogDescription>
              Assign a role to {selectedUserIds.size} selected user{selectedUserIds.size > 1 ? 's' : ''}. 
              Users who already have the role will be skipped.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={bulkRole} onValueChange={setBulkRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role to assign" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_ROLES.map((role) => (
                  <SelectItem key={role} value={role} className="capitalize">
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAddRole} disabled={!bulkRole || actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Assign to {selectedUserIds.size} User{selectedUserIds.size > 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Remove Role Dialog */}
      <Dialog open={isBulkRemoveDialogOpen} onOpenChange={setIsBulkRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Minus className="h-5 w-5" />
              Bulk Role Removal
            </DialogTitle>
            <DialogDescription>
              Remove a role from {selectedUserIds.size} selected user{selectedUserIds.size > 1 ? 's' : ''}. 
              Users who don't have the role will be skipped.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={bulkRemoveRole} onValueChange={setBulkRemoveRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role to remove" />
              </SelectTrigger>
              <SelectContent>
                {getCommonRolesForSelectedUsers().map((role) => (
                  <SelectItem key={role} value={role} className="capitalize">
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBulkRemoveRole} 
              disabled={!bulkRemoveRole || actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remove from {selectedUserIds.size} User{selectedUserIds.size > 1 ? 's' : ''}
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
