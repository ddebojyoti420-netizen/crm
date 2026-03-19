import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  Phone,
  Mail,
  MoreHorizontal,
  Eye,
  FileText,
  MessageCircle,
  Building2,
  Calendar,
} from "lucide-react";

const customers = [
  {
    id: 1,
    name: "Sneha Reddy",
    email: "sneha.reddy@email.com",
    phone: "+91 98765 43210",
    property: "Lake View Towers, 3 BHK",
    unit: "Tower C, Floor 8, Unit 802",
    bookingDate: "15 Nov 2025",
    stage: "registered",
    amountPaid: "₹95L",
    balance: "₹15L",
    documents: ["Aadhaar", "PAN", "Agreement"],
  },
  {
    id: 2,
    name: "Rajesh Kapoor",
    email: "rajesh.kapoor@email.com",
    phone: "+91 87654 32109",
    property: "Sky Villas, 4 BHK",
    unit: "Tower A, Floor 15, Unit 1502",
    bookingDate: "20 Oct 2025",
    stage: "agreement",
    amountPaid: "₹1.2 Cr",
    balance: "₹80L",
    documents: ["Aadhaar", "PAN"],
  },
  {
    id: 3,
    name: "Kavita Sharma",
    email: "kavita.sharma@email.com",
    phone: "+91 76543 21098",
    property: "Green Heights, 2 BHK",
    unit: "Block B, Floor 5, Unit 504",
    bookingDate: "5 Dec 2025",
    stage: "allotment",
    amountPaid: "₹25L",
    balance: "₹45L",
    documents: ["Aadhaar"],
  },
  {
    id: 4,
    name: "Mohammed Ali",
    email: "mohammed.ali@email.com",
    phone: "+91 65432 10987",
    property: "Palm Residency, 4 BHK",
    unit: "Villa Plot 22",
    bookingDate: "1 Sep 2025",
    stage: "registered",
    amountPaid: "₹2.5 Cr",
    balance: "₹0",
    documents: ["Aadhaar", "PAN", "Agreement", "Registration"],
  },
  {
    id: 5,
    name: "Priya Nair",
    email: "priya.nair@email.com",
    phone: "+91 54321 09876",
    property: "Metro Heights, 3 BHK",
    unit: "Wing A, Floor 7, Unit 703",
    bookingDate: "28 Dec 2025",
    stage: "booking",
    amountPaid: "₹5L",
    balance: "₹60L",
    documents: [],
  },
];

const stageStyles: Record<string, { bg: string; text: string; label: string }> = {
  booking: { bg: "bg-info/10", text: "text-info", label: "Booking" },
  allotment: { bg: "bg-warning/10", text: "text-warning", label: "Allotment" },
  agreement: { bg: "bg-accent/10", text: "text-accent", label: "Agreement" },
  registered: { bg: "bg-success/10", text: "text-success", label: "Registered" },
};

const Customers = () => {
  return (
    <MainLayout
      title="Customers"
      subtitle="Manage your customer relationships"
    >
      <div className="space-y-6">
        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search customers..." className="pl-10" />
          </div>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>

        {/* Customers Table */}
        <div className="stat-card p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Customer</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Booking Date</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => {
                const stage = stageStyles[customer.stage];
                return (
                  <TableRow key={customer.id} className="table-row-hover">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-accent/10 text-accent">
                            {customer.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.phone}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium flex items-center gap-1">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          {customer.property}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {customer.unit}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {customer.bookingDate}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${stage.bg} ${stage.text} border-0`}>
                        {stage.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-success">
                      {customer.amountPaid}
                    </TableCell>
                    <TableCell className={customer.balance === "₹0" ? "text-success" : "text-warning"}>
                      {customer.balance}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {customer.documents.length > 0 ? (
                          customer.documents.slice(0, 2).map((doc) => (
                            <Badge key={doc} variant="outline" className="text-xs">
                              {doc}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">None</span>
                        )}
                        {customer.documents.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{customer.documents.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="w-4 h-4 mr-2" />
                              Upload Documents
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="w-4 h-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
};

export default Customers;
