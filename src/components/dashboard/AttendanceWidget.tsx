import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Wifi, CheckCircle2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ProfileRow = {
  id: string;
  attendance_type: string | null;
};

const kolkataISODate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const normalizeTime = (t: string | null | undefined) => {
  if (t == null) return null;
  const v = String(t).trim();
  return v.length ? v : null;
};

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : "-");

const getGeo = () =>
  new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    })
  );

export function AttendanceWidget() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const [punchIn, setPunchIn] = useState<string | null>(null);
  const [punchOut, setPunchOut] = useState<string | null>(null);

  const attType = useMemo<"office" | "field">(() => {
    const t = (profile?.attendance_type ?? "office").toLowerCase().trim();
    return t === "field" ? "field" : "office";
  }, [profile]);

  const isOffice = attType === "office";
  const isField = attType === "field";

  const officeIsPunchedIn = isOffice && !!normalizeTime(punchIn) && !normalizeTime(punchOut);
  const fieldIsPunchedIn = isField && !!normalizeTime(punchIn) && !normalizeTime(punchOut);

  const attendanceRecorded = useMemo(() => {
    return !!normalizeTime(punchIn) && !!normalizeTime(punchOut);
  }, [punchIn, punchOut]);

  const getProfileByUserId = async (): Promise<ProfileRow> => {
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr) throw authErr;

    const userId = authData.user?.id;
    if (!userId) throw new Error("Not logged in");

    const { data, error } = await supabase
      .from("profiles")
      .select("id, attendance_type")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    const prof = data as ProfileRow | null;
    if (!prof?.id) throw new Error("Profile not linked with user_id");

    return prof;
  };

  const fetchTodayLog = async (empId: string) => {
    const today = kolkataISODate();

    const { data, error } = await supabase
      .from("attendance_logs")
      .select("punch_in,punch_out")
      .eq("employee_id", empId)
      .eq("attendance_date", today)
      .maybeSingle();

    if (error) throw error;

    setPunchIn(normalizeTime(data?.punch_in));
    setPunchOut(normalizeTime(data?.punch_out));
  };

  const init = async () => {
    setLoading(true);
    try {
      const prof = await getProfileByUserId();
      setProfile(prof);
      setEmployeeId(prof.id);
      await fetchTodayLog(prof.id);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to load attendance widget");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const punchOffice = async () => {
    if (!employeeId) return;

    if (!officeIsPunchedIn) {
      const { data, error } = await supabase.functions.invoke("attendance-punch", {
        body: { action: "in", attendance_type: "office" },
      });

      if (error) {
        const status = (error as any)?.context?.status;
        if (status === 403) {
          toast.error("Not in Office Wi-Fi/network, Punch In not allowed");
          return;
        }
        toast.error(error.message || "Punch in failed");
        return;
      }

      toast.success(data?.status === "late" ? "Punched in (Late)" : "Punched in");
      await fetchTodayLog(employeeId);
      return;
    }

    const { error } = await supabase.functions.invoke("attendance-punch", {
      body: { action: "out" },
    });

    if (error) {
      const status = (error as any)?.context?.status;
      if (status === 403) {
        toast.error("Punch Out not allowed");
        return;
      }
      toast.error(error.message || "Punch out failed");
      return;
    }

    toast.success("Punched out");
    await fetchTodayLog(employeeId);
  };

  const punchField = async () => {
    if (!employeeId) return;

    let pos: GeolocationPosition;
    try {
      pos = await getGeo();
    } catch {
      toast.error("Location permission required for Field attendance");
      return;
    }

    const { latitude, longitude } = pos.coords;

    if (!fieldIsPunchedIn) {
      const { data, error } = await supabase.functions.invoke("attendance-punch", {
        body: {
          action: "in",
          employee_latitude: latitude,
          employee_longitude: longitude,
        },
      });

      if (error) {
        toast.error("Today already punched in. Only one punch allowed for attendance.");
        return;
      }

      toast.success(data?.status === "late" ? "Punched in (Field - Late)" : "Punched in (Field)");
      await fetchTodayLog(employeeId);
      return;
    }

    const { error } = await supabase.functions.invoke("attendance-punch", {
      body: {
        action: "out",
        employee_latitude: latitude,
        employee_longitude: longitude,
      },
    });

    if (error) {
      toast.error(error.message || "Field punch out failed");
      return;
    }

    toast.success("Punched out (Field)");
    await fetchTodayLog(employeeId);
  };

  const handleAction = async () => {
    setBusy(true);
    try {
      if (isOffice) await punchOffice();
      else await punchField();
    } catch (e) {
      console.error(e);
      toast.error("Operation failed");
    } finally {
      setBusy(false);
    }
  };

  const buttonText = useMemo(() => {
    if (busy) return "Please wait...";
    if (isOffice) return officeIsPunchedIn ? "Punch Out" : "Punch In";
    return fieldIsPunchedIn ? "Punch Out (Field)" : "Punch In (Field)";
  }, [busy, isOffice, officeIsPunchedIn, fieldIsPunchedIn]);

  return (
    <div
      className={cn(
        "stat-card",
        isOffice ? (officeIsPunchedIn ? "stat-card-success" : "stat-card-primary") : "stat-card-primary"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-white/70 text-sm font-medium">Attendance</p>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
            {currentTime.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>

          <div className="flex items-center gap-2 mt-3">
            {isOffice ? (
              <>
                <Wifi className="w-4 h-4 text-white/70 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-white/70 truncate">Office required</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 text-white/70 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-white/70 truncate">Field location (GPS) required</span>
              </>
            )}
          </div>
        </div>
      </div>

      {(punchIn || punchOut) && (
        <div className="mt-4 p-3 rounded-lg bg-white/10">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">Punch In</span>
            <span className="text-white font-medium">{hhmm(punchIn)}</span>
          </div>

          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-white/70">Punch Out</span>
            <span className="text-white font-medium">{hhmm(punchOut)}</span>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        {attendanceRecorded ? (
          <div className="flex items-center gap-2 text-white">
            <CheckCircle2 className="w-5 h-5 text-white/80" />
            <span className="text-sm font-medium">Attendance recorded</span>
          </div>
        ) : (
          <Button
            type="button"
            onClick={() => void handleAction()}
            disabled={loading || busy}
            className="bg-white/20 hover:bg-white/25 text-white border-0"
          >
            {buttonText}
          </Button>
        )}
      </div>
    </div>
  );
}
