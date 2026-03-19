import { Bell, LogOut, User, ChevronDown, Menu, Eye, EyeOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

/* ================= TYPES ================= */

interface HeaderProps {
  title: string;
  subtitle?: string;
  isMobile?: boolean;
  onOpenMobileSidebar?: () => void;
}

type ProfilePhotoRow = {
  photo_path: string | null;
};

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employeeCode: string;
}

/* ================= CHANGE PASSWORD DIALOG ================= */

export function ChangePasswordDialog({
  open,
  onOpenChange,
  employeeCode,
}: ChangePasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      toast.error("Password required");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.updateUser({
      password,
    });

    if (authError) {
      setLoading(false);
      toast.error(authError.message);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ password: password })
      .eq("employee_code", employeeCode);

    setLoading(false);

    if (profileError) {
      toast.error(profileError.message);
      return;
    }

    toast.success("Password updated successfully");
    setPassword("");
    setConfirmPassword("");
    onOpenChange(false);

  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* New password */}
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Confirm password */}
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button onClick={handleUpdatePassword} disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </DialogFooter>
      </DialogContent>

    </Dialog>
  );
}

/* ================= HEADER ================= */

export function Header({
  title,
  subtitle,
  isMobile,
  onOpenMobileSidebar,
}: HeaderProps) {
  const { user, logout } = useAuth();

  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  useEffect(() => {
    let cancelled = false;

    const loadProfilePhoto = async () => {
      const authId =
        (user as any)?.id ||
        (await supabase.auth.getUser()).data.user?.id;

      if (!authId) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("photo_path")
        .eq("id", authId)
        .maybeSingle<ProfilePhotoRow>();

      if (cancelled) return;

      if (error) {
        console.error(error);
        setPhotoPath(null);
        return;
      }

      setPhotoPath(data?.photo_path ?? null);
    };

    loadProfilePhoto();
    return () => {
      cancelled = true;
    };
  }, [(user as any)?.id]);

  const photoSrc = useMemo(() => {
    if (!photoPath) return undefined;
    const s = photoPath.trim();
    return s || undefined;
  }, [photoPath]);

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 gap-4">
        {/* Left */}
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenMobileSidebar}
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}

          <div>
            <h1 className="text-2xl font-serif font-semibold truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 text-[10px] bg-destructive">
                  5
                </Badge>
              </Button>
            </DropdownMenuTrigger>
          </DropdownMenu>

          {/* User menu */}
          {user && (
            <>
              <DropdownMenu><DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="
                    h-10 rounded-full px-2 gap-2
                    transition-colors
                    hover:bg-muted
                    data-[state=open]:bg-muted
                    min-w-0 max-w-[280px]
                  "
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={photoSrc} alt={(user as any).name} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {getInitials((user as any).name ?? "")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="hidden lg:flex items-center gap-2 min-w-0 max-w-[200px]">
                    <span className="text-sm font-medium truncate text-foreground">
                      {(user as any).name}
                    </span>
                  </div>

                  <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                </Button>

              </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-64 p-0 overflow-hidden"
                >
                  <DropdownMenuLabel className="p-0">
                    <div className="flex items-center gap-3 p-4">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={photoSrc} alt={(user as any).name} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                          {getInitials((user as any).name ?? "")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate">
                            {(user as any).name}
                          </p>
                        </div>
                        {(user as any).employee_code && (
                          <p className="text-xs text-muted-foreground truncate">
                            {(user as any).employee_code}
                          </p>
                        )}
                        {(user as any).role && (
                          <Badge className="h-5 px-2 text-[11px] font-medium shrink-0">
                            {String((user as any).role).toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <div className="p-2">
                    <DropdownMenuItem className="rounded-md" onClick={() => setPasswordOpen(true)}>
                      <User className="w-4 h-4 mr-2 opacity-80" />
                      Change Password
                    </DropdownMenuItem>
                  </div>

                  <DropdownMenuSeparator />

                  <div className="p-2">
                    <DropdownMenuItem
                      onClick={logout}
                      className="rounded-md text-destructive"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Dialog */}
              <ChangePasswordDialog
                open={passwordOpen}
                onOpenChange={setPasswordOpen}
                employeeCode={(user as any).employee_code}
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
