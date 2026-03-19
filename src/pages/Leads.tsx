import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Filter,
  Plus,
  Phone,
  MessageCircle,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import Properties from "./Properties";
import { number, string } from "zod";
import { Label } from "@/components/ui/label";
import { max } from "date-fns";

export type Lead = {
  id: string
  name: string | null
  phone: string | null
  alternate_phone: string | null
  email: string | null
  source: string | null
  status: string | null
  priority: string | null
  lead_score: number | null
  budget: number | null
  requirements: string | null
  location: string | null
  assigned_to: string | null
  created_by: string | null
  last_contacted_at: string | null
  next_followup_at: string | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
  branch_id: string | null
  city: string | null
  property_id?: string | null
  properties?: {
    bedrooms: number
  }
  profiles?: {
    id: string
    name: string
    department: string
  } | null
}

const statusStyles: Record<string, string> = {
  new: "lead-status-new",
  hot: "lead-status-hot",
  warm: "lead-status-warm",
  cold: "lead-status-cold",
  converted: "lead-status-converted",
};

const exportCSV = (data: Lead[], fileName: string) => {
  if (!data.length) return;

  const headers = Object.keys(data[0]);

  const escapeCSV = (value) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csv = [
    headers.join(","),
    ...data.map(row =>
      headers.map(field => escapeCSV(row[field])).join(",")
    )
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}.csv`;
  link.click();
};

const budgetOptions = [
  { label: "30L - 40L", min: 3000000, max: 4000000 },
  { label: "40L - 50L", min: 4000000, max: 5000000 },
  { label: "50L - 60L", min: 5000000, max: 6000000 },
  { label: "60L - 70L", min: 6000000, max: 7000000 },
  { label: "70L - 80L", min: 7000000, max: 8000000 },
  { label: "80L - 90L", min: 8000000, max: 9000000 },
  { label: "90L - 1Cr", min: 9000000, max: 10000000 },
  { label: "1Cr - 1.25Cr", min: 10000000, max: 12500000 },
  { label: "1.25Cr - 1.5Cr", min: 12500000, max: 15000000 },
  { label: "1.5Cr - 1.75Cr", min: 15000000, max: 17500000 },
  { label: "1.75Cr - 2Cr", min: 17500000, max: 20000000 },
  { label: "2Cr - 2.25Cr", min: 20000000, max: 22500000 },
  { label: "2.25Cr - 2.5Cr", min: 22500000, max: 25000000 },
  { label: "2.5Cr - 2.75Cr", min: 25000000, max: 27500000 },
  { label: "2.75Cr - 3Cr", min: 27500000, max: 30000000 },
];

const statusOptions = [
  "new",
  "hot",
  "warm",
  "cold",
  "converted"
];

const priorityOptions = [
  "High",
  "Medium",
  "Low"
];

const sourceOptions = [
  "Facebook",
  "Google Ads",
  "Whatsapp",
  "Instagram"
];

const Leads = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openAddLead, setOpenAddLead] = useState(false);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [openEditLead, setOpenEditLead] = useState(false);
  const [zones, setZones] = useState<any[]>([]);
  const [selectedBhk, setSelectedBhk] = useState<number | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedBudgetRange, setSelectedBudgetRange] = useState<{
    label: string;
    min: number;
    max: number;
  } | null>(null);
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [newLead, setNewLead] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    source: "",
    requirements: "",
    priority: "Medium",
    status: "new",
    assigned_to: "",
    next_followup_at: "",
    budget: null as number | null,
    bhk: null as number | null
  });

  const [selectedProperties, setSelectedProperties] = useState<any[]>([])
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery);

    const matchesStatus =
      selectedStatus === "all" || lead.status === selectedStatus;

    const matchesSource =
      selectedSource === "all" || lead.source === selectedSource;

    return matchesSearch && matchesStatus && matchesSource;
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewLead({
      ...newLead,
      [e.target.name]: e.target.value
    });
  };

  const handleAddLead = async () => {
    const { data, error } = await supabase
      .from("leads")
      .insert([
        {
          name: newLead.name,
          phone: newLead.phone,
          email: newLead.email,
          city: newLead.city,
          source: newLead.source,
          requirements: newLead.requirements,
          budget: newLead.budget,
          priority: newLead.priority,
          status: newLead.status,
          assigned_to: newLead.assigned_to || null,
          next_followup_at: newLead.next_followup_at || null,
        }
      ])
      .select();

    if (error) {
      console.error(error);
      return;
    }

    const normalized = (data ?? []).map((lead) => ({
      ...lead,
      budget: lead.budget ? Number(lead.budget) : null
    }));

    setLeads(prev => [
      ...prev,
      ...(data ?? []).map(l => ({
        ...l,
        budget: l.budget ? Number(l.budget) : null
      }))
    ]);
    setOpenAddLead(false);
  };

  const addProperty = (property: any) => {
    setSelectedProperties(prev => {
      if (prev.some(p => p.id === property.id)) return prev;

      return [
        ...prev,
        {
          ...property,
          priority: "medium",
          shortlisted: false
        }
      ];
    });
  };

  const handleUpdateLead = async () => {
    if (!editLead) return;

    const { error } = await supabase
      .from("leads")
      .update({
        status: editLead.status,
        priority: editLead.priority,
        assigned_to: editLead.assigned_to
      })
      .eq("id", editLead.id);

    if (error) {
      console.error(error);
      return;
    }

    // Agent name instant update korar jonno
    const agent = agents.find(a => a.id === editLead.assigned_to);

    setLeads(prev =>
      prev.map(l =>
        l.id === editLead.id
          ? {
            ...editLead,
            profiles: agent
              ? { id: agent.id, name: agent.name, department: "Sales" }
              : null
          }
          : l
      )
    );

    setOpenEditLead(false);
    await saveAssignedProperties();
  };

  const handleDeleteLead = async (id: string) => {
    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", id);

    if (!error) {
      setLeads(prev => prev.filter(l => l.id !== id));
    }
  };

  const toggleShortList = (propertyId: string) => {
    setSelectedProperties(prev =>
      prev.map(p =>
        p.id === propertyId
          ? { ...p, shortlisted: !p.shortlisted }
          : p
      )
    );
  };

  const removeProperty = (propertyId: string) => {
    setSelectedProperties(prev =>
      prev.filter(p => p.id !== propertyId)
    );
  };

  const saveAssignedProperties = async () => {
    if (!editLead) return;

    const inserts = selectedProperties.map(p => ({
      lead_id: editLead.id,
      property_id: p.id,
      priority: p.priority,
      shortlisted: p.shortlisted
    }));

    const { error } = await supabase
      .from("lead_properties")
      .insert(inserts);

    if (error) {
      console.error("Error saving properties:", error);
    }
  };

  const fetchFilteredProperties = async (
    zoneId?: string,
    range?: { min: number; max: number },
    bhk?: number | null
  ) => {
    let query = supabase
      .from("properties")
      .select("id, title, price, bedrooms, zone_id, status")
      .eq("status", "available");

    if (zoneId) {
      query = query.eq("zone_id", zoneId);
    }

    if (range) {
      query = query
        .gte("price", range.min)
        .lte("price", range.max);
    }

    if (bhk !== undefined && bhk !== null) {
      query = query.eq("bedrooms", bhk);
    }

    const { data, error } = await query;

    if (error) {
      console.log("Filter error:", error);
    } else {
      console.log("Filtered:", data);
      setFilteredProperties(data || []);
    }
  };

  useEffect(() => {
    fetchFilteredProperties(
      selectedZone || undefined,
      selectedBudgetRange || undefined,
      selectedBhk || undefined
    );
  }, [selectedZone, selectedBudgetRange, selectedBhk]);

  useEffect(() => {
    const fetchLeads = async () => {
      const { data, error } = await supabase
        .from("leads")
        .select(`
          *,
          profiles:assigned_to (
            id,
            name,
            department
          )
        `);

      if (error) {
        console.error(error);
        return;
      }

      const normalized: Lead[] = (data ?? []).map((lead: any) => ({
        ...lead,
        budget: lead.budget ? Number(lead.budget) : null
      }));

      setLeads(normalized);
    };

    const fetchProperties = async () => {
      const { data } = await supabase
        .from("properties")
        .select("id, title");

      setProperties(data || []);
    };

    const fetchZones = async () => {
      const { data, error } = await supabase
        .from("zones")
        .select("id, zone_name, active_locations")
        .eq("status", "active");

      if (!error) setZones(data || []);
    };

    const fetchAgents = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("department", "Sales");

      setAgents(data || []);
    };

    fetchAgents();
    fetchProperties();
    fetchLeads();
    fetchZones();
  }, []);

  return (
    <MainLayout
      title="Lead Management"
      subtitle="Track and manage all your leads"
    >
      <div className="space-y-6">
        {/* Filters and Actions */}
        <div className="flex flex-col gap-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger className="w-full sm:w-[130px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="google">Google Ads</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="flex-shrink-0">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap justify-end">
            <Button variant="outline" size="sm" className="h-9">
              <Upload className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Import</span>
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => exportCSV(leads, "crm_leads")}>
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground h-9"
              onClick={() => setOpenAddLead(true)}
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Lead</span>
            </Button>
          </div>
        </div>

        {/* Leads Table - Desktop */}
        <div className="stat-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[200px]">Lead</TableHead>
                  <TableHead>Property Interest</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="table-row-hover">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-accent/10 text-accent text-sm">
                            {((lead.name || "")
                              .split(" ")
                              .map((n) => n[0])
                              .join(""))}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{lead.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {lead.phone}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium truncate">{lead.requirements}</p>
                      <p className="text-xs text-muted-foreground">
                        {lead.last_contacted_at
                          ? `Last contacted: ${new Date(lead.last_contacted_at).toLocaleDateString()}`
                          : "Not contacted yet"}
                      </p>
                    </TableCell>
                    <TableCell className="font-medium">{lead.budget}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-secondary">
                        {lead.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("capitalize", statusStyles[lead.status || "new"])}
                      >
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              lead.lead_score >= 80
                                ? "bg-success"
                                : lead.lead_score >= 50
                                  ? "bg-warning"
                                  : "bg-destructive"
                            )}
                            style={{ width: `${lead.lead_score}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{lead.lead_score}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {((lead.profiles?.name || "U")
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase())}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate">{lead.profiles?.name || "Unassigned"}</span>
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
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedLead(lead);
                                setOpenViewDialog(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditLead(lead);
                                setOpenEditLead(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Lead
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteLead(lead.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Leads Cards - Mobile/Tablet */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
          {leads.map((lead) => (
            <div key={lead.id} className="stat-card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="bg-accent/10 text-accent">
                      {(lead.name || "")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{lead.name || "Unnamed Lead"}</p>
                    <p className="text-sm text-muted-foreground truncate">{lead.phone || "No phone number"}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn("capitalize flex-shrink-0", statusStyles[lead.status])}
                >
                  {lead.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm mb-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property</span>
                  <span className="font-medium truncate ml-2">{lead.requirements}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Budget</span>
                  <span className="font-medium">{lead.budget}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source</span>
                  <Badge variant="outline" className="bg-secondary text-xs">
                    {lead.source}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          lead.lead_score >= 80
                            ? "bg-success"
                            : lead.lead_score >= 50
                              ? "bg-warning"
                              : "bg-destructive"
                        )}
                        style={{ width: `${lead.lead_score}%` }}
                      />
                    </div>
                    <span className="font-medium">{lead.lead_score}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {(lead.profiles?.name || "Unnamed Agent")
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "NA"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">{lead.assigned_to || "Unnamed Agent"}</span>
                </div>
                <div className="flex items-center gap-1">
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
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Lead
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteLead(lead.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div> */}
      </div>

      {/* View Lead Dialog */}
      <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-3 text-sm">

              <div>
                <span className="font-semibold">Name:</span> {selectedLead.name}
              </div>

              <div>
                <span className="font-semibold">Phone:</span> {selectedLead.phone}
              </div>

              <div>
                <span className="font-semibold">Email:</span> {selectedLead.email}
              </div>

              <div>
                <span className="font-semibold">City:</span> {selectedLead.city}
              </div>

              <div>
                <span className="font-semibold">Budget:</span> {selectedLead.budget}
              </div>

              <div>
                <span className="font-semibold">Requirements:</span>{" "}
                {selectedLead.requirements}
              </div>

              <div>
                <span className="font-semibold">Source:</span> {selectedLead.source}
              </div>

              <div>
                <span className="font-semibold">Status:</span> {selectedLead.status}
              </div>

              <div>
                <span className="font-semibold">Lead Score:</span>{" "}
                {selectedLead.lead_score}
              </div>

              <div>
                <span className="font-semibold">Created At:</span>{" "}
                {selectedLead.created_at
                  ? new Date(selectedLead.created_at).toLocaleDateString()
                  : ""}
              </div>

            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setOpenViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openAddLead} onOpenChange={setOpenAddLead}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4">

            <Input
              placeholder="Lead Name"
              name="name"
              value={newLead.name}
              onChange={handleChange}
            />

            <Input
              placeholder="Phone"
              name="phone"
              value={newLead.phone}
              onChange={handleChange}
            />

            <Input
              placeholder="Email"
              name="email"
              value={newLead.email}
              onChange={handleChange}
            />

            <Input
              placeholder="City"
              name="city"
              value={newLead.city}
              onChange={handleChange}
            />

            {/* Budget */}
            <Select
              value={
                budgetOptions.find(b => b.max === newLead.budget)?.label || ""
              }
              onValueChange={(value) => {
                const range = budgetOptions.find(b => b.label === value);
                if (range) {
                  setNewLead(prev => ({
                    ...prev,
                    budget: range.max
                  }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Budget" />
              </SelectTrigger>

              <SelectContent>
                {budgetOptions.map((b) => (
                  <SelectItem key={b.label} value={b.label}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={newLead.source}
              onValueChange={(value) =>
                setNewLead(prev => ({ ...prev, source: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Source" />
              </SelectTrigger>

              <SelectContent>
                {sourceOptions.map((src) => (
                  <SelectItem key={src} value={src}>
                    {src.charAt(0).toUpperCase() + src.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority */}
            <Select
              value={newLead.priority}
              onValueChange={(value) =>
                setNewLead(prev => ({ ...prev, priority: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Lead Priority" />
              </SelectTrigger>

              <SelectContent>
                {priorityOptions.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={newLead.bhk ? String(newLead.bhk) : ""}
              onValueChange={(value) =>
                setNewLead(prev => ({
                  ...prev,
                  bhk: Number(value)
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select BHK" />
              </SelectTrigger>

              <SelectContent>
                {[1, 2, 3, 4, 5].map((b) => (
                  <SelectItem key={b} value={String(b)}>
                    {b} BHK
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              name="next_followup_at"
              value={newLead.next_followup_at}
              onChange={handleChange}
            />

            <Textarea
              placeholder="Property Interest / Requirements"
              name="requirements"
              value={newLead.requirements}
              onChange={handleChange}
            />

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAddLead(false)}>
              Cancel
            </Button>

            <Button onClick={handleAddLead}>
              Add Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openEditLead} onOpenChange={setOpenEditLead}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
          </DialogHeader>

          {editLead && (
            <div className="space-y-5">

              {/* Status */}
              <Select
                value={editLead.status || ""}
                onValueChange={(value) =>
                  setEditLead(prev => prev && { ...prev, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>

                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Priority */}
              <Select
                value={editLead.priority || ""}
                onValueChange={(value) =>
                  setEditLead(prev => prev && { ...prev, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>

              {/* Assign Agent */}
              <Select
                value={editLead.assigned_to || ""}
                onValueChange={(value) =>
                  setEditLead(prev => prev && { ...prev, assigned_to: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign Agent" />
                </SelectTrigger>

                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Assign Properties */}
              <div className="space-y-4 border-t pt-4">

                <Label className="text-sm font-semibold">
                  Assign Properties
                </Label>

                <Select
                  value={selectedBhk ? String(selectedBhk) : ""}
                  onValueChange={(value) => setSelectedBhk(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select BHK" />
                  </SelectTrigger>

                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((b) => (
                      <SelectItem key={b} value={String(b)}>
                        {b} BHK
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Zone */}
                <Select
                  value={selectedZone || ""}
                  onValueChange={setSelectedZone}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Zone" />
                  </SelectTrigger>

                  <SelectContent>
                    {zones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.zone_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Budget */}
                <Select
                  value={selectedBudgetRange?.label || ""}
                  onValueChange={(value) => {
                    const range = budgetOptions.find(b => b.label === value);
                    if (range) setSelectedBudgetRange(range);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Budget" />
                  </SelectTrigger>

                  <SelectContent>
                    {budgetOptions.map((b) => (
                      <SelectItem key={b.label} value={b.label}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Property Select */}
                <Select
                  onValueChange={(value) => {
                    const property = filteredProperties.find(p => p.id === value);
                    if (property) addProperty(property);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Property" />
                  </SelectTrigger>

                  <SelectContent>
                    {filteredProperties.length === 0 ? (
                      <SelectItem disabled value="none">
                        No property available
                      </SelectItem>
                    ) : (
                      filteredProperties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.title} - ₹{property.price}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {/* Selected Properties */}
                <div className="space-y-2">
                  {selectedProperties.map(property => (
                    <div
                      key={property.id}
                      className="flex items-center justify-between border rounded-lg p-3"
                    >
                      <div>
                        <p className="font-medium">{property.title}</p>

                        <div className="flex gap-2 mt-2">

                          <Button
                            size="sm"
                            variant={property.shortlisted ? "default" : "outline"}
                            onClick={() => toggleShortList(property.id)}
                          >
                            Shortlist
                          </Button>

                          <Select
                            value={property.priority}
                            onValueChange={(value) =>
                              setSelectedProperties(prev =>
                                prev.map(p =>
                                  p.id === property.id
                                    ? { ...p, priority: value }
                                    : p
                                )
                              )
                            }
                          >
                            <SelectTrigger className="w-[110px] h-8">
                              <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>

                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        onClick={() => removeProperty(property.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleUpdateLead}>
              Update Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Leads;
