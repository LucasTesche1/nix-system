import { Link, useLocation } from "react-router-dom";
import { Calendar, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const loc = useLocation();
  return (
    <div className="min-h-screen bg-background bg-mesh">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight">Cadência</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Content Studio
              </div>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              to="/"
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                loc.pathname === "/"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Calendar className="h-4 w-4" />
              Calendários
            </Link>
          </nav>
        </div>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  );
};
