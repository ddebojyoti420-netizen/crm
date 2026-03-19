import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";

type ZoneStatus = "active" | "inactive";

type Zone = {
  id: number;
  zone_name: string;
  zone_code: string;
  description: string | null;
  city: string | null;
  state: string | null;
  status: ZoneStatus | null;

  locations: string[] | null;
  active_locations: string[] | null;

  created_at: string | null;
  updated_at: string | null;
};

function parseCommaSeparatedList(v: string): string[] {
  if (!v) return [];
  const parts = v
    .split(/[,|\n]/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return Array.from(new Set(parts));
}

function StatusBadge({ status }: { status: ZoneStatus | null }) {
  const s = status ?? "inactive";
  const isActive = s === "active";
  const label = s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <Badge
      className={[
        "rounded-full px-3 py-1 text-xs font-medium",
        isActive
          ? "bg-green-100 text-green-700 border border-green-200"
          : "bg-red-100 text-red-700 border border-red-200",
      ].join(" ")}
    >
      {label}
    </Badge>
  );
}

function pad3(n: number) {
  return String(n).padStart(3, "0");
}

export default function SalesZonesTable() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [zoneName, setZoneName] = useState("");
  const [zoneCode, setZoneCode] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [status, setStatus] = useState<ZoneStatus>("active");
  const [locationsText, setLocationsText] = useState("");
  const [locDialogOpen, setLocDialogOpen] = useState(false);
  const [locSaving, setLocSaving] = useState(false);
  const [activeZone, setActiveZone] = useState<Zone | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  const zoneIdToIndex = useMemo(() => {
    const m = new Map<number, number>();
    zones.forEach((z, idx) => m.set(z.id, idx));
    return m;
  }, [zones]);

  const resetCreateForm = () => {
    setZoneName("");
    setZoneCode("");
    setDescription("");
    setCity("");
    setState("");
    setStatus("active");
    setLocationsText("");
  };

  const loadZones = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("zones")
      .select(
        "id,zone_name,zone_code,description,city,state,status,locations,active_locations,created_at,updated_at"
      )
      .order("id", { ascending: false });

    setLoading(false);

    if (error) {
      toast.error(error.message || "Failed to load zones");
      return;
    }

    setZones((data ?? []) as Zone[]);
  };

  useEffect(() => {
    loadZones();
  }, []);

  const buildPrefix = (zn: string, c: string) => {
    const cityLetter = (c.trim()[0] || "").toUpperCase();
    const zoneLetter = (zn.trim()[0] || "").toUpperCase();
    if (!cityLetter || !zoneLetter) return "";
    return `${cityLetter}${zoneLetter}Z`; // e.g. DNZ
  };

  const generateZoneCode = async (zn: string, c: string) => {
    const prefix = buildPrefix(zn, c);
    if (!prefix) {
      setZoneCode("");
      return;
    }

    const { count, error } = await supabase
      .from("zones")
      .select("zone_code", { count: "exact", head: true });

    if (error) {
      console.error(error);
      return;
    }

    const nextCount = (count ?? 0) + 1;

    setZoneCode(`${prefix}-${pad3(nextCount)}`);
  };

  useEffect(() => {
    if (!createOpen) return;
    void generateZoneCode(zoneName, city);
  }, [createOpen, zoneName, city]);

  // auto-generate when modal open + zoneName/city changes
  useEffect(() => {
    if (!createOpen) return;
    void generateZoneCode(zoneName, city);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createOpen, zoneName, city]);

  const createZone = async () => {
    const zn = zoneName.trim();
    const zc = zoneCode.trim();
    const desc = description.trim();
    const c = city.trim();
    const s = state.trim();

    if (!zn) return toast.error("Zone name is required");
    if (!c) return toast.error("City is required");
    if (!zc) return toast.error("Zone code could not be generated");

    const locs = parseCommaSeparatedList(locationsText);
    const activeLocs = locs.length ? [...locs] : [];

    setCreating(true);

    const { error } = await supabase.from("zones").insert([
      {
        zone_name: zn,
        zone_code: zc,
        description: desc ? desc : null,
        city: c ? c : null,
        state: s ? s : null,
        status,
        locations: locs.length ? locs : null,
        active_locations: activeLocs,
      },
    ]);

    setCreating(false);

    if (error) {
      if (
        (error as any)?.code === "23505" ||
        (error.message || "").toLowerCase().includes("zones_zone_code_key")
      ) {
        toast.error("Zone code already exists. Try again.");
        void generateZoneCode(zn, c);
        return;
      }
      toast.error(error.message || "Failed to create zone");
      return;
    }

    toast.success("Zone created");
    setCreateOpen(false);
    resetCreateForm();
    await loadZones();
  };

  const openLocationsDialog = (zone: Zone) => {
    setActiveZone(zone);

    const allLocs = zone.locations ?? [];
    const active = zone.active_locations ?? [];
    const activeValid = active.filter((a) => allLocs.includes(a));

    setSelectedLocations(activeValid);
    setLocDialogOpen(true);
  };

  const toggleLocation = (loc: string) => {
    setSelectedLocations((prev) =>
      prev.includes(loc) ? prev.filter((x) => x !== loc) : [...prev, loc]
    );
  };

  const saveLocations = async () => {
    if (!activeZone) return;

    const allLocs = activeZone.locations ?? [];
    const actives = selectedLocations.filter((x) => allLocs.includes(x));

    setLocSaving(true);

    const { data, error } = await supabase
      .from("zones")
      .update({
        active_locations: actives,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeZone.id)
      .select("id, active_locations")
      .single();

    setLocSaving(false);

    if (error) {
      toast.error(error.message || "Failed to update locations");
      return;
    }

    toast.success("Locations updated");
    setLocDialogOpen(false);

    const idx = zoneIdToIndex.get(activeZone.id);
    if (idx !== undefined) {
      setZones((prev) => {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          active_locations: (data as any)?.active_locations ?? [],
        };
        return next;
      });
    }

    await loadZones();
  };

  const activeCountLabel = (z: Zone) => {
    const total = (z.locations ?? []).length;
    const active = (z.active_locations ?? []).filter((a) =>
      (z.locations ?? []).includes(a)
    ).length;

    if (total === 0) return "—";
    return `${active}/${total}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-lg font-semibold">Zones</div>
        <Button onClick={() => setCreateOpen(true)}>+ Create Zone</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Zone Name</TableHead>
            <TableHead>Zone Code</TableHead>
            <TableHead>City</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Active Locations</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                Loading...
              </TableCell>
            </TableRow>
          )}

          {!loading &&
            zones.map((z, idx) => (
              <TableRow key={z.id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell className="font-medium">{z.zone_name}</TableCell>
                <TableCell>{z.zone_code}</TableCell>
                <TableCell>{z.city ?? "—"}</TableCell>
                <TableCell>{z.state ?? "—"}</TableCell>

                <TableCell>
                  <StatusBadge status={z.status} />
                </TableCell>

                <TableCell className="text-right">{activeCountLabel(z)}</TableCell>

                <TableCell className="text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openLocationsDialog(z)}
                    disabled={(z.locations ?? []).length === 0}
                    title={
                      (z.locations ?? []).length === 0
                        ? "No locations for this zone. Add locations while creating (or update zones.locations in DB)."
                        : "Edit active locations"
                    }
                    aria-label="Edit locations"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}

          {!loading && zones.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                No zones found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Create Zone Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg p-0">
          <div className="h-[80vh] flex flex-col">
            <DialogHeader className="shrink-0 border-b px-6 py-4">
              <DialogTitle>Create Zone</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="zone_name">Zone Name *</Label>
                  <Input
                    id="zone_name"
                    placeholder="e.g. North Zone"
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="e.g. Kolkata"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="e.g. West Bengal"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zone_code">Zone Code (Auto)</Label>
                  <Input
                    id="zone_code"
                    placeholder="Auto generated"
                    value={zoneCode}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: <b>CityLetter + ZoneLetter + Z - 001</b> (e.g. DNZ-006)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Optional details about this zone"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as ZoneStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">active</SelectItem>
                      <SelectItem value="inactive">inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locations">Locations (comma / new line separated)</Label>
                  <Textarea
                    id="locations"
                    placeholder={"e.g.\nBhawanipur\nNewtown\nSealdah\n(or: Ballygunge, Newtown, EM Bypass)"}
                    value={locationsText}
                    onChange={(e) => setLocationsText(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Saved in <b>zones.locations</b>. Default active locations will be all
                    provided locations. You can edit active locations after creation.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="shrink-0 border-t px-6 py-4">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateOpen(false);
                  resetCreateForm();
                }}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button onClick={createZone} disabled={creating || !zoneCode}>
                {creating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Locations Dialog */}
      <Dialog open={locDialogOpen} onOpenChange={setLocDialogOpen}>
        <DialogContent className="max-w-xl p-0">
          <div className="h-[80vh] flex flex-col">
            <DialogHeader className="shrink-0 border-b px-6 py-4">
              <DialogTitle>Locations — {activeZone?.zone_name ?? "Zone"}</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {(activeZone?.locations ?? []).length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No locations found for this zone. Create/edit <b>zones.locations</b>
                </div>
              ) : (
                <div className="space-y-2">
                  {(activeZone?.locations ?? []).map((loc) => (
                    <label
                      key={loc}
                      className="flex items-center gap-3 rounded-md border p-3"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLocations.includes(loc)}
                        onChange={() => toggleLocation(loc)}
                      />
                      <span className="font-medium">{loc}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="shrink-0 border-t px-6 py-4">
              <Button
                variant="outline"
                onClick={() => setLocDialogOpen(false)}
                disabled={locSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={saveLocations}
                disabled={locSaving || (activeZone?.locations ?? []).length === 0}
              >
                {locSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}