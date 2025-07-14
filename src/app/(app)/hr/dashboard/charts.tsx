'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { BarChart, PieChart, Bar, Pie, Cell, XAxis, CartesianGrid } from 'recharts';

const pieChartConfig = {
    count: {
      label: 'Employees',
    },
    engineering: { label: 'Engineering', color: 'hsl(var(--chart-1))' },
    product: { label: 'Product', color: 'hsl(var(--chart-2))' },
    design: { label: 'Design', color: 'hsl(var(--chart-3))' },
    sales: { label: 'Sales', color: 'hsl(var(--chart-4))' },
    hr: { label: 'HR', color: 'hsl(var(--chart-5))' },
    other: { label: 'Other', color: 'hsl(var(--muted))' },
  };

  const barChartConfig = {
    count: {
      label: 'Applicants',
      color: 'hsl(var(--primary))',
    },
  };

type DashboardChartsProps = {
    employeeDistributionData: any[];
    hiringPipelineData: any[];
}

export function DashboardCharts({ employeeDistributionData, hiringPipelineData }: DashboardChartsProps) {
    return (
        <>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Employee by Department</CardTitle>
                <CardDescription>A breakdown of employees across different departments.</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ChartContainer
                  config={pieChartConfig}
                  className="mx-auto aspect-square h-[250px]"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="role" hideLabel />} />
                    <Pie data={employeeDistributionData} dataKey="count" nameKey="role" innerRadius={50} paddingAngle={2}>
                      {employeeDistributionData.map((entry) => (
                        <Cell key={entry.role} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey="role" />}
                      className="-mt-4"
                    />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Job Funnel</CardTitle>
                 <CardDescription>Applicant progression through the hiring stages.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={barChartConfig} className="h-[280px] w-full">
                  <BarChart data={hiringPipelineData} accessibilityLayer margin={{ top: 20 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="stage"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={8} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
        </>
    )
}
