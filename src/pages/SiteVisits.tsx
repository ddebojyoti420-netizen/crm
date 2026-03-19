import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  MapPin,
  Clock,
  Calendar,
  Plus,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Car,
  User,
  Building2,
  RecycleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const statusStyles: Record<string, { bg: string; text: string; label: string; icon: typeof MapPin }> = {
  scheduled: {
    bg: "bg-info/10",
    text: "text-info",
    label: "Scheduled",
    icon: Calendar,
  },
  progress: {
    bg: "bg-warning/10",
    text: "text-warning",
    label: "In Progress",
    icon: Navigation,
  },
  completed: {
    bg: "bg-success/10",
    text: "text-success",
    label: "Completed",
    icon: CheckCircle2,
  },
  cancelled: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    label: "Cancelled",
    icon: AlertCircle,
  },
  rescheduled: {
    bg: "bg-pink/10",
    text: "text-default",
    label: "Rescheduled",
    icon: RecycleIcon
  },
  revisited: {
    bg: "bg-success/10",
    text: "text-success",
    label: "Revisited",
    icon: Calendar
  }
};

const SiteVisits = () => {
  const [openModal, setOpenModal] = useState(false);
  const [visits, setVisits] = useState([]);
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [actionVisit, setActionVisit] = useState(null);
  const [leadPropertyId, setLeadPropertyId] = useState("");
  const [formData, setFormData] = useState({
    lead_id: "",
    property_id: "",
    employee_id: "",
    visit_date: "",
    visit_time: "",
    note: "",
    property_lat: "",
    property_long: "",
  });

  const updateForm = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setFormData({
      lead_id: "",
      property_id: "",
      employee_id: "",
      visit_date: "",
      visit_time: "",
      note: "",
      property_lat: "",
      property_long: "",
    });
  };

  const today = new Date().toISOString().split("T")[0];

  const todaysVisitCount = visits.filter(
    (visit) =>
      visit.visit_date &&
      visit.visit_date.startsWith(today)
  ).length;

  const inProgressCount = visits.filter(
    (visit) => visit.status === "progress"
  ).length;

  const completedCount = visits.filter(
    (visits) => visits.status === "completed"
  ).length;

  const now = new Date();
  const firstDayOfWeek = new Date(
    now.setDate(now.getDate() - now.getDay())
  );
  const lastDayOfWeek = new Date(
    now.setDate(firstDayOfWeek.getDate() + 6)
  );

  const thisWeekCount = visits.filter((visit) => {
    if (!visit.visit_date) return false;

    const followupDate = new Date(visit.visit_date);

    return (
      followupDate >= firstDayOfWeek &&
      followupDate <= lastDayOfWeek
    );
  }).length;


  const fetchVisits = async () => {
    const { data, error } = await supabase
      .from("site_visits")
      .select(`
      id,
      visit_date,
      visit_time,
      status,
      note,
      leads:lead_id ( name, phone ),
      properties:property_id ( title ),
      profiles:employee_id ( name )
    `)
      .order("visit_date", { ascending: true });

    if (error) {
      console.error("Fetch Error:", error);
      return;
    }

    setVisits(
      (data || []).map((v) => ({
        ...v,
        status: v.status?.toLowerCase(),
      }))
    );
  };

  const fetchClients = async () => {
    const { data } = await supabase
      .from("leads")
      .select("id,name,status")
      .eq("is_active", true);

    setClients(data || []);
  };

  const fetchLeadProperties = async (leadId) => {
    const { data } = await supabase
      .from("lead_properties")
      .select(
        `
        id,
        property_id,
        properties(
          id,
          title,
          lat,
          long,
          zone_id
        )
      `
      )
      .eq("lead_id", leadId);

    setProperties(data || []);
  };

  const fetchExecutives = async (zoneId?: string) => {
    if (!zoneId) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("id,name,zone_id")
      .eq("department", "Sales")
      .eq("zone_id", zoneId);

    if (error) {
      console.error(error);
      return;
    }

    setExecutives(data || []);
  };
  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    try {
      if (
        !formData.lead_id ||
        !formData.property_id ||
        !formData.employee_id ||
        !formData.visit_date ||
        !formData.visit_time
      ) {
        alert("Please fill required fields");
        return;
      }

      const { data, error } = await supabase
        .from("site_visits")
        .insert([
          {
            lead_id: formData.lead_id,
            property_id: formData.property_id,
            employee_id: formData.employee_id,
            visit_date: formData.visit_date,
            visit_time: formData.visit_time,
            note: formData.note,
            status: "Scheduled",
            parent_visit_id: actionVisit?.id || null,
          },
        ])
        .select();

      if (error) {
        console.error("Insert error:", error);
        alert("Failed to schedule visit");
        return;
      }

      console.log("Inserted:", data);

      // update lead property
      if (leadPropertyId) {
        await supabase
          .from("lead_properties")
          .update({ visit_status: "scheduled" })
          .eq("id", leadPropertyId);
      }

      setOpenModal(false);
      resetForm();
      fetchVisits();
      setActionVisit(null);

    } catch (err) {
      console.error(err);
    }
  };

  const handleReschedule = (visit) => {
    setActionVisit(visit);

    setFormData({
      lead_id: visit.lead_id,
      property_id: visit.property_id,
      employee_id: visit.employee_id,
      visit_date: "",
      visit_time: "",
      note: "",
      property_lat: "",
      property_long: "",
    });

    fetchClients();
    fetchExecutives();
    setOpenModal(true);
  };

  const
    handleRevisit = (visit) => {
      setActionVisit(visit);

      setFormData({
        lead_id: visit.lead_id,
        property_id: visit.property_id,
        employee_id: visit.employee_id,
        visit_date: "",
        visit_time: "",
        note: "",
        property_lat: "",
        property_long: "",
      });

      fetchClients();
      fetchExecutives();
      setOpenModal(true);
    };

  const cancelVisit = async (id) => {
    await supabase
      .from("site_visits")
      .update({ status: "cancelled" })
      .eq("id", id);

    fetchVisits();
  };

  const completeVisit = async (id) => {
    await supabase
      .from("site_visits")
      .update({ status: "completed" })
      .eq("id", id);

    fetchVisits();
  };

  const todayVisits = visits.filter(
    (visit) =>
      visit.visit_date === today &&
      visit.status !== "cancelled"
  );

  useEffect(() => {
    fetchVisits();
  }, []);

  return (
    <MainLayout
      title="Site Visits"
      subtitle="Schedule and track property visits"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-info/10 rounded-xl">
                  <Calendar className="w-6 h-6 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Today's Visits</p>
                  <p className="text-2xl font-bold">{todaysVisitCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-warning/10 rounded-xl">
                  <Navigation className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{inProgressCount}</p>
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
                  <p className="text-2xl font-bold">{completedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-xl">
                  <Car className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">{thisWeekCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <Button
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={() => {
              fetchClients();
              fetchExecutives();
              setOpenModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Visit
          </Button>
          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Schedule Site Visit</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">

                {/* Client Selection */}
                <div>
                  <Label>Client</Label>
                  <Select
                    onValueChange={(value) => {
                      setFormData({ ...formData, lead_id: value });
                      fetchLeadProperties(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Property Selection */}
                <div>
                  <Label>Property</Label>
                  <Select
                    onValueChange={(value) => {
                      const selected = properties.find((p) => p.id === value);

                      setFormData({
                        ...formData,
                        property_id: selected?.properties?.id,
                        property_lat: selected?.properties?.lat,
                        property_long: selected?.properties?.long,
                      });

                      fetchExecutives(selected?.properties?.zone_id);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((prop) => (
                        <SelectItem key={prop.id} value={prop.id}>
                          {prop.properties.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date */}
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    onChange={(e) =>
                      setFormData({ ...formData, visit_date: e.target.value })
                    }
                  />
                </div>

                {/* Time */}
                <div>
                  <Label>Time</Label>
                  <Input
                    type="time"
                    onChange={(e) =>
                      setFormData({ ...formData, visit_time: e.target.value })
                    }
                  />
                </div>

                {/* Assign Executive */}
                <div>
                  <Label>Assign Executive</Label>
                  <Select
                    onValueChange={(value) =>
                      setFormData({ ...formData, employee_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Executive" />
                    </SelectTrigger>
                    <SelectContent>
                      {executives.map((exec) => (
                        <SelectItem key={exec.id} value={exec.id}>
                          {exec.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              </div>

              <DialogFooter>
                <Button
                  onClick={handleSubmit}
                >
                  Confirm Schedule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="all">All Visits</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Client</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Executive</TableHead>
                      <TableHead>GPS</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visits.map((visit) => {
                      const status = statusStyles[visit.status?.toLowerCase()] || statusStyles["scheduled"];
                      const revisitCount = visits.filter(
                        (v) =>
                          v.parent_visit_id === visit.id &&
                          v.status?.toLowerCase() === "revisited"
                      ).length;

                      const rescheduleCount = visits.filter(
                        (v) =>
                          v.parent_visit_id === visit.id &&
                          v.status?.toLowerCase() === "rescheduled"
                      ).length;
                      return (
                        <TableRow key={visit.id} className="table-row-hover">

                          {/* Client */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback className="bg-accent/10 text-accent">
                                  {visit.leads?.name
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("") || ""}
                                </AvatarFallback>
                              </Avatar>

                              <div>
                                <p className="font-medium">{visit.leads?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {visit.leads?.phone}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Property */}
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              {visit.properties?.title}
                            </div>
                          </TableCell>

                          {/* Date */}
                          <TableCell>
                            <div>
                              <p className="font-medium">{visit.visit_date}</p>
                              <p className="text-sm text-muted-foreground">
                                {visit.visit_time}
                              </p>
                            </div>
                          </TableCell>

                          {/* Executive */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {visit.profiles?.name
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("") || ""}
                                </AvatarFallback>
                              </Avatar>

                              <span className="text-sm">
                                {visit.profiles?.name}
                              </span>
                            </div>
                          </TableCell>

                          {/* GPS */}
                          <TableCell>
                            <Badge variant="outline">Pending</Badge>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(status.bg, status.text, "border-0")}
                            >
                              {status.label}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="flex gap-2">

                              {/* Cancel button */}
                              {visit.status?.toLowerCase() === "scheduled" && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => cancelVisit(visit.id)}
                                >
                                  Cancel
                                </Button>
                              )}

                              {/* Reschedule button */}
                              {visit.status?.toLowerCase() === "cancelled" && rescheduleCount < 3 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReschedule(visit)}
                                >
                                  Reschedule
                                </Button>
                              )}

                              {/* Revisit button */}
                              {visit.status?.toLowerCase() === "completed" && revisitCount < 3 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRevisit(visit)}
                                >
                                  Revisit
                                </Button>
                              )}

                              {visit.status === "scheduled" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => completeVisit(visit.id)}
                                  >
                                    Complete
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>

                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="today">
            <Card className="p-6">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Client</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Executive</TableHead>
                        <TableHead>GPS</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todayVisits.map((visit) => {
                        const status = statusStyles[visit.status?.toLowerCase()] || statusStyles["scheduled"];

                        return (
                          <TableRow key={visit.id} className="table-row-hover">

                            {/* Client */}
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback className="bg-accent/10 text-accent">
                                    {visit.leads?.name
                                      ?.split(" ")
                                      .map((n) => n[0])
                                      .join("") || ""}
                                  </AvatarFallback>
                                </Avatar>

                                <div>
                                  <p className="font-medium">{visit.leads?.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {visit.leads?.phone}
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            {/* Property */}
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                {visit.properties?.title}
                              </div>
                            </TableCell>

                            {/* Date */}
                            <TableCell>
                              <div>
                                <p className="font-medium">{visit.visit_date}</p>
                                <p className="text-sm text-muted-foreground">
                                  {visit.visit_time}
                                </p>
                              </div>
                            </TableCell>

                            {/* Executive */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {visit.profiles?.name
                                      ?.split(" ")
                                      .map((n) => n[0])
                                      .join("") || ""}
                                  </AvatarFallback>
                                </Avatar>

                                <span className="text-sm">
                                  {visit.profiles?.name}
                                </span>
                              </div>
                            </TableCell>

                            {/* GPS */}
                            <TableCell>
                              <Badge variant="outline">Pending</Badge>
                            </TableCell>

                            {/* Status */}
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(status.bg, status.text, "border-0")}
                              >
                                {status.label}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <div className="flex gap-2">

                                {/* Cancel button */}
                                {visit.status?.toLowerCase() === "scheduled" && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => cancelVisit(visit.id)}
                                  >
                                    Cancel
                                  </Button>
                                )}

                                {/* Reschedule button */}
                                {visit.status?.toLowerCase() === "cancelled" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReschedule(visit)}
                                  >
                                    Reschedule
                                  </Button>
                                )}

                                {/* Revisit button */}
                                {visit.status?.toLowerCase() === "completed" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRevisit(visit)}
                                  >
                                    Revisit
                                  </Button>
                                )}

                                {visit.status === "scheduled" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => completeVisit(visit.id)}
                                    >
                                      Complete
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>

                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming">
            <Card className="p-6">
              <p className="text-muted-foreground text-center">Upcoming visits will appear here</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default SiteVisits;
