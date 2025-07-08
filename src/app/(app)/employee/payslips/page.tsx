import { Header } from '@/components/header';
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
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { Payslip } from '@/lib/types';
import { currentUser } from '@/lib/data';

const mockPayslips: Payslip[] = [
  { id: 'ps-1', month: 'May', year: 2024, grossSalary: 5000, netSalary: 4200, downloadUrl: '#' },
  { id: 'ps-2', month: 'April', year: 2024, grossSalary: 5000, netSalary: 4200, downloadUrl: '#' },
  { id: 'ps-3', month: 'March', year: 2024, grossSalary: 4800, netSalary: 4050, downloadUrl: '#' },
  { id: 'ps-4', month: 'February', year: 2024, grossSalary: 4800, netSalary: 4050, downloadUrl: '#' },
  { id: 'ps-5', month: 'January', year: 2024, grossSalary: 4800, netSalary: 4050, downloadUrl: '#' },
];

export default function PayslipsPage() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Header title="My Payslips" />
      <Card>
        <CardHeader>
          <CardTitle>Payslip History</CardTitle>
          <CardDescription>
            Here is a list of your recent payslips for {currentUser.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pay Period</TableHead>
                <TableHead>Gross Salary</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPayslips.map((payslip) => (
                <TableRow key={payslip.id}>
                  <TableCell className="font-medium">
                    {payslip.month} {payslip.year}
                  </TableCell>
                  <TableCell>{formatCurrency(payslip.grossSalary)}</TableCell>
                  <TableCell>{formatCurrency(payslip.netSalary)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <a href={payslip.downloadUrl}>
                        <Download className="mr-2" />
                        Download
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
