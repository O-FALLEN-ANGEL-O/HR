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
import { ScrollArea } from '@/components/ui/scroll-area';

const roleOptions: UserRole[] = [
  'admin',
  'super_hr',
  'hr_manager',
  'recruiter',
  'interviewer',
  'manager',
  'team_lead',
  'employee',
  'intern',
  'guest',
  'finance',
  'it_admin',
  'support',
  'auditor'
];

export default function RoleManagerClient({ users: initialUsers }: { users: UserProfile[] }) {
  const [users, setUsers] = React.useState(initialUsers);
  const { toast } = useToast();
  const [isClient, setIsClient] = React.useState(false);
  const supabase = createClient();

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({ title: "Error", description: "Could not refresh user list."});
    } else {
      setUsers(data || []);
    }
  }

  React.useEffect(() => {
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
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, toast]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const originalUsers = [...users];
    
    setUsers(users.map(u => u.id === userId ? {...u, role: newRole} : u));

    try {
      await updateUserRole(userId, newRole);
      toast({
        title: 'Success!',
        description: `User role has been updated to ${newRole}.`,
      });
    } catch (error: any) {
      setUsers(originalUsers);
      toast({
        variant: 'destructive',
        title: 'Error updating role',
        description: error.message,
      });
    }
  };


  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>User Role Management</CardTitle>
          <CardDescription>View and manage user roles across the application.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[65vh] w-full">
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
                        <span className="font-medium whitespace-nowrap">{user.full_name || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{user.email}</TableCell>
                    <TableCell>{user.department || 'N/A'}</TableCell>
                    <TableCell className="whitespace-nowrap">{isClient ? format(new Date(user.created_at), 'PPP') : ''}</TableCell>
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
                              {role.replace(/_/g, ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
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
