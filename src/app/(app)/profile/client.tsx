'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { LeaveBalance, UserProfile } from '@/lib/types';
import { Mail, Phone, Pencil, Calendar, Droplets, Briefcase, Users, Laptop, UserCheck } from 'lucide-react';
import { DashboardCard } from '../employee/dashboard/dashboard-card';

type ProfileClientProps = {
  user: UserProfile;
  manager: UserProfile | null;
  teamMembers: UserProfile[];
  leaveBalance: LeaveBalance | null;
};

export default function ProfileClient({ user, manager, teamMembers, leaveBalance }: ProfileClientProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardCard delay={0} className="lg:col-span-1">
            <Card className="h-full">
                <CardHeader className="items-center text-center">
                    <Avatar className="w-24 h-24 mb-2">
                        <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || 'User'} />
                        <AvatarFallback className="text-3xl">{user.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-2xl">{user.full_name}</CardTitle>
                    <CardDescription className="capitalize">{user.job_title || user.role.replace(/_/g, ' ')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <a href={`mailto:${user.email}`} className="text-primary hover:underline">{user.email}</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{user.phone || 'Not provided'}</span>
                    </div>
                </CardContent>
                 <CardContent>
                    <Button className="w-full" variant="outline"><Pencil className="mr-2 h-4 w-4" /> Edit Profile</Button>
                </CardContent>
            </Card>
        </DashboardCard>
        <DashboardCard delay={0.1} className="lg:col-span-2">
            <Tabs defaultValue="personal">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="job">Job</TabsTrigger>
                    <TabsTrigger value="balances">Balances</TabsTrigger>
                    <TabsTrigger value="assets">Assets</TabsTrigger>
                </TabsList>
                <TabsContent value="personal" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Personal Details</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <InfoField icon={Calendar} label="Joining Date" value={format(new Date(user.created_at), "PPP")} />
                            <InfoField icon={Calendar} label="Date of Birth" value={user.dob ? format(new Date(user.dob), "PPP") : 'Not provided'} />
                            <InfoField icon={Users} label="Gender" value={user.gender || 'Not provided'} />
                            <InfoField icon={Droplets} label="Blood Group" value={user.blood_group || 'Not provided'} />
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="job" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Job Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <InfoField icon={UserCheck} label="Reporting Manager">
                                {manager ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={manager.avatar_url || undefined} />
                                            <AvatarFallback>{manager.full_name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span>{manager.full_name}</span>
                                    </div>
                                ) : 'Not assigned'}
                            </InfoField>
                            <InfoField icon={Briefcase} label="Department" value={user.department || 'N/A'} />
                            <div>
                                <h3 className="text-sm font-medium flex items-center mb-2"><Users className="mr-2 w-4 h-4 text-muted-foreground" /> Team Members</h3>
                                <div className="flex flex-wrap gap-4">
                                    {teamMembers.map(member => (
                                        <div key={member.id} className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={member.avatar_url || undefined} />
                                                <AvatarFallback>{member.full_name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-medium">{member.full_name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="balances" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Leave Balances</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="flex justify-between items-center p-3 border rounded-md"><span className="text-sm text-muted-foreground">Casual Leave</span><span className="font-bold text-lg">{leaveBalance?.casual_leave ?? 'N/A'}</span></div>
                            <div className="flex justify-between items-center p-3 border rounded-md"><span className="text-sm text-muted-foreground">Sick Leave</span><span className="font-bold text-lg">{leaveBalance?.sick_leave ?? 'N/A'}</span></div>
                            <div className="flex justify-between items-center p-3 border rounded-md"><span className="text-sm text-muted-foreground">Earned Leave</span><span className="font-bold text-lg">{leaveBalance?.earned_leave ?? 'N/A'}</span></div>
                            <div className="flex justify-between items-center p-3 border rounded-md"><span className="text-sm text-muted-foreground">Unpaid Leave</span><span className="font-bold text-lg">{leaveBalance?.unpaid_leave ?? 'N/A'}</span></div>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="assets" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Assigned Assets</CardTitle></CardHeader>
                        <CardContent>
                             <div className="text-center text-muted-foreground py-10">
                                <Laptop className="mx-auto h-12 w-12 mb-4"/>
                                <p>No company assets are currently assigned to you.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </DashboardCard>
    </div>
  );
}

const InfoField = ({ icon: Icon, label, value, children }: { icon: React.ElementType, label: string, value?: string | React.ReactNode, children?: React.ReactNode }) => (
  <div>
    <h3 className="text-sm font-medium flex items-center mb-1">
        <Icon className="mr-2 w-4 h-4 text-muted-foreground" /> {label}
    </h3>
    {value ? <p className="text-md text-foreground pl-6">{value}</p> : <div className="pl-6">{children}</div>}
  </div>
);
