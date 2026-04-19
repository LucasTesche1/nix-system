import { Link, useLocation, useNavigate } from "react-router-dom";
import { Calendar, LogOut, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const loc = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    toast.success("Sessão encerrada");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background bg-mesh">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <img src="/icon-white.png" alt="" width={30} height={30} />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-bold tracking-tight">NIX</div>
              <div className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">
                Oficial System
              </div>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              to="/"
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition sm:px-3",
                loc.pathname === "/"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendários</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="ml-1 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </nav>
        </div>
      </header>
      <main className="container py-6 md:py-8">{children}</main>
    </div>
  );
};
