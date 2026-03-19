import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IndianRupee,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Plus,
  Calendar,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const payments = [
  {
    id: "PAY-2026-001",
    customer: "Sneha Reddy",
    property: "Lake View Towers",
    milestone: "2nd Installment",
    dueDate: "15 Jan 2026",
    amount: "₹25L",
    status: "pending",
    daysOverdue: 0,
  },
  {
    id: "PAY-2026-002",
    customer: "Rajesh Kapoor",
    property: "Sky Villas",
    milestone: "Agreement",
    dueDate: "10 Jan 2026",
    amount: "₹50L",
    status: "overdue",
    daysOverdue: 5,
  },
  {
    id: "PAY-2026-003",
    customer: "Kavita Sharma",
    property: "Green Heights",
    milestone: "Token",
    dueDate: "8 Jan 2026",
    amount: "₹3L",
    status: "received",
    daysOverdue: 0,
  },
  {
    id: "PAY-2026-004",
    customer: "Mohammed Ali",
    property: "Palm Residency",
    milestone: "Final Payment",
    dueDate: "1 Jan 2026",
    amount: "₹35L",
    status: "received",
    daysOverdue: 0,
  },
  {
    id: "PAY-2026-005",
    customer: "Priya Nair",
    property: "Metro Heights",
    milestone: "1st Installment",
    dueDate: "20 Jan 2026",
    amount: "₹15L",
    status: "pending",
    daysOverdue: 0,
  },
];

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  received: { bg: "bg-success/10", text: "text-success", label: "Received" },
  pending: { bg: "bg-warning/10", text: "text-warning", label: "Pending" },
  overdue: { bg: "bg-destructive/10", text: "text-destructive", label: "Overdue" },
};

const Payments = () => {
  return (
    <MainLayout
      title="Payments & Collections"
      subtitle="Track payment milestones and collections"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/10 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Collected (This Month)</p>
                  <p className="text-2xl font-bold">₹4.2 Cr</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-warning/10 rounded-xl">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">₹1.8 Cr</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-destructive/10 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold">₹65L</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Collection Rate</p>
                  <p className="text-2xl font-bold">87%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Collection Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Collection Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Target: ₹5 Cr</span>
                <span className="text-sm font-medium">₹4.2 Cr collected (84%)</span>
              </div>
              <Progress value={84} className="h-3" />
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center p-4 bg-success/10 rounded-lg">
                  <p className="text-2xl font-bold text-success">₹4.2 Cr</p>
                  <p className="text-sm text-muted-foreground">Collected</p>
                </div>
                <div className="text-center p-4 bg-warning/10 rounded-lg">
                  <p className="text-2xl font-bold text-warning">₹80L</p>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                </div>
                <div className="text-center p-4 bg-info/10 rounded-lg">
                  <p className="text-2xl font-bold text-info">8</p>
                  <p className="text-sm text-muted-foreground">Days Left</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Schedule</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Milestone</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => {
                  const status = statusStyles[payment.status];
                  return (
                    <TableRow key={payment.id} className="table-row-hover">
                      <TableCell className="font-mono font-medium">
                        {payment.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {payment.customer}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          {payment.property}
                        </div>
                      </TableCell>
                      <TableCell>{payment.milestone}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {payment.dueDate}
                          {payment.daysOverdue > 0 && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              {payment.daysOverdue}d overdue
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1">
                          <IndianRupee className="w-4 h-4" />
                          {payment.amount.replace("₹", "")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(status.bg, status.text, "border-0")}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.status !== "received" && (
                          <Button size="sm" variant="outline">
                            Record Payment
                          </Button>
                        )}
                        {payment.status === "received" && (
                          <Button size="sm" variant="ghost">
                            View Receipt
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Payments;
