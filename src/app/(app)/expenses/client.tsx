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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, FileText, Check, X, CircleDollarSign } from 'lucide-react';
import type { ExpenseReport } from '@/lib/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { NewExpenseDialog } from '@/components/new-expense-dialog';

const statusColors: { [key: string]: string } = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  reimbursed: 'bg-purple-100 text-purple-800',
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export default function ExpensesClient({ initialReports }: { initialReports: ExpenseReport[] }) {
  const [reports, setReports] = React.useState(initialReports);
  const { toast } = useToast();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const refetchReports = React.useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('expense_reports')
        .select('*, users(full_name, avatar_url), expense_items(*)')
        .order('submitted_at', { ascending: false });
    if (error) {
        toast({ title: "Error", description: "Could not refetch expense reports." });
    } else {
        setReports(data as ExpenseReport[]);
    }
  }, [toast]);

  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime-expenses')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expense_reports' },
        () => {
            toast({ title: 'Expenses Updated', description: 'The list of expense reports has been refreshed.' });
            refetchReports();
        }
      )
      .subscribe();
      
      return () => {
          supabase.removeChannel(channel);
      }
  }, [refetchReports, toast]);


  return (
    <Card>
        <CardHeader className="flex flex-row justify-between items-center">
            <div>
                <CardTitle>My Expense Reports</CardTitle>
                <CardDescription>Submit and track your expense reports.</CardDescription>
            </div>
            <NewExpenseDialog onReportAdded={refetchReports}>
              <Button><PlusCircle className="mr-2 h-4 w-4"/> New Report</Button>
            </NewExpenseDialog>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reports.map((report) => (
                        <TableRow key={report.id}>
                            <TableCell className="font-medium">{report.title}</TableCell>
                            <TableCell>{report.users?.full_name}</TableCell>
                            <TableCell>{isClient && report.submitted_at ? format(new Date(report.submitted_at), 'PPP') : ''}</TableCell>
                            <TableCell>{formatCurrency(report.total_amount)}</TableCell>
                            <TableCell>
                                <Badge variant="secondary" className={`capitalize ${statusColors[report.status]}`}>{report.status}</Badge>
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem><FileText className="mr-2 h-4 w-4"/> View Details</DropdownMenuItem>
                                        <DropdownMenuItem><Check className="mr-2 h-4 w-4"/> Approve</DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-500"><X className="mr-2 h-4 w-4"/> Reject</DropdownMenuItem>
                                        <DropdownMenuItem><CircleDollarSign className="mr-2 h-4 w-4"/> Mark as Reimbursed</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
  );
}
