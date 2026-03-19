import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  IndianRupee,
  Building2,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const bookings = [
  {
    id: "BK-2026-001",
    customer: "Sneha Reddy",
    property: "Lake View Towers",
    unit: "3 BHK, Tower C, Floor 8",
    bookingDate: "15 Nov 2025",
    totalValue: "₹1.10 Cr",
    tokenAmount: "₹5L",
    stage: "registration",
    executive: "Anita Singh",
  },
  {
    id: "BK-2026-002",
    customer: "Rajesh Kapoor",
    property: "Sky Villas",
    unit: "4 BHK, Tower A, Floor 15",
    bookingDate: "20 Oct 2025",
    totalValue: "₹2.00 Cr",
    tokenAmount: "₹10L",
    stage: "agreement",
    executive: "Ravi Kumar",
  },
  {
    id: "BK-2026-003",
    customer: "Kavita Sharma",
    property: "Green Heights",
    unit: "2 BHK, Block B, Floor 5",
    bookingDate: "5 Dec 2025",
    totalValue: "₹70L",
    tokenAmount: "₹3L",
    stage: "allotment",
    executive: "Sneha Mehta",
  },
  {
    id: "BK-2026-004",
    customer: "Mohammed Ali",
    property: "Palm Residency",
    unit: "4 BHK Villa, Plot 22",
    bookingDate: "1 Sep 2025",
    totalValue: "₹2.50 Cr",
    tokenAmount: "₹15L",
    stage: "completed",
    executive: "Raj Verma",
  },
  {
    id: "BK-2026-005",
    customer: "Priya Nair",
    property: "Metro Heights",
    unit: "3 BHK, Wing A, Floor 7",
    bookingDate: "28 Dec 2025",
    totalValue: "₹65L",
    tokenAmount: "₹5L",
    stage: "booking",
    executive: "Ravi Kumar",
  },
];

const stageStyles: Record<string, { bg: string; text: string; label: string; icon: typeof Clock }> = {
  booking: { bg: "bg-info/10", text: "text-info", label: "Booking", icon: Clock },
  allotment: { bg: "bg-warning/10", text: "text-warning", label: "Allotment", icon: FileText },
  agreement: { bg: "bg-accent/10", text: "text-accent", label: "Agreement", icon: FileText },
  registration: { bg: "bg-primary/10", text: "text-primary", label: "Registration", icon: Calendar },
  completed: { bg: "bg-success/10", text: "text-success", label: "Completed", icon: CheckCircle2 },
  cancelled: { bg: "bg-destructive/10", text: "text-destructive", label: "Cancelled", icon: AlertTriangle },
};

const Bookings = () => {
  return (
    <MainLayout
      title="Bookings & Sales"
      subtitle="Track booking status and sales pipeline"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-info/10 rounded-xl">
                  <Clock className="w-6 h-6 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">New Bookings</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-warning/10 rounded-xl">
                  <FileText className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">28</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/10 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">156</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-xl">
                  <IndianRupee className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">₹185 Cr</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>

        {/* Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {["Booking", "Allotment", "Agreement", "Registration", "Completed"].map(
                (stage, index) => (
                  <div key={stage} className="relative">
                    <div
                      className={cn(
                        "p-4 rounded-lg text-center",
                        index === 0
                          ? "bg-info/10"
                          : index === 1
                          ? "bg-warning/10"
                          : index === 2
                          ? "bg-accent/10"
                          : index === 3
                          ? "bg-primary/10"
                          : "bg-success/10"
                      )}
                    >
                      <p className="text-2xl font-bold">
                        {index === 0
                          ? "12"
                          : index === 1
                          ? "8"
                          : index === 2
                          ? "15"
                          : index === 3
                          ? "5"
                          : "156"}
                      </p>
                      <p className="text-sm text-muted-foreground">{stage}</p>
                    </div>
                    {index < 4 && (
                      <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 text-muted-foreground">
                        →
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Booking Date</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Executive</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => {
                  const stage = stageStyles[booking.stage];
                  const StageIcon = stage.icon;
                  return (
                    <TableRow key={booking.id} className="table-row-hover">
                      <TableCell className="font-mono font-medium">
                        {booking.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {booking.customer}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium flex items-center gap-1">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            {booking.property}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {booking.unit}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{booking.bookingDate}</TableCell>
                      <TableCell className="font-medium">
                        {booking.totalValue}
                      </TableCell>
                      <TableCell className="text-success">
                        {booking.tokenAmount}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(stage.bg, stage.text, "border-0")}>
                          <StageIcon className="w-3 h-3 mr-1" />
                          {stage.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {booking.executive}
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

export default Bookings;
