import { useEffect, useMemo, useState } from "react";
import { MapPicker } from "./MapPicker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, RefreshCcw, Search, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type PickedPoint = { lat: number; lng: number };

/** =============== Types ================= */
type AttendanceStatus =
    | "present"
    | "late"
    | "absent"
    | "leave"
    | "pending"
    | "approved"
    | "rejected";

type AttendanceType = "office" | "site" | "site_visit" | "field";

type AttendanceLocationLabel = "Office" | "Site Visit" | "Field";

type EmployeeRow = {
    id: string;
    name: string | null;
    email: string | null;
    department: string | null;
    photo_path?: string | null;
    roles?: { name: string } | null;
    attendance_type?: AttendanceType | null;
    location_id?: string | null;
};

type AttendanceLogRow = {
    id: string;
    employee_id: string;
    attendance_date: string; // YYYY-MM-DD
    punch_in: string | null; // HH:MM:SS
    punch_out: string | null; // HH:MM:SS
    attendance_type: AttendanceType | null;
    status: AttendanceStatus | null;
    employee_latitude?: number | null;
    employee_longitude?: number | null;
    location_id?: string | null;
};

type AttendanceUIRow = {
    id: string; // employee id
    name: string;
    role: string;
    department: string;
    punchIn: string; // HH:MM or "-"
    punchOut: string; // HH:MM or "-"
    hours: string; // 08h 15m or "-"
    location: AttendanceLocationLabel;
    status: AttendanceStatus;
    photo_path?: string | null;
    email?: string | null;
    logId?: string;
};

/** ============= Helpers ============ */
const statusStyles: Record<
    AttendanceStatus,
    { bg: string; text: string; label: string }
> = {
    present: { bg: "bg-success/10", text: "text-success", label: "Present" },
    late: { bg: "bg-warning/10", text: "text-warning", label: "Late" },
    absent: { bg: "bg-destructive/10", text: "text-destructive", label: "Absent" },
    leave: { bg: "bg-info/10", text: "text-info", label: "On Leave" },
    pending: { bg: "bg-warning/10", text: "text-warning", label: "Pending" },
    approved: { bg: "bg-success/10", text: "text-success", label: "Approved" },
    rejected: { bg: "bg-destructive/10", text: "text-destructive", label: "Rejected" },
};

const pad2 = (n: number) => String(n).padStart(2, "0");

const todayISODate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const hhmm = (hhmmss: string | null) => (hhmmss ? hhmmss.slice(0, 5) : "-");

const toMinutes = (hhmmStr: string) => {
    const [h, m] = hhmmStr.split(":").map((x) => parseInt(x, 10));
    return h * 60 + m;
};

const formatHours = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${pad2(h)}h ${pad2(m)}m`;
};

const calcWorkingHours = (pIn: string | null, pOut: string | null) => {
    if (!pIn || !pOut) return "-";
    const inM = toMinutes(pIn.slice(0, 5));
    const outM = toMinutes(pOut.slice(0, 5));
    const diff = outM - inM;
    if (!Number.isFinite(diff) || diff <= 0) return "-";
    return formatHours(diff);
};

const typeToLocation = (
    t: AttendanceType | null | undefined
): AttendanceLocationLabel => {
    const v = (t ?? "").toString().trim().toLowerCase();

    if (v === "field") return "Field";

    const isSite =
        v === "site" ||
        v === "site_visit" ||
        v === "site visit" ||
        v === "sitevisit";

    return isSite ? "Site Visit" : "Office";
};

const isAdminHRRole = (roleName: string) => {
    const r = (roleName || "").toLowerCase();
    return r === "admin" || r === "hr";
};

/** ========================= Supabase helpers ========================= */
async function getMyProfileAndRole() {
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr) throw authErr;

    const userId = authData.user?.id;
    if (!userId) throw new Error("Not logged in");

    const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, department, attendance_type, location_id, photo_path, roles:role_id(name)")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) throw error;
    if (!data?.id) throw new Error("Profile not found / not linked with auth user_id");

    const roleName = ((data as any)?.roles?.name ?? "") as string;
    return { me: data as any, roleName };
}

async function fetchAttendanceForDate(
    date: string,
    mode: "admin" | "employee",
    searchText: string,
    departmentFilter: string
): Promise<AttendanceUIRow[]> {
    if (mode === "employee") {
        const { me } = await getMyProfileAndRole();

        const { data: log, error: lErr } = await supabase
            .from("attendance_logs")
            .select("id,employee_id,attendance_date,punch_in,punch_out,attendance_type,status")
            .eq("employee_id", me.id)
            .eq("attendance_date", date)
            .maybeSingle();

        if (lErr) throw lErr;

        const resolvedType =
            ((log as any)?.attendance_type ??
                (me as any)?.attendance_type ??
                "office") as AttendanceType;

        const row: AttendanceUIRow = {
            id: me.id,
            name: me.name ?? "-",
            role: me.roles?.name ?? "-",
            department: me.department ?? "-",
            email: me.email ?? null,
            photo_path: me.photo_path ?? null,
            punchIn: hhmm((log as any)?.punch_in ?? null),
            punchOut: hhmm((log as any)?.punch_out ?? null),
            hours: calcWorkingHours((log as any)?.punch_in ?? null, (log as any)?.punch_out ?? null),
            location: typeToLocation(resolvedType),
            status: (((log as any)?.status ?? "absent") as AttendanceStatus),
            logId: (log as any)?.id,
        };

        return [row];
    }

    // Admin/HR view
    let profQuery = supabase
        .from("profiles")
        .select("id, name, email, department, attendance_type, location_id, photo_path, roles:role_id(name)");

    if (departmentFilter && departmentFilter !== "all") {
        profQuery = profQuery.eq("department", departmentFilter);
    }

    if (searchText.trim()) {
        const q = searchText.trim();
        profQuery = profQuery.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
    }

    const { data: profiles, error: pErr } = await profQuery;
    if (pErr) throw pErr;

    const profileList = (profiles as any[] | null) ?? [];

    const { data: logs, error: lErr } = await supabase
        .from("attendance_logs")
        .select("id,employee_id,attendance_date,punch_in,punch_out,attendance_type,status,employee_latitude,employee_longitude,location_id")
        .eq("attendance_date", date);

    if (lErr) throw lErr;

    const logByEmp = new Map<string, AttendanceLogRow>();
    (logs as any[] | null)?.forEach((l) => logByEmp.set(l.employee_id, l as AttendanceLogRow));

    const rows: AttendanceUIRow[] = profileList.map((empAny) => {
        const emp = empAny as EmployeeRow;
        const log = logByEmp.get(emp.id);

        const resolvedType = (log?.attendance_type ?? emp.attendance_type ?? "office") as AttendanceType;

        return {
            id: emp.id,
            name: emp.name ?? "-",
            role: emp.roles?.name ?? "-",
            department: emp.department ?? "-",
            email: emp.email ?? null,
            photo_path: emp.photo_path ?? null,
            punchIn: hhmm(log?.punch_in ?? null),
            punchOut: hhmm(log?.punch_out ?? null),
            hours: calcWorkingHours(log?.punch_in ?? null, log?.punch_out ?? null),
            location: typeToLocation(resolvedType),
            status: (log?.status ?? "absent") as AttendanceStatus,
            logId: log?.id,
        };
    });

    rows.sort((a, b) => a.name.localeCompare(b.name));
    return rows;
}

/** ========================= Component ========================= */
const Attendance = () => {
    const [rows, setRows] = useState<AttendanceUIRow[]>([]);
    const [loading, setLoading] = useState(true);

    const [mapOpen, setMapOpen] = useState(false);
    const [mapTitle, setMapTitle] = useState<string>("Location");
    const [mapDescription, setMapDescription] = useState<string>("");
    const [mapMarkers, setMapMarkers] = useState<
        { lat: number; lng: number; label: string; kind?: "admin" | "employee" }[]
    >([]);
    const [mapCircle, setMapCircle] = useState<
        { lat: number; lng: number; radiusMeters: number } | undefined
    >(undefined);

    const [mapInitial, setMapInitial] = useState<PickedPoint | undefined>(undefined);

    const [mode, setMode] = useState<"admin" | "employee">("employee");

    const [date, setDate] = useState<string>(todayISODate());
    const [searchText, setSearchText] = useState<string>("");
    const [departmentFilter, setDepartmentFilter] = useState<string>("all");

    const title = useMemo(() => {
        const pretty = new Date(date).toLocaleDateString("en-IN", { dateStyle: "full" });
        return mode === "admin" ? `Attendance Log - ${pretty}` : `My Attendance - ${pretty}`;
    }, [mode, date]);

    const uniqueDepartments = useMemo(() => {
        const set = new Set<string>();
        rows.forEach((r) => {
            if (r.department && r.department !== "-") set.add(r.department);
        });
        return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
    }, [rows]);

    const load = async () => {
        setLoading(true);
        try {
            const { roleName } = await getMyProfileAndRole();
            const resolvedMode: "admin" | "employee" = isAdminHRRole(roleName) ? "admin" : "employee";
            setMode(resolvedMode);

            const data = await fetchAttendanceForDate(date, resolvedMode, searchText, departmentFilter);
            setRows(data);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load attendance");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date]);

    const handleExport = () => {
        const headers =
            mode === "admin"
                ? ["Name", "Role", "Department", "Punch In", "Punch Out", "Working Hours", "Attendance Type", "Status", "Email"]
                : ["Name", "Role", "Punch In", "Punch Out", "Working Hours", "Attendance Type", "Status"];

        const dataRows = rows.map((e) => {
            const base = [
                e.name,
                e.role,
                ...(mode === "admin" ? [e.department] : []),
                e.punchIn,
                e.punchOut,
                e.hours,
                e.location,
                statusStyles[e.status].label,
                ...(mode === "admin" ? [e.email ?? ""] : []),
            ];
            return base;
        });

        const esc = (v: unknown) => `"${String(v ?? "").split('"').join('""')}"`;
        const csv = [headers, ...dataRows].map((r) => r.map(esc).join(",")).join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `attendance-${date}-${mode}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <div className="rounded-xl border bg-card">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <CardTitle>{title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {mode === "admin" ? "Admin/HR view: all employees" : "Employee view: only your attendance"}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="h-9 rounded-md border bg-background px-3 text-sm"
                        />

                        {mode === "admin" && (
                            <>
                                <div className="flex items-center gap-2 h-9 rounded-md border bg-background px-2">
                                    <Search className="w-4 h-4 text-muted-foreground" />
                                    <input
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        placeholder="Search name/email..."
                                        className="bg-transparent text-sm outline-none w-44"
                                    />
                                </div>

                                <select
                                    value={departmentFilter}
                                    onChange={(e) => setDepartmentFilter(e.target.value)}
                                    className="h-9 rounded-md border bg-background px-2 text-sm"
                                >
                                    {uniqueDepartments.map((d) => (
                                        <option key={d} value={d}>
                                            {d === "all" ? "All Departments" : d}
                                        </option>
                                    ))}
                                </select>
                            </>
                        )}

                        <Button variant="outline" onClick={load} disabled={loading}>
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>

                        <Button variant="outline" onClick={handleExport} disabled={rows.length === 0}>
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>{mode === "admin" ? "Employee" : "You"}</TableHead>
                                {mode === "admin" && <TableHead>Department</TableHead>}
                                <TableHead>Punch In</TableHead>
                                <TableHead>Punch Out</TableHead>
                                <TableHead>Working Hours</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={mode === "admin" ? 8 : 7}>Loading...</TableCell>
                                </TableRow>
                            ) : rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={mode === "admin" ? 8 : 7}>No attendance data</TableCell>
                                </TableRow>
                            ) : (
                                rows.map((emp) => {
                                    const status = statusStyles[emp.status];
                                    return (
                                        <TableRow key={emp.id} className="table-row-hover">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={emp.photo_path ?? ""} alt={emp.name} />
                                                        <AvatarFallback className="bg-accent/10 text-accent">
                                                            {emp.name
                                                                .split(" ")
                                                                .filter(Boolean)
                                                                .map((n) => n[0])
                                                                .join("")
                                                                .slice(0, 2)
                                                                .toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <div>
                                                        <p className="font-medium">{emp.name}</p>
                                                        <p className="text-sm text-muted-foreground">{emp.role}</p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {mode === "admin" && (
                                                <TableCell className="text-muted-foreground">{emp.department}</TableCell>
                                            )}

                                            <TableCell className="font-medium">{emp.punchIn}</TableCell>
                                            <TableCell className="font-medium">{emp.punchOut}</TableCell>
                                            <TableCell>{emp.hours}</TableCell>

                                            <TableCell>
                                                <Badge variant="outline" className="bg-secondary">
                                                    {emp.location}
                                                </Badge>
                                            </TableCell>

                                            <TableCell>
                                                <Badge variant="outline" className={cn(status.bg, status.text, "border-0")}>
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {(emp.location === "Site Visit" || emp.location === "Field") && emp.logId ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={async () => {
                                                            try {
                                                                // 1) get attendance log details (employee coords + location_id if exists)
                                                                const { data: log, error: logErr } = await supabase
                                                                    .from("attendance_logs")
                                                                    .select("employee_latitude, employee_longitude, location_id, attendance_type")
                                                                    .eq("id", emp.logId!)
                                                                    .maybeSingle();

                                                                if (logErr) throw logErr;

                                                                const punchLat = Number((log as any)?.employee_latitude);
                                                                const punchLng = Number((log as any)?.employee_longitude);

                                                                const logType = String((log as any)?.attendance_type ?? "").trim().toLowerCase();
                                                                const isField = logType === "field" || emp.location === "Field";

                                                                // ✅ FIELD: show only employee punch-in coordinates (no admin circle)
                                                                if (isField) {
                                                                    if (!Number.isFinite(punchLat) || !Number.isFinite(punchLng)) {
                                                                        toast.error("No coordinates found for this field attendance");
                                                                        return;
                                                                    }

                                                                    setMapTitle("Field Punch Location");
                                                                    setMapDescription("Employee punch-in coordinates (GPS).");

                                                                    /* const markers: { lat: number; lng: number; label: string }[] = [
                                                                        { lat: punchLat, lng: punchLng, label: "Employee Punch-in" },
                                                                    ]; */
                                                                    const markers: { lat: number; lng: number; label: string; kind?: "admin" | "employee" }[] = [
                                                                        { lat: punchLat, lng: punchLng, label: "Employee Punch-in", kind: "employee" },
                                                                    ];


                                                                    setMapMarkers(markers);
                                                                    setMapCircle(undefined);
                                                                    setMapInitial({ lat: punchLat, lng: punchLng });
                                                                    setMapOpen(true);
                                                                    return;
                                                                }

                                                                // default: site view (allowed vs punch)
                                                                setMapTitle("Site Visit Location");
                                                                setMapDescription("Allowed location (admin set) vs employee punch-in location.");

                                                                // fallback: if attendance_logs has no location_id, try profile's location_id
                                                                let locationId = (log as any)?.location_id as string | null;

                                                                if (!locationId) {
                                                                    const { data: prof, error: profErr } = await supabase
                                                                        .from("profiles")
                                                                        .select("location_id")
                                                                        .eq("id", emp.id)
                                                                        .maybeSingle();
                                                                    if (profErr) throw profErr;
                                                                    locationId = (prof as any)?.location_id ?? null;
                                                                }

                                                                // 2) load admin/hr set location (attendance_locations)
                                                                let siteLat: number | null = null;
                                                                let siteLng: number | null = null;
                                                                let radiusMeters: number | null = null;

                                                                if (locationId) {
                                                                    const { data: loc, error: locErr } = await supabase
                                                                        .from("attendance_locations")
                                                                        .select("latitude, longitude, radius_meters")
                                                                        .eq("id", locationId)
                                                                        .maybeSingle();

                                                                    if (locErr) throw locErr;

                                                                    siteLat = Number((loc as any)?.latitude);
                                                                    siteLng = Number((loc as any)?.longitude);
                                                                    radiusMeters = Number((loc as any)?.radius_meters);
                                                                }

                                                                // 3) Build markers (2 pointers)
                                                                /*  const markers: { lat: number; lng: number; label: string }[] = [];
 
                                                                 if (Number.isFinite(siteLat) && Number.isFinite(siteLng)) {
                                                                     markers.push({
                                                                         lat: siteLat!,
                                                                         lng: siteLng!,
                                                                         label: "Allowed Location (Admin Set)",
                                                                     });
                                                                 }
 
                                                                 if (Number.isFinite(punchLat) && Number.isFinite(punchLng)) {
                                                                     markers.push({
                                                                         lat: punchLat,
                                                                         lng: punchLng,
                                                                         label: "Employee Punch-in",
                                                                     });
                                                                 }
 
                                                                 if (markers.length === 0) {
                                                                     toast.error("No coordinates found for this attendance");
                                                                     return;
                                                                 } */
                                                                const markers: { lat: number; lng: number; label: string; kind?: "admin" | "employee" }[] = [];

                                                                if (Number.isFinite(siteLat) && Number.isFinite(siteLng)) {
                                                                    markers.push({
                                                                        lat: siteLat!,
                                                                        lng: siteLng!,
                                                                        label: "Allowed Location (Admin Set)",
                                                                        kind: "admin",
                                                                    });
                                                                }

                                                                if (Number.isFinite(punchLat) && Number.isFinite(punchLng)) {
                                                                    markers.push({
                                                                        lat: punchLat,
                                                                        lng: punchLng,
                                                                        label: "Employee Punch-in",
                                                                        kind: "employee",
                                                                    });
                                                                }

                                                                if (markers.length === 0) {
                                                                    toast.error("No coordinates found for this attendance");
                                                                    return;
                                                                }

                                                                setMapMarkers(markers);

                                                                // 4) Circle radius (optional)
                                                                if (
                                                                    Number.isFinite(siteLat) &&
                                                                    Number.isFinite(siteLng) &&
                                                                    Number.isFinite(radiusMeters) &&
                                                                    radiusMeters! > 0
                                                                ) {
                                                                    setMapCircle({
                                                                        lat: siteLat!,
                                                                        lng: siteLng!,
                                                                        radiusMeters: radiusMeters!,
                                                                    });
                                                                } else {
                                                                    setMapCircle(undefined);
                                                                }

                                                                // center map on admin location if exists, else punch-in
                                                                setMapInitial({ lat: markers[0].lat, lng: markers[0].lng });
                                                                setMapOpen(true);
                                                            } catch (e) {
                                                                console.error(e);
                                                                toast.error("Failed to load location");
                                                            }
                                                        }}
                                                        title="View location"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </div>

            <MapPicker
                open={mapOpen}
                onClose={() => setMapOpen(false)}
                initialLat={mapInitial?.lat}
                initialLng={mapInitial?.lng}
                title={mapTitle}
                description={mapDescription}
                readOnly
                markers={mapMarkers}
                circle={mapCircle}
                onSelect={() => setMapOpen(false)}
            />

        </>

    );
};

export default Attendance;
