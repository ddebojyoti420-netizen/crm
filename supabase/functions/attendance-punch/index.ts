import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type PunchBody = {
    action: "in" | "out";
    attendance_type?: "office" | "site";
    employee_latitude?: number;
    employee_longitude?: number;
    location_id?: string;
};

function jsonRes(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

function errRes(message: string, status = 400) {
    return jsonRes({ ok: false, error: message }, status);
}

function getClient(req: Request) {
    return createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        {
            global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
        }
    );
}

/* ------------------ Helpers ------------------ */

function getIp(req: Request): string | null {
    const cf = req.headers.get("cf-connecting-ip");
    if (cf) return cf.trim();

    const xf = req.headers.get("x-forwarded-for");
    if (xf) return xf.split(",")[0].trim();

    const xr = req.headers.get("x-real-ip");
    if (xr) return xr.trim();

    return null;
}

function kolkataDate() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
}

function kolkataTime() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).format(new Date());
}

function ipv4ToInt(ip: string): number | null {
    const p = ip.split(".").map(Number);
    if (p.length !== 4 || p.some(n => Number.isNaN(n) || n < 0 || n > 255)) return null;
    return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3];
}

function inCidr(ip: string, cidr: string): boolean {
    const [range, bitsStr] = cidr.split("/");
    const bits = Number(bitsStr);

    const ipInt = ipv4ToInt(ip);
    const rangeInt = ipv4ToInt(range);

    if (ipInt == null || rangeInt == null || !Number.isFinite(bits) || bits < 0 || bits > 32) {
        return false;
    }

    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (ipInt & mask) === (rangeInt & mask);
}

function statusForPunchIn(time: string) {
    const [h, m] = time.split(":").map(Number);
    return h > 9 || (h === 10 && m > 15) ? "late" : "present";
}

/* --------- Distance (Haversine, meters) --------- */
function distanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
) {
    const R = 6371000;
    const toRad = (v: number) => (v * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ------------------ Handler ------------------ */

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const supabase = getClient(req);

        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user) return errRes("Unauthorized", 401);

        const body = (await req.json()) as PunchBody;
        if (!body?.action) return errRes("action required");

        const today = kolkataDate();
        const now = kolkataTime();

        /* ---- profile ---- */
        const { data: profile } = await supabase
            .from("profiles")
            .select("id, attendance_type, location_id")
            .eq("user_id", auth.user.id)
            .maybeSingle();

        if (!profile) return errRes("Profile not found");

        const employeeId = profile.id;
        const attType =
            body.attendance_type ?? profile.attendance_type ?? "office";

        /* ------------ OFFICE (IP CHECK) ------------ */
        if (attType === "office") {
            const ip = getIp(req);
            if (!ip) return errRes("IP not detected", 403);

            const { data: company } = await supabase
                .from("company_settings")
                .select("office_ip_cidrs")
                .limit(1)
                .maybeSingle();

            const allowed = (company?.office_ip_cidrs ?? []) as string[];

            const ok = allowed.some((entry) => {
                // allow exact IP OR CIDR
                if (entry.includes("/")) return inCidr(ip, entry);
                return entry.trim() === ip;
            });

            if (!ok) return errRes("Not on office network", 403);
        }

        /* ------------ SITE (GEO CHECK) ------------ */
        let adminLat: number | null = null;
        let adminLng: number | null = null;
        let locationId: string | null = null;

        if (attType === "site") {
            const { employee_latitude, employee_longitude } = body;
            if (!employee_latitude || !employee_longitude)
                return errRes("Employee location required");

            locationId = body.location_id ?? profile.location_id;
            if (!locationId) return errRes("No site location assigned");

            const { data: loc } = await supabase
                .from("attendance_locations")
                .select("latitude, longitude, radius_meters, is_active")
                .eq("id", locationId)
                .maybeSingle();

            if (!loc || !loc.is_active) return errRes("Invalid site location");

            adminLat = Number(loc.latitude);
            adminLng = Number(loc.longitude);

            const dist = distanceMeters(
                employee_latitude,
                employee_longitude,
                adminLat,
                adminLng
            );

            if (dist > Number(loc.radius_meters)) {
                return errRes(`Outside radius (${Math.round(dist)}m)`, 403);
            }
        }

        /* ------------ PUNCH IN ------------ */
        if (body.action === "in") {
            const { data: existing } = await supabase
                .from("attendance_logs")
                .select("id, punch_in, punch_out")
                .eq("employee_id", employeeId)
                .eq("attendance_date", today)
                .maybeSingle();

            if (existing?.punch_in && !existing?.punch_out)
                return errRes("Already punched in", 409);

            const payload: any = {
                employee_id: employeeId,
                attendance_date: today,
                punch_in: now,
                status: statusForPunchIn(now),
                attendance_type: attType,
            };

            if (attType === "site") {
                Object.assign(payload, {
                    employee_latitude: body.employee_latitude,
                    employee_longitude: body.employee_longitude,
                    admin_latitude: adminLat,
                    admin_longitude: adminLng,
                    location_id: locationId,
                });
            }

            

            await supabase.from("attendance_logs").insert(payload);
            return jsonRes({ ok: true, action: "in", status: payload.status });
        }

        /* ------------ PUNCH OUT ------------ */
        const { data: row } = await supabase
            .from("attendance_logs")
            .select("id, punch_out")
            .eq("employee_id", employeeId)
            .eq("attendance_date", today)
            .maybeSingle();

        if (!row || row.punch_out) return errRes("Invalid punch out", 409);

        await supabase
            .from("attendance_logs")
            .update({ punch_out: now })
            .eq("id", row.id);

        return jsonRes({ ok: true, action: "out", status: "Punched Out" });
    } catch (e) {
        return errRes(e instanceof Error ? e.message : "Server error", 500);
    }
});
