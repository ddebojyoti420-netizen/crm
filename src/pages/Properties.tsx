import { MainLayout } from "@/components/layout/MainLayout";
import { MapPicker } from "@/components/hr/MapPicker";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search,
  Filter,
  Plus,
  MapPin,
  Bed,
  Bath,
  Heart,
  Eye,
  Grid3X3,
  List,
  Grid2X2,
  Trash2,
  Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { string } from "zod";

/** ===================== Types ===================== */
type PropertyImage = {
  id?: string
  image_url: string
  alt_text: string | null
  created_at?: string
}

type PropertyRow = Tables<"properties"> & {
  property_images?: PropertyImage[]
}

type ZoneRow = {
  id: string;
  active_locations: string[] | null;
};

type FormState = {
  title: string;
  description: string;
  price: string;
  location: string; // area dropdown value -> properties.location
  bedrooms: string;
  bathrooms: string;
  square_feet: string;
  property_type: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  price_per_sqft: string;
  floor_number: string;
  total_floors: string;
  furnishing: string;
  facing: string;
  age_of_property: string;
  rera_number: string;
  has_floor_plan: boolean;
  floor_plan_url: string;
  floor_plan_file: File | null;
  amenities: string;
  emi_available: boolean;
  listing_type: "For Sale" | "For Rent";
  branch_id: string;
  zone_id: string;
  negotiable: boolean;
};

const emptyForm: FormState = {
  title: "",
  description: "",
  price: "",
  location: "",
  bedrooms: "",
  bathrooms: "",
  square_feet: "",
  property_type: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  price_per_sqft: "",
  floor_number: "",
  total_floors: "",
  furnishing: "",
  facing: "",
  age_of_property: "",
  rera_number: "",
  has_floor_plan: false,
  floor_plan_url: "",
  floor_plan_file: null,
  amenities: "",
  emi_available: false,
  listing_type: "For Sale",
  branch_id: "",
  zone_id: "",
  negotiable: false,
};

const PROPERTY_TYPES = ["Apartment", "House", "Commercial", "Land", "New Project"] as const;

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  available: { bg: "bg-success", text: "text-white", label: "Available" },
  pending: { bg: "bg-warning", text: "text-white", label: "Pending" },
  booked: { bg: "bg-info", text: "text-white", label: "Booked" },
  sold: { bg: "bg-destructive", text: "text-white", label: "Sold" },
};

/** ===================== Helpers ===================== */
function formatINR(value: number | null) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `₹ ${Number(value).toLocaleString("en-IN")}`;
}

function toNum(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function getExt(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

const ALLOWED_IMAGE_EXT = new Set(["jpg", "jpeg", "png"]);
const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png"]);

const ALLOWED_ALL_EXT = new Set(["jpg", "jpeg", "png", "pdf"]);
const ALLOWED_ALL_MIME = new Set(["image/jpeg", "image/png", "application/pdf"]);

function validateFile(file: File, kind: "image" | "image_or_pdf") {
  const ext = getExt(file.name);
  const hasMime = !!file.type;

  const mimeSet = kind === "image" ? ALLOWED_IMAGE_MIME : ALLOWED_ALL_MIME;
  const extSet = kind === "image" ? ALLOWED_IMAGE_EXT : ALLOWED_ALL_EXT;

  const mimeOk = hasMime ? mimeSet.has(file.type) : true;
  const extOk = extSet.has(ext);

  const ok = hasMime ? mimeOk && extOk : extOk;

  return {
    ok,
    reason: ok
      ? ""
      : `Invalid file "${file.name}". Only ${kind === "image" ? "JPG/JPEG/PNG" : "JPG/JPEG/PNG/PDF"
      } allowed.`,
  };
}

/** ===================== Supabase Calls ===================== */
async function getProperties(): Promise<PropertyRow[]> {

  const { data, error } = await supabase
    .from("properties")
    .select(`
      *,
      property_images (
        id,
        image_url,
        alt_text,
        created_at
      )
    `)
    .order("created_at", { ascending: false })

  if (error) throw error

  return data ?? []
}

async function getRoles() {
  const { data: Roles, error } = await supabase
    .from("roles")
    .select("id, name")

}

async function uploadToBucketDirect(bucket: string, file: File, filePath: string): Promise<string> {
  const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;

  const { data, error } = await supabase.storage.from(bucket).upload(cleanPath, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return pub.publicUrl;
}

async function getGPSCoords() {
  const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });

  return { lat: pos.coords.latitude, long: pos.coords.longitude };
}

async function getUserZoneContext(userId: string): Promise<{ zone_id: string | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("zone_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  return {
    zone_id: (data as any)?.zone_id ?? null,
  };
}

async function getUserRole(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      role_id,
      roles (
        name
      )
    `)
    .eq("user_id", userId)
    .single();

  if (error) throw error;

  return data?.roles?.name ?? null;
}

async function fetchActiveAreas(zoneId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("zones")
    .select("id, active_locations")
    .eq("id", zoneId)
    .single();

  if (error) throw error;

  const active = (data as ZoneRow | null)?.active_locations ?? [];
  return Array.from(new Set((active ?? []).map((x) => String(x).trim()).filter(Boolean)));
}

/** ===================== Component ===================== */
export default function Properties() {
  const INDIAN_STATES = [
    "Andhra Pradesh",
    "Andaman & Nicobar Islands",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Chandigarh",
    "Goa",
    "Delhi",
    "Dadra & Nagar Haveli and Daman & Diu",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu & Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Puducherry",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ];

  const BUCKET = "property-images";
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<string>("pending");
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...emptyForm });
  const [areaOptions, setAreaOptions] = useState<string[]>([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [existingImages, setExistingImages] = useState<PropertyRow[]>([]);
  const [removeImageIds, setRemoveImageIds] = useState<Set<string>>(new Set());
  const [existingAlt, setExistingAlt] = useState<Record<string, string>>({});
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newAlt, setNewAlt] = useState<Record<number, string>>({});
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyRow | null>(null);
  const [selectedImages, setSelectedImages] = useState<PropertyImage[]>([])
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [userZoneId, setUserZoneId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [mapOpen, setMapOpen] = useState(false);
  const [mapProperty, setMapProperty] = useState<PropertyRow | null>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [activeLocations, setActiveLocations] = useState<any[]>([]);
  const [userAssignedZones, setUserAssignedZones] = useState<string[]>([]); // For Executives
  const handleChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const refreshProperties = async () => {
    const data = await getProperties();
    setProperties(data);
  };

  const resetDialogState = () => {
    setMode("add");
    setEditingId(null);
    setEditingStatus("pending");

    setForm((prev) => ({
      ...emptyForm,
      zone_id: userZoneId ?? "",
      branch_id: prev.branch_id ?? "",
    }));

    setExistingImages([]);
    setRemoveImageIds(new Set());
    setExistingAlt({});

    setNewFiles([]);
    setNewAlt({});
  };

  const openAdd = () => {
    resetDialogState();
    setMode("add");
    setOpen(true);
  };

  const openEdit = async (p: PropertyRow) => {
    resetDialogState();
    setMode("edit");
    setEditingId(p.id);
    setEditingStatus((p.status ?? "pending") as string);

    setForm((prev) => ({
      ...prev,
      title: p.title ?? "",
      description: p.description ?? "",
      price: p.price != null ? String(p.price) : "",
      location: p.location ?? "",
      bedrooms: p.bedrooms != null ? String(p.bedrooms) : "",
      bathrooms: p.bathrooms != null ? String(p.bathrooms) : "",
      square_feet: p.square_feet != null ? String(p.square_feet) : "",
      property_type: p.property_type ?? "",
      address: p.address ?? "",
      city: p.city ?? "",
      state: p.state ?? "",
      country: p.country ?? "India",
      pincode: p.pincode ?? "",
      price_per_sqft: p.price_per_sqft != null ? String(p.price_per_sqft) : "",
      floor_number: p.floor_number != null ? String(p.floor_number) : "",
      total_floors: p.total_floors != null ? String(p.total_floors) : "",
      furnishing: p.furnishing ?? "",
      facing: p.facing ?? "",
      age_of_property: p.age_of_property != null ? String(p.age_of_property) : "",
      rera_number: p.rera_number ?? "",
      floor_plan_url: p.floor_plan ?? "",
      floor_plan_file: null,
      has_floor_plan: !!p.floor_plan,
      amenities: p.amenities ?? "",
      emi_available: !!p.emi_available,
      listing_type: (p.listing_type as any) === "For Rent" ? "For Rent" : "For Sale",
      negotiable: !!(p as any).negotiable,
      branch_id: prev.branch_id,
      zone_id: p.zone_id ?? userZoneId ?? "",
    }));

    try {
      setLoading(true);
      const imgs = p.property_images ?? [];

      const altMap: Record<string, string> = {};
      imgs.forEach((im) => {
        altMap[im.id] = im.alt_text ?? "";
      });
      setExistingAlt(altMap);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load images");
    } finally {
      setLoading(false);
    }

    setOpen(true);
  };

  const toggleRemoveExisting = (id: string) => {
    setRemoveImageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onPickFloorPlan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    const { ok, reason } = validateFile(file, "image_or_pdf");
    if (!ok) {
      toast.error(reason);
      e.target.value = "";
      return;
    }

    setForm((prev) => ({ ...prev, floor_plan_file: file }));
  };

  const onPickFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const picked = Array.from(files);

    const valid: File[] = [];
    const rejected: string[] = [];

    for (const f of picked) {
      const v = validateFile(f, "image");
      if (v.ok) valid.push(f);
      else rejected.push(f.name);
    }

    if (rejected.length) toast.error(`Rejected (only JPG/JPEG/PNG allowed): ${rejected.join(", ")}`);
    if (valid.length === 0) return;

    setNewFiles((prev) => {
      const startIndex = prev.length;

      setNewAlt((prevAlt) => {
        const next = { ...prevAlt };
        valid.forEach((_, i) => {
          const idx = startIndex + i;
          if (next[idx] == null) next[idx] = "";
        });
        return next;
      });

      return [...prev, ...valid];
    });
  };

  const validateBasics = () => {
    if (!form.title.trim()) return "Title required";
    if (!form.property_type) return "Select Property Type";
    const privilegedRoles = ["admin", "hr", "manager"];
    const isPrivileged = privilegedRoles.includes(userRole ?? "");
    if (mode === "add" && !form.zone_id && !isPrivileged) {
      return "Zone not set for this user";
    }
    if (!form.location.trim()) return "Area required";
    if (mode === "add" && !form.address?.trim()) return "Fill address";
    if (mode === "add" && !form.age_of_property?.trim()) return "Property age required";
    for (let i = 0; i < newFiles.length; i++) {
      const alt = (newAlt[i] ?? "").trim();
      if (!alt) return `Alternative text required for new image #${i + 1}`;
    }
    if (!userId) return "User not logged in";
    return null;
  };

  const uploadFloorPlanIfNeeded = async (propertyId: string): Promise<string | null> => {
    if (!form.has_floor_plan) return null;
    if (form.floor_plan_file) {
      const v = validateFile(form.floor_plan_file, "image_or_pdf");
      if (!v.ok) throw new Error(v.reason || "Invalid floor plan file");

      const ext = getExt(form.floor_plan_file.name) || "pdf";
      const filePath = `${propertyId}/floorplan_${Date.now()}.${ext}`;
      return await uploadToBucketDirect(BUCKET, form.floor_plan_file, filePath);
    }

    return form.floor_plan_url?.trim() ? form.floor_plan_url.trim() : null;
  };

  const insertNewImages = async (propertyId: string) => {
    if (newFiles.length === 0) return;

    const uploadedUrls: string[] = [];

    for (let i = 0; i < newFiles.length; i++) {
      const f = newFiles[i];
      const ext = getExt(f.name) || "jpg";
      const filePath = `${propertyId}/${Date.now()}_${i}.${ext}`;
      const url = await uploadToBucketDirect(BUCKET, f, filePath);
      uploadedUrls.push(url);
    }

    const payload = uploadedUrls.map((url, idx) => ({
      property_id: propertyId,
      image_url: url,
      alt_text: (newAlt[idx] ?? "").trim() || null,
    }));

    const { error } = await supabase.from("property_images").insert(payload);
    if (error) throw error;
  };

  const deleteRemovedImages = async () => {
    const toDelete = Array.from(removeImageIds);
    if (toDelete.length === 0) return;

    const { error } = await supabase.from("property_images").delete().in("id", toDelete);
    if (error) throw error;
  };

  const updateExistingAltTexts = async () => {
    const remaining = existingImages.filter((x) => !removeImageIds.has(x.id));
    for (const img of remaining) {
      const nextAlt = (existingAlt[img.id] ?? "").trim() || null;
      const curAlt = (img.property_images?.[0]?.alt_text ?? "").trim() || null;
      if (nextAlt === curAlt) continue;

      const { error } = await supabase
        .from("property_images")
        .update({ alt_text: nextAlt })
        .eq("id", img.id);

      if (error) throw error;
    }
  };

  const saveProperty = async () => {
    const err = validateBasics();
    if (err) return toast.error(err);

    // GPS required (as per your current flow)
    let gps: { lat: number; long: number };
    try {
      gps = await getGPSCoords();
    } catch (e: any) {
      const msg =
        e?.code === 1
          ? "Location permission denied. Please allow location and try again."
          : e?.code === 2
            ? "Location unavailable. Turn on GPS and try again."
            : e?.code === 3
              ? "Location request timed out. Try again."
              : e?.message || "Failed to get GPS location";
      toast.error(msg);
      return;
    }

    const statusToStore = mode === "add" ? "pending" : (editingStatus ?? "pending");
    const payload = {
      user_id: userId,
      title: form.title,
      description: form.description || null,
      price: form.price ? Number(form.price) : null,
      location: form.location || null,

      bedrooms: toNum(form.bedrooms),
      bathrooms: toNum(form.bathrooms),
      square_feet: toNum(form.square_feet),
      property_type: form.property_type || null,
      status: statusToStore,

      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      country: form.country || "India",
      pincode: form.pincode || null,

      price_per_sqft: toNum(form.price_per_sqft),
      floor_number: toNum(form.floor_number),
      total_floors: toNum(form.total_floors),
      furnishing: form.furnishing || null,
      facing: form.facing || null,
      age_of_property: toNum(form.age_of_property),
      rera_number: form.rera_number || null,

      amenities: form.amenities || null,
      emi_available: form.emi_available,
      listing_type: form.listing_type,

      branch_id: form.branch_id || null,
      zone_id: form.zone_id || null,
      negotiable: form.negotiable,

      lat: gps.lat.toString(),
      long: gps.long.toString(),
    };

    setLoading(true);
    try {
      if (mode === "add") {
        const { data: inserted, error } = await supabase
          .from("properties")
          .insert({ ...payload, created_at: new Date().toISOString() })
          .select("id")
          .single();

        if (error) throw error;

        const propertyId = inserted.id as string;

        // floor plan
        const fpUrl = await uploadFloorPlanIfNeeded(propertyId);
        if (fpUrl) {
          const { error: fpErr } = await supabase
            .from("properties")
            .update({ floor_plan: fpUrl })
            .eq("id", propertyId);
          if (fpErr) throw fpErr;
        }

        // images
        await insertNewImages(propertyId);

        toast.success("Property added (Pending)");
      } else {
        if (!editingId) throw new Error("Missing editing id");

        const { error } = await supabase
          .from("properties")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editingId);

        if (error) throw error;

        // images update flow
        await deleteRemovedImages();
        await updateExistingAltTexts();
        await insertNewImages(editingId);

        // floor plan update
        const fpUrl = await uploadFloorPlanIfNeeded(editingId);
        const { error: fpErr } = await supabase
          .from("properties")
          .update({ floor_plan: fpUrl })
          .eq("id", editingId);
        if (fpErr) throw fpErr;

        toast.success("Property updated");
      }

      setOpen(false);
      resetDialogState();
      await refreshProperties();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const openDetails = (p: PropertyRow) => {
    setSelectedProperty(p);
    setSelectedImages(p.property_images ?? []);
    setDetailsOpen(true);
    setActiveImg(0);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedProperty(null);
    setSelectedImages([]);
    setDetailsLoading(false);
    setActiveImg(0);
  };

  const deleteProperty = async (propertyId: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    setLoading(true);
    try {
      // storage delete (best effort)
      const { data: images, error: fetchErr } = await supabase
        .from("property_images")
        .select("image_url")
        .eq("property_id", propertyId);

      if (fetchErr) throw fetchErr;

      const paths = (images ?? [])
        .map((img: any) => {
          if (!img.image_url) return null;
          const parts = String(img.image_url).split("/property-images/");
          return parts[1] ?? null;
        })
        .filter(Boolean) as string[];

      if (paths.length) {
        const { error: storageErr } = await supabase.storage.from("property-images").remove(paths);
        if (storageErr) throw storageErr;
      }

      const { error: imgErr } = await supabase
        .from("property_images")
        .delete()
        .eq("property_id", propertyId);
      if (imgErr) throw imgErr;

      const { error: propErr } = await supabase.from("properties").delete().eq("id", propertyId);
      if (propErr) throw propErr;

      toast.success("Property deleted");
      await refreshProperties();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Failed to delete property");
    } finally {
      setLoading(false);
    }
  };

  const isPrivileged =
    userRole === "admin" ||
    userRole === "hr" ||
    userRole === "manager" ||
    userRole === "backoffice";

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;

        const uid = authData?.user?.id ?? null;
        if (!uid) throw new Error("User not logged in");

        if (!alive) return;
        setUserId(uid);

        const ctx = await getUserZoneContext(uid);
        if (!alive) return;

        setUserZoneId(ctx.zone_id ?? null);

        setForm((prev) => ({
          ...prev,
          zone_id: ctx.zone_id ?? "",
        }));

        if (ctx.zone_id) {
          setAreasLoading(true);
          const areas = await fetchActiveAreas(ctx.zone_id);
          if (alive) setAreaOptions(areas);
          setAreasLoading(false);
        } else {
          toast.error("No zone mapped for this user");
          setAreaOptions([]);
        }

        const data = await getProperties();
        if (alive) setProperties(data);
      } catch (e: any) {
        console.error(e);
        toast.error(e?.message ?? "Failed to load properties");
        if (alive) setProperties([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id;
      if (!uid) return;

      const role = await getUserRole(uid);
      if (alive) setUserRole(role);
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (selectedZoneId && isPrivileged) {
      const fetchZoneLocations = async () => {
        const { data } = await supabase
          .from("zones")
          .select("active_locations")
          .eq("id", selectedZoneId);
        setActiveLocations(data || []);
      };
      fetchZoneLocations();
    }
  }, [selectedZoneId]);

  useEffect(() => {
    const loadLocationData = async () => {
      if (!userId) return;

      if (isPrivileged) {
        const { data } = await supabase
          .from("zones")
          .select("*");

        setZones(data || []);
        return;
      }

      const { data: assignmentData } = await supabase
        .from("profiles")
        .select("zone_id")
        .eq("user_id", userId);

      const assignedIds =
        assignmentData
          ?.map(a => a.zone_id)
          .filter(id => id !== null && id !== undefined) || [];

      if (assignedIds.length === 0) {
        setActiveLocations([]);
        return;
      }

      const { data: locData } = await supabase
        .from("zones")
        .select("*")
        .in("id", assignedIds);

      setActiveLocations(locData || []);
    };

    if (openAdd || openEdit) loadLocationData();
  }, [open, userId, isPrivileged]);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    return properties.filter((p) => {
      const hay = [p.title, p.location, p.city, p.state, p.property_type, p.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || hay.includes(q);

      const matchesType =
        typeFilter === "all" || (p.property_type ?? "").toLowerCase() === typeFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "all" || (p.status ?? "").toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [properties, searchText, typeFilter, statusFilter]);

  return (
    <MainLayout title="Properties" subtitle="Manage your property inventory">
      <div className="space-y-6">
        {/* Filters and Actions */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search properties..."
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isPrivileged && mode === "edit" && (
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Button variant="outline" size="icon" className="flex-shrink-0">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-sm text-muted-foreground">
              {loading ? "Loading..." : `${filtered.length} properties`}
            </div>

            <div className="flex gap-2 flex-wrap justify-end">
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="rounded-none h-9 w-9"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="rounded-none h-9 w-9"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              <Button
                className="bg-accent hover:bg-accent/90 text-accent-foreground h-9"
                onClick={openAdd}
              >
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Property</span>
              </Button>
            </div>
          </div>
        </div>

        {!loading && filtered.length === 0 ? (
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            No properties found.
          </div>
        ) : null}

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((property) => {
              const statusKey = (property.status ?? "pending") as string;
              const status =
                statusColors[statusKey] ??
                statusColors["pending"] ?? {
                  bg: "bg-muted",
                  text: "text-foreground",
                  label: statusKey,
                };

              return (
                <Card key={property.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={property.property_images?.[0]?.image_url
                        ?? "https://placehold.co/800x600/png?text=Property"}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    <div className="absolute top-3 right-3 flex gap-2">
                      <Button variant="secondary" size="icon" className="w-8 h-8 bg-white/90 hover:bg-white">
                        <Heart className="w-4 h-4" />
                      </Button>
                      <Button variant="secondary" size="icon" className="w-8 h-8 bg-white/90 hover:bg-white">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <p className="text-white text-lg font-semibold">{formatINR(property.price)}</p>
                    </div>
                  </div>

                  <CardContent className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{property.title}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {property.location ?? "—"}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {property.property_type ?? "—"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <Badge className={cn(status.bg, status.text, "border-0")}>{status.label}</Badge>
                    </div>

                    <div className="flex items-center gap-4 py-3 border-y border-border my-3">
                      <div className="flex items-center gap-1 text-sm">
                        <Bed className="w-4 h-4 text-muted-foreground" />
                        <span>{property.bedrooms ?? "—"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Bath className="w-4 h-4 text-muted-foreground" />
                        <span>{property.bathrooms ?? "—"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Grid2X2 className="w-4 h-4 text-muted-foreground" />
                        <span>{property.square_feet ?? "—"}</span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground mb-3">
                      {property.address ?? property.city ?? property.state ?? ""}
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-2">
                      <Button variant="default" size="sm" onClick={() => openEdit(property)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMapProperty(property);
                          setMapOpen(true);
                        }}
                        className={cn(
                          "flex items-center gap-2",
                          property.status === 'available'
                            ? "border-green-500 text-green-600"
                            : "border-amber-500 text-amber-600"
                        )}
                      >
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs font-medium">
                          {property.status === 'available' ? "View Location" : (isPrivileged ? "Verify Site" : "Pending Location")}
                        </span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openDetails(property)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => deleteProperty(property.id)}
                        disabled={loading}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => {
              const statusKey = (p.status ?? "pending") as string;
              const status =
                statusColors[statusKey] ??
                statusColors["pending"] ?? {
                  bg: "bg-muted",
                  text: "text-foreground",
                  label: statusKey,
                };

              return (
                <Card key={p.id} className="overflow-hidden">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold truncate">{p.title}</div>
                        <Badge className={cn(status.bg, status.text, "border-0")}>{status.label}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {p.location ?? "—"} • {p.property_type ?? "—"}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="font-semibold">{formatINR(p.price)}</div>
                      <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openDetails(p)}>
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD / EDIT DIALOG */}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetDialogState();
        }}
      >
        <DialogContent className="max-w-5xl h-[90vh] p-0 flex flex-col overflow-hidden">
          <div className="shrink-0 border-b bg-background px-6 py-4">
            <DialogHeader>
              <DialogTitle>{mode === "add" ? "Add New Property" : "Edit Property"}</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-muted-foreground">
              {mode === "add" ? "New listing will be Pending by default." : "Update listing details and images."}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Basic Info */}
            <div className="rounded-xl border p-4 space-y-4">
              <div className="font-semibold">Basic Info</div>

              <div className="space-y-2">
                <Label>Property Title</Label>
                <Input value={form.title} onChange={(e) => handleChange("title", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Property Type</Label>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPES.map((t) => (
                    <Button
                      key={t}
                      type="button"
                      variant={form.property_type === t ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => handleChange("property_type", t)}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 py-4">
                {/* STEP 1: ZONE SELECTION (Admin/HR/Backoffice Only) */}
                {isPrivileged && (
                  <div className="space-y-2">
                    <Label>Select Zone</Label>
                    <Select onValueChange={(val) => setSelectedZoneId(val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a zone..." />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map((zone) => (
                          <SelectItem key={zone.id} value={zone.id}>
                            {zone.zone_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* STEP 2: LOCATION SELECTION (Everyone) */}
                <div className="space-y-2">
                  <Label>Active Location</Label>
                  <Select
                    disabled={isPrivileged && !selectedZoneId}
                    onValueChange={(val) => setForm({ ...form, zone_id: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isPrivileged ? "Select zone first..." : "Select location..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {activeLocations.map((zone) =>
                        zone.active_locations?.map((location: string, index: number) => (
                          <SelectItem key={`${zone.id}-${index}`} value={location}>
                            {location}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {!isPrivileged && activeLocations.length === 0 && (
                    <p className="text-xs text-destructive">No zones assigned to your account. Contact Admin.</p>
                  )}
                </div>
              </div>

              {mode === "edit" && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editingStatus}
                    onValueChange={(v) => setEditingStatus(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booked">Booked</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Category</Label>
                <div className="flex gap-2">
                  {(["For Sale", "For Rent"] as const).map((t) => (
                    <Button
                      key={t}
                      type="button"
                      variant={form.listing_type === t ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => handleChange("listing_type", t)}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>

              {!["admin", "hr"].includes(userRole ?? "") && (
                <div className="space-y-2">
                  <Label>Area</Label>
                  <Select
                    value={form.location}
                    onValueChange={(v) => handleChange("location", v)}
                    disabled={!form.zone_id || areasLoading || areaOptions.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !form.zone_id
                            ? "Zone not set"
                            : areasLoading
                              ? "Loading areas..."
                              : areaOptions.length === 0
                                ? "No active areas"
                                : "Select Area"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {areaOptions.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Location */}
            <div className="rounded-xl border p-4 space-y-4">
              <div className="font-semibold">Location</div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => handleChange("address", e.target.value)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={form.city} onChange={(e) => handleChange("city", e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>State</Label>
                  <Select value={form.state} onValueChange={(v) => setForm((p) => ({ ...p, state: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your state" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {INDIAN_STATES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Zip</Label>
                  <Input value={form.pincode} onChange={(e) => handleChange("pincode", e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input value={form.country} onChange={(e) => handleChange("country", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="rounded-xl border p-4 space-y-4">
              <div className="font-semibold">Pricing</div>

              <div className="space-y-2">
                <Label>Price</Label>
                <Input type="number" value={form.price} onChange={(e) => handleChange("price", e.target.value)} />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-medium">Negotiable</div>
                  <div className="text-sm text-muted-foreground">Price Type</div>
                </div>
                <Checkbox checked={form.negotiable} onCheckedChange={(v) => handleChange("negotiable", !!v)} />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-medium">EMI</div>
                  <div className="text-sm text-muted-foreground">Available</div>
                </div>
                <Checkbox checked={form.emi_available} onCheckedChange={(v) => handleChange("emi_available", !!v)} />
              </div>
            </div>

            {/* Property Details */}
            <div className="rounded-xl border p-4 space-y-4">
              <div className="font-semibold">Property Details</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bedrooms</Label>
                  <Input value={form.bedrooms} onChange={(e) => handleChange("bedrooms", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Bathrooms</Label>
                  <Input value={form.bathrooms} onChange={(e) => handleChange("bathrooms", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Square Feet</Label>
                  <Input value={form.square_feet} onChange={(e) => handleChange("square_feet", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Floor Number</Label>
                  <Input value={form.floor_number} onChange={(e) => handleChange("floor_number", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Total Floors</Label>
                  <Input value={form.total_floors} onChange={(e) => handleChange("total_floors", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Furnishing</Label>
                  <Input value={form.furnishing} onChange={(e) => handleChange("furnishing", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Facing</Label>
                  <Input value={form.facing} onChange={(e) => handleChange("facing", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Age of Property</Label>
                  <Input value={form.age_of_property} onChange={(e) => handleChange("age_of_property", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>RERA Number</Label>
                  <Input value={form.rera_number} onChange={(e) => handleChange("rera_number", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Amenities</Label>
                  <Input value={form.amenities} onChange={(e) => handleChange("amenities", e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Floor Plan</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={form.has_floor_plan ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => setForm((p) => ({ ...p, has_floor_plan: true }))}
                    >
                      Yes
                    </Button>

                    <Button
                      type="button"
                      variant={!form.has_floor_plan ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          has_floor_plan: false,
                          floor_plan_file: null,
                          floor_plan_url: "",
                        }))
                      }
                    >
                      No
                    </Button>
                  </div>
                </div>

                {form.has_floor_plan ? (
                  <div className="space-y-2">
                    <Label>Upload Floor Plan (JPG/JPEG/PNG/PDF)</Label>
                    <Input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                      onChange={onPickFloorPlan}
                    />
                    {form.floor_plan_file ? (
                      <div className="text-xs text-muted-foreground">Selected: {form.floor_plan_file.name}</div>
                    ) : form.floor_plan_url ? (
                      <div className="text-xs text-muted-foreground">Existing: {form.floor_plan_url}</div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Images */}
            <div className="rounded-xl border p-4 space-y-4">
              <div className="flex items-center justify-between mt-auto pt-3">
                <div className="font-semibold">Images (JPG/JPEG/PNG)</div>

                <label className="cursor-pointer">
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={(e) => onPickFiles(e.target.files)}
                  />
                  <span className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-muted">
                    + Add Images
                  </span>
                </label>
              </div>

              {/* Existing Images */}
              {mode === "edit" && existingImages.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Existing Images</div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {existingImages.map((img) => {
                      const removed = removeImageIds.has(img.id);
                      const altTextValue = existingAlt[img.id] ?? "";

                      return (
                        <div key={img.id} className="rounded-xl border p-3 space-y-3">
                          <div className={cn("relative rounded-lg overflow-hidden border", removed && "opacity-50")}>
                            <img src={img.image_url} alt={altTextValue || ""} className="h-28 w-full object-cover" />

                            <Button
                              type="button"
                              size="icon"
                              variant={removed ? "secondary" : "destructive"}
                              className="absolute top-2 right-2 h-7 w-7 rounded-full"
                              onClick={() => toggleRemoveExisting(img.id)}
                            >
                              ✕
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Alternative text</Label>
                            <Input
                              value={altTextValue}
                              disabled={removed}
                              onChange={(e) =>
                                setExistingAlt((prev) => ({ ...prev, [img.id]: e.target.value }))
                              }
                              placeholder="e.g. Front elevation view"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* New Images */}
              {newFiles.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium">New Images</div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {newFiles.map((f, idx) => {
                      const preview = URL.createObjectURL(f);
                      const altTextValue = newAlt[idx] ?? "";

                      return (
                        <div key={`${f.name}-${idx}`} className="rounded-xl border p-3 space-y-3">
                          <div className="relative rounded-lg overflow-hidden border">
                            <img src={preview} alt={altTextValue || ""} className="h-28 w-full object-cover" />

                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2 h-7 w-7 rounded-full"
                              onClick={() => {
                                setNewFiles((prev) => prev.filter((_, i) => i !== idx));
                                setNewAlt((prev) => {
                                  const next: Record<number, string> = {};
                                  const kept = newFiles.filter((_, i) => i !== idx);
                                  kept.forEach((_, newIdx) => {
                                    const oldIdx = newIdx >= idx ? newIdx + 1 : newIdx;
                                    next[newIdx] = prev[oldIdx] ?? "";
                                  });
                                  return next;
                                });
                              }}
                            >
                              ✕
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Alternative text</Label>
                            <Input
                              value={altTextValue}
                              onChange={(e) => setNewAlt((prev) => ({ ...prev, [idx]: e.target.value }))}
                              placeholder="e.g. Living room"
                              required
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Description */}
            <div className="rounded-xl border p-4 space-y-3">
              <div className="font-semibold">Description</div>
              <Label>Property Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>

          <div className="shrink-0 border-t bg-background px-6 py-4">
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" onClick={saveProperty} disabled={loading}>
                {loading ? "Saving..." : mode === "add" ? "Add Property" : "Update Property"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* VIEW DETAILS DIALOG */}
      <Dialog
        open={detailsOpen}
        onOpenChange={(v) => {
          if (!v) closeDetails();
          else setDetailsOpen(true);
        }}
      >
        <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col overflow-hidden">
          <div className="shrink-0 border-b bg-background px-6 py-4">
            <DialogHeader>
              <DialogTitle>Property Details</DialogTitle>
            </DialogHeader>
            {selectedProperty?.title ? (
              <div className="mt-1 text-sm text-muted-foreground">{selectedProperty.title}</div>
            ) : null}
          </div>

          <div className="flex-1 overflow-auto px-6 py-4 space-y-6">
            {detailsLoading ? (
              <div className="text-sm text-muted-foreground">Loading details...</div>
            ) : selectedProperty ? (
              <>
                {selectedImages.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Images</div>

                    <div className="relative rounded-xl border overflow-hidden bg-muted/20">
                      <img
                        src={selectedImages[activeImg]?.image_url}
                        alt={selectedImages[activeImg]?.alt_text ?? selectedProperty?.title ?? "Property image"}
                        className="w-full h-[320px] md:h-[380px] object-cover"
                        loading="lazy"
                      />

                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white shadow"
                        onClick={() => setActiveImg((i) => (i - 1 + selectedImages.length) % selectedImages.length)}
                        disabled={selectedImages.length <= 1}
                      >
                        ‹
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white shadow"
                        onClick={() => setActiveImg((i) => (i + 1) % selectedImages.length)}
                        disabled={selectedImages.length <= 1}
                      >
                        ›
                      </Button>

                      {selectedImages[activeImg]?.alt_text ? (
                        <div className="absolute bottom-3 left-3 rounded-full bg-background/90 px-3 py-1 text-xs">
                          {selectedImages[activeImg]?.alt_text}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {selectedImages.map((img, idx) => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => setActiveImg(idx)}
                          className={cn(
                            "shrink-0 rounded-lg border overflow-hidden w-24 h-16",
                            idx === activeImg ? "ring-2 ring-primary" : "opacity-80 hover:opacity-100"
                          )}
                          title={img.alt_text ?? ""}
                        >
                          <img src={img.image_url} alt={img.alt_text ?? ""} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No images found.</div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <div className="text-sm font-medium">Basics</div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Listing:</span>{" "}
                        {(selectedProperty.listing_type as any) ?? "-"}
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Type:</span>{" "}
                        {selectedProperty.property_type ?? "-"}
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Status:</span>{" "}
                        {selectedProperty.status ?? "-"}
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Price:</span>{" "}
                        {selectedProperty.price ?? "-"}
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Area (short):</span>{" "}
                        {selectedProperty.location ?? "-"}
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Bedrooms:</span>{" "}
                        {selectedProperty.bedrooms ?? "-"} |{" "}
                        <span className="text-muted-foreground">Bathrooms:</span>{" "}
                        {selectedProperty.bathrooms ?? "-"}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <div className="text-sm font-medium">Location</div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Address:</span>{" "}
                        {selectedProperty.address ?? "-"}
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">City:</span>{" "}
                        {selectedProperty.city ?? "-"}
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">State:</span>{" "}
                        {selectedProperty.state ?? "-"}
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Pincode:</span>{" "}
                        {selectedProperty.pincode ?? "-"}
                      </div>
                      {selectedProperty.lat && selectedProperty.long ? (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Coords:</span>{" "}
                          {selectedProperty.lat}, {selectedProperty.long}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </div>

                {selectedProperty.description ? (
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <div className="text-sm font-medium">Description</div>
                      <div className="text-sm whitespace-pre-wrap">{selectedProperty.description}</div>
                    </CardContent>
                  </Card>
                ) : null}
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No property selected.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <MapPicker
        open={mapOpen}
        onClose={() => {
          setMapOpen(false);
          setMapProperty(null);
        }}
        key={mapProperty?.id ?? "map-picker"}
        readOnly={!isPrivileged}

        initialLat={
          mapProperty?.lat ? Number(mapProperty.lat) : undefined
        }
        initialLng={
          mapProperty?.long ? Number(mapProperty.long) : undefined
        }

        onSelect={async (lat: number, lng: number) => {
          if (!mapProperty) return;

          // Executive users → view only
          if (!isPrivileged) {
            toast.info("Executives: Viewing current location only.");
            setMapOpen(false);
            return;
          }

          try {
            const { error } = await supabase
              .from("properties")
              .update({
                lat: lat.toString(),
                long: lng.toString(),
                status: "available",
                updated_at: new Date().toISOString(),
              })
              .eq("id", mapProperty.id);

            if (error) throw error;

            toast.success("Site verified. Location updated successfully.");

            setMapOpen(false);
            setMapProperty(null);

            await refreshProperties();
          } catch (e: any) {
            console.error(e);
            toast.error(e?.message ?? "Failed to update location");
          }
        }}
      />
    </MainLayout>
  );
}
