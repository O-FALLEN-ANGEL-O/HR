'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { type UserProfile, type UserRole } from '@/lib/types';
import { updateUserRole } from '../actions';
import { History } from 'lucide-react';

const roleOptions: UserRole[] = [
  'admin',
  'super_hr',
  'hr_manager',
  'recruiter',
  'interviewer',
  'manager',
  'employee',
  'intern',
  'guest',
];

export default function RoleManagerClient({ users: initialUsers }: { users: UserProfile[] }) {
  const [users, setUsers] = React.useState(initialUsers);
  const { toast } = useToast();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime-users')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          toast({
            title: 'User Data Updated',
            description: 'The list of users has been refreshed.',
          });
          if (payload.eventType === 'INSERT') {
            setUsers((prev) => [payload.new as UserProfile, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setUsers((prev) =>
              prev.map((user) =>
                user.id === payload.new.id ? { ...user, ...(payload.new as UserProfile) } : user
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setUsers((prev) => prev.filter((user) => user.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const originalUsers = [...users];
    
    // Optimistically update the UI
    setUsers(users.map(u => u.id === userId ? {...u, role: newRole} : u));

    try {
      await updateUserRole(userId, newRole);
      toast({
        title: 'Success!',
        description: `User role has been updated to ${newRole}.`,
      });
    } catch (error: any) {
      // Revert the UI on error
      setUsers(originalUsers);
      toast({
        variant: 'destructive',
        title: 'Error updating role',
        description: error.message,
      });
    }
  };


  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>User Role Management</CardTitle>
          <CardDescription>View and manage user roles across the application.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>{user.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.full_name || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.department || 'N/A'}</TableCell>
                  <TableCell>{isClient ? format(new Date(user.created_at), 'PPP') : ''}</TableCell>
                  <TableCell>
                    <Select
                      defaultValue={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                    >
                      <SelectTrigger className="w-[180px] capitalize">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role} value={role} className="capitalize">
                            {role.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History /> Role Audit History</CardTitle>
          <CardDescription>Timeline of all role changes made in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-10">
            <p>Role audit history feature is coming soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
