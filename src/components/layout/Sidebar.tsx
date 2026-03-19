import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import * as LucideIcons from "lucide-react";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/hooks/useSidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Module = {
  id: string;
  name: string;
  route: string;
  icon: string;
  order_no: number;
};

// UI-only: resolve lucide icon name from DB, fallback safe
function resolveIcon(iconName: string): LucideIcon {
  const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[iconName];
  return Icon ?? LucideIcons.LayoutDashboard;
}

function normalizeRoute(route: string): string {
  const clean = (route ?? "").trim();
  const stripped = clean.replace(/^\/?dashboards\/?/, "");

  if (stripped === "" || stripped === "/") return "/dashboard";
  return stripped.startsWith("/") ? stripped : `/${stripped}`;
}

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const { isOpen, isCollapsed, close, setCollapsed } = useSidebar();
  const isMobile = useIsMobile();

  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (isMobile) {
      close();
    }
  }, [location.pathname, isMobile, close]);

  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, isOpen]);

  const sidebarWidth = isMobile ? "w-72" : isCollapsed ? "w-20" : "w-64";

  const fetchModules = async () => {
    try {
      if (!user?.id) {
        setModules([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("role_id")
        .eq("id", user.id)
        .single();

      if (pErr) throw pErr;

      const roleId = profile?.role_id;

      if (!roleId) {
        setModules([]);
        return;
      }

      const { data: roleData, error: rErr } = await supabase
        .from("roles")
        .select("name")
        .eq("id", roleId)
        .single();

      if (rErr) throw rErr;

      const roleName = (roleData?.name ?? "").toLowerCase();

      const isPrivileged = ["admin", "hr", "manager"].includes(roleName);

      if (isPrivileged) {
        const { data, error } = await supabase
          .from("modules")
          .select("id, name, icon, route, order_no")
          .eq("status", "Active")
          .order("order_no");

        if (error) throw error;

        setModules(data ?? []);
        return;
      }

      // 🔵 Normal role → assigned module only
      const { data, error } = await supabase
        .from("role_modules")
        .select("module_id, modules:module_id(id, name, icon, route, order_no, status)")
        .eq("role_id", roleId);

      if (error) throw error;

      const allowed = (data ?? [])
        .map((r: any) => r.modules)
        .filter((m: any) => m && m.status === "Active")
        .sort((a: any, b: any) => (a.order_no ?? 0) - (b.order_no ?? 0));

      setModules(allowed);
    } catch (err) {
      console.error("Sidebar fetchModules error:", err);
      setModules([]);
    } finally {
      setLoading(false);
    }
  };
  if (loading) return null;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
          onClick={close}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-sidebar transition-all duration-300 flex flex-col",
          sidebarWidth,
          isMobile && !isOpen && "-translate-x-full",
          isMobile && isOpen && "translate-x-0"
        )}
      >
        {/* Logo / Brand header */}
        <div className="h-16 px-4 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
            <img src="/favicon.ico" alt="Logo" className="w-full h-full object-contain" />
          </div>

          <div className="min-w-0">
            <div className="font-semibold leading-tight truncate text-white">Phoenix</div>
            <div className="text-[11px] -mt-0.5 truncate text-slate-400">
              Real Estate CRM
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-3 md:overflow-y-auto md:h-[calc(100vh-4rem)]">
          <div className="space-y-1">
            {modules.map((m) => {
              const route = normalizeRoute(m.route);
              const active = location.pathname.startsWith(route);
              const Icon = resolveIcon(m.icon);

              return (
                <Link
                  key={m.id}
                  to={route}
                  className={[
                    "group flex items-center gap-3",
                    "px-3 py-2.5 rounded-lg",
                    "text-sm font-medium transition-all duration-200",
                    "border-l-4",
                    active
                      ? "bg-white/5 text-white border-orange-500"
                      : "text-slate-300 border-transparent hover:bg-white/5 hover:text-white",
                  ].join(" ")}
                >
                  <Icon
                    className={[
                      "w-5 h-5 flex-shrink-0 transition-colors",
                      active ? "text-orange-400" : "text-slate-400 group-hover:text-slate-200",
                    ].join(" ")}
                  />
                  <span className="truncate">{m.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Collapse button - Desktop only */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border shadow-md hover:bg-muted"
            onClick={() => setCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        )}
      </aside>
    </>
  );
}
