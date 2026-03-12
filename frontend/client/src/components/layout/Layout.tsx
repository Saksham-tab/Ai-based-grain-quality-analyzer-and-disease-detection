import { PropsWithChildren } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { cva } from "class-variance-authority";
import {
  Activity,
  FileSearch,
  Leaf,
  Moon,
  RefreshCcw,
  Sun,
  Wifi,
  WifiOff,
  Camera,
  MessageSquare,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItem = cva(
  "group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all duration-200",
  {
    variants: {
      active: {
        true: "text-primary font-semibold",
        false: "text-muted-foreground hover:bg-primary/5 hover:text-foreground",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

import { useState, useEffect } from "react";
import { useGrainData } from "../../hooks/useGrainData";
import { useMqtt } from "../../services/MqttProvider";

function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("gqa:dark") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("gqa:dark", String(isDark));
    } catch {
      // ignore
    }
  }, [isDark]);

  return { isDark, setDark: setIsDark };
}

function formatLastSync(ts: Date) {
  return ts.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });
}

function Topbar() {
  const { isDark, setDark } = useDarkMode();
  const queryClient = useQueryClient();
  const { data, connected: grainConnected } = useGrainData();
  const { connected: mqttConnected, isCapturing, triggerCapture } = useMqtt();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastSync = data?.updatedAt ? new Date(data.updatedAt) : new Date();

  return (
    <div className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-foreground/5">
            <Leaf className="size-5 text-primary" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <div
              className="font-display truncate text-[15px] font-semibold tracking-[-0.01em]"
              data-testid="text-app-title"
            >
              AI Powered Grain Quality Analyzer
            </div>
            <div
              className="truncate text-xs text-muted-foreground"
              data-testid="text-app-subtitle"
            >
              Real-time storage safety + market guidance
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <Button
            className={cn(
              "h-10 rounded-2xl px-6 font-semibold shadow-lg transition-all active:scale-95",
              isCapturing ? "animate-pulse bg-amber-500 hover:bg-amber-600" : "bg-primary hover:bg-primary/90"
            )}
            onClick={triggerCapture}
            disabled={isCapturing}
            data-testid="button-capture-grain"
          >
            {isCapturing ? (
              <RefreshCcw className="mr-2 size-4 animate-spin" />
            ) : (
              <Camera className="mr-2 size-4" />
            )}
            {isCapturing ? "Capturing..." : "Capture Grain Image"}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-2xl border bg-card px-3 py-2 text-xs text-muted-foreground shadow-sm md:flex">
            <span
              className={cn(
                "inline-flex size-2 rounded-full",
                grainConnected ? "bg-emerald-500" : "bg-rose-500",
              )}
              aria-hidden
            />
            <span data-testid="status-connection">
              {grainConnected ? "Connected" : "Offline"}
            </span>
            <span className="mx-2 h-4 w-px bg-border" aria-hidden />
            <span className="inline-flex items-center gap-1">
              {grainConnected ? (
                <Wifi className="size-3.5 text-emerald-500" />
              ) : (
                <WifiOff className="size-3.5 text-rose-500" />
              )}
              <span data-testid="text-last-sync">Last sync {formatLastSync(lastSync)}</span>
            </span>
            <span className="mx-2 h-4 w-px bg-border" aria-hidden />
            <span className="inline-flex items-center gap-1">
              <Wifi className={cn("size-3.5", mqttConnected ? "text-emerald-500" : "text-rose-500")} />
              <span>MQTT {mqttConnected ? "Live" : "Offline"}</span>
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-2xl"
            onClick={() => {
              console.log("🖱️ Manual refresh triggered");
              setIsRefreshing(true);
              queryClient.invalidateQueries({ queryKey: ["grainData"] });
              setTimeout(() => setIsRefreshing(false), 1000);
            }}
            data-testid="button-refresh"
            aria-label="Refresh data"
          >
            <motion.div
              animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <RefreshCcw className="size-4" />
            </motion.div>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-2xl"
            onClick={() => setDark(!isDark)}
            data-testid="button-toggle-darkmode"
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div >
  );
}

function Sidebar() {
  const [location] = useLocation();
  const { data, connected } = useGrainData();

  const items = [
    {
      href: "/",
      label: "Real-Time Analysis",
      icon: Activity,
      testId: "link-nav-realtime",
    },
    {
      href: "/purity",
      label: "Purity Dashboard",
      icon: Leaf,
      testId: "link-nav-purity",
    },
    {
      href: "/reports",
      label: "Report Lookup",
      icon: FileSearch,
      testId: "link-nav-reports",
    },
    {
      href: "/kisan-sahayak",
      label: "Kisan Sahayak",
      icon: MessageSquare,
      testId: "link-nav-kisan-sahayak",
    },
  ];

  return (
    <aside className="sticky top-[65px] hidden h-[calc(100vh-65px)] w-[260px] shrink-0 overflow-y-auto border-r border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl md:block">
      <div className="flex h-full flex-col px-3 py-4">
        <div className="sticky top-0 z-20 -mx-3 -mt-4 bg-slate-50 dark:bg-slate-950 px-5 pb-3 pt-4 border-b border-transparent">
          <div className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/40 dark:bg-white/5 px-3 py-3 backdrop-blur-sm shadow-sm ring-1 ring-black/5 dark:ring-white/5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div
                  className="text-xs font-medium text-muted-foreground"
                  data-testid="text-sidebar-label"
                >
                  Live status
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-slate-900/5 dark:bg-white/10 border-none"
                    data-testid="badge-storage-status"
                  >
                    <span
                      className={cn(
                        "mr-1 inline-flex size-1.5 rounded-full animate-pulse",
                        connected ? "bg-emerald-500" : "bg-amber-500"
                      )}
                    />
                    {connected ? "Live" : "Simulated"}
                  </Badge>
                  <span
                    className="text-xs text-muted-foreground"
                    data-testid="text-batch"
                  >
                    {data?.reportId ? `ID: ${data.reportId}` : "Waiting..."}
                  </span>
                </div>
              </div>
              <div className="flex size-10 items-center justify-center rounded-2xl bg-white/60 dark:bg-white/10 shadow-sm border border-white/20">
                <Leaf className="size-5 text-primary" strokeWidth={2.25} />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { k: "Purity", v: data?.purity ? `${data.purity.toFixed(1)}%` : "--", id: "purity" },
                { k: "Moisture", v: data?.sensorSnapshot?.moisture ? `${data.sensorSnapshot.moisture.toFixed(1)}%` : "--", id: "moisture" },
                { k: "Temp", v: data?.sensorSnapshot?.temperature ? `${data.sensorSnapshot.temperature.toFixed(1)}°C` : "--", id: "temp" },
              ].map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-white/20 bg-white/20 dark:bg-white/5 px-2 py-2"
                >
                  <div className="text-[11px] text-muted-foreground">{m.k}</div>
                  <div
                    className="mt-0.5 text-xs font-semibold"
                    data-testid={`text-sidebar-metric-${m.id}`}
                  >
                    {m.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <nav className="space-y-1 px-1">
          {items.map((it) => {
            const active = location === it.href;
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(navItem({ active }))}
                data-testid={it.testId}
              >
                <div className="relative z-10 flex items-center gap-2">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.92, rotate: -5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <Icon className="size-4" strokeWidth={2.2} />
                  </motion.div>
                  <span className="truncate">{it.label}</span>
                </div>
                {active && (
                  <motion.span
                    layoutId="sidebar-accent-pill"
                    className="absolute inset-0 z-0 rounded-xl bg-primary/10"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                {active && (
                  <motion.span
                    layoutId="sidebar-accent-bar"
                    className="absolute left-[1px] h-5 w-0.75 rounded-r-full bg-primary"
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-2 pt-4">
          <div className="rounded-2xl border bg-background/60 p-3">
            <div
              className="text-xs font-medium text-muted-foreground"
              data-testid="text-ai-label"
            >
              AI advisory
            </div>
            <div
              className="mt-1 text-sm font-semibold leading-snug"
              data-testid="text-ai-sidebar"
            >
              Storage is stable. Keep moisture under 13% to preserve grade A.
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button
                size="sm"
                className="h-8 rounded-xl"
                data-testid="button-view-advice"
              >
                View
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-xl"
                data-testid="button-dismiss-advice"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function MobileNav() {
  const [location] = useLocation();
  const items = [
    { href: "/", label: "Live", icon: Activity, testId: "link-mobile-live" },
    {
      href: "/purity",
      label: "Purity",
      icon: Leaf,
      testId: "link-mobile-purity",
    },
    {
      href: "/reports",
      label: "Reports",
      icon: FileSearch,
      testId: "link-mobile-reports",
    },
    {
      href: "/kisan-sahayak",
      label: "Sahayak",
      icon: MessageSquare,
      testId: "link-mobile-kisan-sahayak",
    },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/40 dark:border-slate-800/40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-7xl grid-cols-3 px-4 py-2">
        {items.map((it) => {
          const active = location === it.href;
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl py-2 text-xs transition-colors",
                active ? "text-foreground" : "text-muted-foreground",
              )}
              data-testid={it.testId}
            >
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-2xl",
                  active ? "bg-foreground/5" : "bg-transparent",
                )}
              >
                <Icon className="size-4" strokeWidth={2.1} />
              </div>
              <span>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-dvh app-surface">
      <Topbar />
      <div className="mx-auto flex w-full max-w-7xl gap-0 px-0 md:px-6">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 pb-24 pt-6 md:px-6 md:pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={(children as any)?.key ?? "page"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
