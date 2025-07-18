
'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Leave, LeaveBalance, UserProfile } from '@/lib/types';
import { format } from 'date-fns';
import { Calendar, Check, Briefcase, User, UserCheck, Users, X, Sun, Umbrella, Loader2, Download, AlertCircle, TrendingUp, BarChart, Clock } from 'lucide-react';
import { updateLeaveStatus } from '@/app/actions';
import { predictLeaveSpikes } from '@/ai/flows/predict-leave-spikes';
import type { PredictLeaveSpikesOutput } from '@/ai/flows/predict-leave-spikes';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const LeaveDialog = dynamic(() => import('@/components/leave-dialog').then(mod => mod.LeaveDialog), {
    ssr: false,
    loading: () => <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Apply for Leave</Button>
});

type LeaveClientProps = {
  currentUser: UserProfile;
  initialLeaves: Leave[];
  initialBalance: LeaveBalance | null;
  initialStats: {
    totalEmployees: number;
    presentToday: number;
    absentToday: number;
    pendingRequests: number;
  };
  leaveOverlap: boolean;
};

const leaveTypeDetails = {
    sick: { icon: Umbrella, color: "text-blue-500", label: "Sick Leave" },
    casual: { icon: Sun, color: "text-yellow-500", label: "Casual Leave" },
    earned: { icon: Briefcase, color: "text-green-500", label: "Earned Leave" },
    unpaid: { icon: User, color: "text-gray-500", label: "Unpaid Leave" },
};

const statusColors: { [key: string]: string } = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};


function LeaveStatusBadge({ status }: { status: Leave['status']}) {
    return (
        <Badge variant="secondary" className={`capitalize ${statusColors[status]}`}>
            {status}
        </Badge>
    )
}

function LeaveActionForm({ leaveId, newStatus, children }: { leaveId: string, newStatus: 'approved' | 'rejected', children: React.ReactNode }) {
    const action = updateLeaveStatus.bind(null, leaveId, newStatus);
    return <form action={action}>{children}</form>
}

export function LeaveClient({
  currentUser,
  initialLeaves,
  initialBalance,
  initialStats,
  leaveOverlap,
}: LeaveClientProps) {
  const [leaves, setLeaves] = React.useState(initialLeaves);
  const [balance, setBalance] = React.useState(initialBalance);
  const [stats, setStats] = React.useState(initialStats);
  const { toast } = useToast();
  const supabase = createClient();

  const refetchData = React.useCallback(async () => {
    // In a real app, this would be a more targeted fetch based on the user's role.
    // For the demo, reloading the data from the server ensures everything is consistent.
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        let leavesQuery = supabase.from('leaves').select('*, users(full_name, avatar_url, department)');
        if (currentUser.role === 'manager' || currentUser.role === 'team_lead') {
            if (currentUser.department) {
                const { data: teamMembers } = await supabase.from('users').select('id').eq('department', currentUser.department);
                const teamMemberIds = teamMembers?.map(tm => tm.id) || [currentUser.id];
                leavesQuery = leavesQuery.in('user_id', teamMemberIds);
            } else {
                leavesQuery = leavesQuery.eq('user_id', currentUser.id);
            }
        } else if (currentUser.role === 'employee' || currentUser.role === 'intern') {
            leavesQuery = leavesQuery.eq('user_id', currentUser.id);
        }
        const { data: leavesData } = await leavesQuery.order('created_at', { ascending: false });
        setLeaves(leavesData || []);

        const { data: balanceData } = await supabase.from('leave_balances').select('*').eq('user_id', user.id).single();
        setBalance(balanceData || null);
    }
  }, [supabase, currentUser]);

  // Real-time updates
  React.useEffect(() => {
    const channel = supabase
      .channel('realtime-leaves')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leaves' },
        (payload) => {
          toast({ title: 'Leave records updated.' });
          refetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast, supabase, refetchData]);
  
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'super_hr' || currentUser.role === 'hr_manager';
  const isManager = currentUser.role === 'manager' || currentUser.role === 'team_lead';

  const renderContent = () => {
    if (isAdmin) return <AdminLeaveView leaves={leaves} stats={stats} />;
    if (isManager) return <ManagerLeaveView leaves={leaves.filter(l => l.users?.department === currentUser.department)} currentUser={currentUser} leaveOverlap={leaveOverlap}/>;
    return <EmployeeLeaveView leaves={leaves.filter(l => l.user_id === currentUser.id)} balance={balance} user={currentUser} onLeaveApplied={refetchData} />;
  };

  return <div>{renderContent()}</div>;
}


function AdminLeaveView({ leaves, stats }: { leaves: Leave[], stats: LeaveClientProps['initialStats'] }) {
    const [isPredicting, setIsPredicting] = React.useState(false);
    const [prediction, setPrediction] = React.useState<PredictLeaveSpikesOutput | null>(null);
    const { toast } = useToast();

    const handlePredict = async () => {
        setIsPredicting(true);
        setPrediction(null);
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0); 
            
            const relevantLeaves = leaves.filter(l => new Date(l.end_date) >= today || l.status === 'pending');

            if (relevantLeaves.length === 0) {
              toast({ title: "No Data", description: "There are no upcoming or pending leaves to analyze." });
              setIsPredicting(false);
              return;
            }

            const records = relevantLeaves.map(l => ({
                leave_type: l.leave_type,
                start_date: l.start_date,
                end_date: l.end_date,
                total_days: l.total_days,
                department: l.users?.department || 'Unknown',
            }));

            const result = await predictLeaveSpikes({
                leaveRecords: records,
                analysisPeriod: 'Next 30 days',
                country: 'India'
            });
            setPrediction(result);
            toast({ title: "Prediction Complete", description: "AI analysis of leave spikes is ready." });
        } catch (error) {
            console.error(error);
            toast({ title: "Prediction Failed", description: "Could not run AI analysis.", variant: "destructive"});
        } finally {
            setIsPredicting(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Employees</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalEmployees}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Present Today</CardTitle><UserCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.presentToday}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Absent Today</CardTitle><X className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.absentToday}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pending Requests</CardTitle><AlertCircle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.pendingRequests}</div></CardContent></Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>AI-Powered Leave Analysis</CardTitle>
                            <CardDescription>Predict absenteeism spikes and analyze trends for upcoming leaves.</CardDescription>
                        </div>
                        <Button onClick={handlePredict} disabled={isPredicting}>
                            {isPredicting ? <Loader2 className="mr-2 animate-spin"/> : <TrendingUp className="mr-2" />}
                            Predict Spikes
                        </Button>
                    </div>
                </CardHeader>
                {prediction && (
                    <CardContent>
                        <Alert variant={prediction.prediction.isSpikePredicted ? "destructive" : "default"}>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>{prediction.prediction.isSpikePredicted ? `Spike Predicted for ${prediction.prediction.predictedSpikeDate}` : "No Significant Spike Predicted"}</AlertTitle>
                            <AlertDescription>{prediction.prediction.reasoning}</AlertDescription>
                        </Alert>
                    </CardContent>
                )}
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Leave Log</CardTitle>
                        <Button variant="outline"><Download className="mr-2"/>Export Report</Button>
                    </div>
                    <CardDescription>Comprehensive log of all leave requests across the organization.</CardDescription>
                </CardHeader>
                <CardContent>
                    <LeaveTable leaves={leaves} />
                </CardContent>
            </Card>
        </div>
    )
}

function ManagerLeaveView({ leaves, currentUser, leaveOverlap }: { leaves: Leave[], currentUser: UserProfile, leaveOverlap: boolean }) {
    const pendingRequests = leaves.filter(l => l.status === 'pending');
    
    return (
        <div className="space-y-6">
            {leaveOverlap && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Leave Overlap Warning!</AlertTitle>
                    <AlertDescription>
                        More than 2 team members have applied for leave on the same day. Please review carefully.
                    </AlertDescription>
                </Alert>
            )}
            <Card>
                <CardHeader>
                    <CardTitle>Team Leave Requests</CardTitle>
                    <CardDescription>Approve or reject leave requests from your team members.</CardDescription>
                </CardHeader>
                <CardContent>
                    {pendingRequests.length > 0 ? (
                        <div className="space-y-4">
                            {pendingRequests.map(request => (
                                <div key={request.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                                   <div className="flex items-center gap-3">
                                     <Avatar>
                                        <AvatarImage src={request.users?.avatar_url || undefined} />
                                        <AvatarFallback>{request.users?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{request.users?.full_name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            <span className="capitalize">{request.leave_type}</span>: {format(new Date(request.start_date), 'MMM d')} - {format(new Date(request.end_date), 'MMM d')}
                                        </p>
                                        <p className="text-sm text-muted-foreground italic">"{request.reason}"</p>
                                    </div>
                                   </div>
                                   <div className="flex gap-2">
                                        <LeaveActionForm leaveId={request.id} newStatus="approved">
                                            <Button size="sm" variant="outline" type="submit"><Check className="mr-2" />Approve</Button>
                                        </LeaveActionForm>
                                        <LeaveActionForm leaveId={request.id} newStatus="rejected">
                                            <Button size="sm" variant="ghost" type="submit"><X className="mr-2" />Reject</Button>
                                        </LeaveActionForm>
                                   </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Clock className="mx-auto h-8 w-8 mb-2" />
                            <p>No pending requests. Great job!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Full Team Leave History</CardTitle>
                </CardHeader>
                <CardContent>
                    <LeaveTable leaves={leaves} />
                </CardContent>
            </Card>
        </div>
    )
}

function EmployeeLeaveView({ leaves, balance, user, onLeaveApplied }: { leaves: Leave[], balance: LeaveBalance | null, user: UserProfile, onLeaveApplied: () => void }) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>My Leave Balances</CardTitle>
                        <CardDescription>Your available leave days as of today.</CardDescription>
                    </div>
                    <LeaveDialog user={user} balance={balance} onLeaveApplied={onLeaveApplied}>
                        <Button>Apply for Leave</Button>
                    </LeaveDialog>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sick Leave</CardTitle>
                            <Umbrella className="h-4 w-4 text-blue-500"/>
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold">{balance?.sick_leave ?? 0}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Casual Leave</CardTitle>
                            <Sun className="h-4 w-4 text-yellow-500"/>
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold">{balance?.casual_leave ?? 0}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Earned Leave</CardTitle>
                            <Briefcase className="h-4 w-4 text-green-500"/>
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold">{balance?.earned_leave ?? 0}</div></CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Unpaid Leave</CardTitle>
                            <User className="h-4 w-4 text-gray-500"/>
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold">{balance?.unpaid_leave ?? 0}</div></CardContent>
                    </Card>
                </CardContent>
            </Card>
            
            <div className="grid md:grid-cols-2 gap-6">
                <Card className="opacity-60 cursor-not-allowed">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChart /> Salary Breakdown</CardTitle>
                        <CardDescription>Visualize your CTC vs in-hand salary.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center text-muted-foreground py-10">
                            <p>Salary breakdown visualizer coming soon.</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="opacity-60 cursor-not-allowed">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><TrendingUp /> Leave Forecast</CardTitle>
                        <CardDescription>AI suggests the best dates for your next vacation.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="text-center text-muted-foreground py-10">
                            <p>Leave forecast tool coming soon.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>My Leave History</CardTitle>
                    <CardDescription>Track the status of your past and present leave requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    <LeaveTable leaves={leaves} isEmployeeView={true} />
                </CardContent>
            </Card>
        </div>
    )
}

function LeaveTable({ leaves, isEmployeeView = false }: { leaves: Leave[], isEmployeeView?: boolean }) {
  if (!leaves || leaves.length === 0) {
    return <p className="text-sm text-center text-muted-foreground py-4">No leave records found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {!isEmployeeView && <TableHead>Employee</TableHead>}
          <TableHead>Leave Type</TableHead>
          <TableHead>Dates</TableHead>
          <TableHead>Total Days</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Reason</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leaves.map((leave) => (
          <TableRow key={leave.id}>
            {!isEmployeeView && (
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={leave.users?.avatar_url || undefined} />
                    <AvatarFallback>{leave.users?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{leave.users?.full_name}</span>
                </div>
              </TableCell>
            )}
            <TableCell>
                <div className="flex items-center gap-2 capitalize">
                    {React.createElement(leaveTypeDetails[leave.leave_type].icon, { className: `h-4 w-4 ${leaveTypeDetails[leave.leave_type].color}`})}
                    <span>{leaveTypeDetails[leave.leave_type].label}</span>
                </div>
            </TableCell>
            <TableCell>
              {format(new Date(leave.start_date), 'PPP')} - {format(new Date(leave.end_date), 'PPP')}
            </TableCell>
            <TableCell>{leave.total_days}</TableCell>
            <TableCell>
              <LeaveStatusBadge status={leave.status} />
            </TableCell>
            <TableCell>{leave.reason}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
