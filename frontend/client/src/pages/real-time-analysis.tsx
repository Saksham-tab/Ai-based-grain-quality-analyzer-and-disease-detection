import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  Download,
  Info,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RollingNumber } from "@/components/ui/rolling-number";
import { AiLoading } from "@/components/ui/ai-loading";

import { useGrainData } from "../hooks/useGrainData";
import apiService from "../services/apiService";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

type SensorStatus = "Safe" | "Warning" | "Critical";

type Sensor = {
  id: "temp" | "humidity" | "moisture";
  label: string;
  unit: string;
  ideal: string;
  min: number;
  max: number;
  value: number;
  status: SensorStatus;
  trend: { t: string; v: number }[];
};

type Reading = {
  ts: string;
  temperature: number;
  humidity: number;
  moisture: number;
  purity: number;
  price: number;
  shelfLifeMonths: number;
};

function statusStyles(status: SensorStatus) {
  switch (status) {
    case "Safe":
      return {
        ring: "stroke-emerald-500",
        badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        dot: "bg-emerald-500",
      };
    case "Warning":
      return {
        ring: "stroke-amber-500",
        badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
        dot: "bg-amber-500",
      };
    case "Critical":
      return {
        ring: "stroke-rose-500",
        badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
        dot: "bg-rose-500",
      };
  }
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function GaugeRing({
  value,
  min,
  max,
  status,
}: {
  value: number;
  min: number;
  max: number;
  status: SensorStatus;
}) {
  const pct = ((clamp(value, min, max) - min) / (max - min)) * 100;
  const dash = 264; // circumference-ish for r=42
  const offset = dash - (pct / 100) * dash;
  const styles = statusStyles(status);

  return (
    <svg viewBox="0 0 100 100" className="size-24" aria-hidden>
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="currentColor"
        className="stroke-foreground/10"
        strokeWidth="10"
      />
      <motion.circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        strokeLinecap="round"
        className={styles.ring}
        strokeWidth="10"
        strokeDasharray={dash}
        animate={{ strokeDashoffset: offset }}
        initial={{ strokeDashoffset: dash }}
        transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
        style={{ transformOrigin: "50% 50%", transform: "rotate(-90deg)" }}
      />
    </svg>
  );
}

function Sparkline({ data, status }: { data: { t: string; v: number }[]; status: SensorStatus }) {
  const styles = statusStyles(status);
  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`g-${status}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.35} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="t" hide />
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Tooltip content={() => null} />
          <Area
            type="monotone"
            dataKey="v"
            stroke="currentColor"
            fill={`url(#g-${status})`}
            className={cn(
              "text-foreground/30",
              status === "Safe" && "text-emerald-500",
              status === "Warning" && "text-amber-500",
              status === "Critical" && "text-rose-500",
            )}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function SensorGaugeCard({ sensor }: { sensor: Sensor }) {
  const styles = statusStyles(sensor.status);

  return (
    <Card className="card-premium group rounded-3xl border bg-card p-4 transition-all md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold" data-testid={`text-sensor-title-${sensor.id}`}>
            {sensor.label}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <Badge className={cn("rounded-full", styles.badge)} data-testid={`badge-sensor-status-${sensor.id}`}>
              <span className={cn("mr-1 inline-flex size-1.5 rounded-full", styles.dot)} aria-hidden />
              {sensor.status}
            </Badge>
            <span className="text-xs text-muted-foreground" data-testid={`text-sensor-ideal-${sensor.id}`}>
              Ideal {sensor.ideal}
            </span>
          </div>
        </div>

        <div className="relative">
          <GaugeRing value={sensor.value} min={sensor.min} max={sensor.max} status={sensor.status} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div
              className="font-display text-xl font-semibold tracking-[-0.02em]"
              data-testid={`text-sensor-value-${sensor.id}`}
            >
              <RollingNumber value={sensor.value} precision={1} />
              <span className="ml-0.5 text-xs font-medium text-muted-foreground">{sensor.unit}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground" data-testid={`text-sensor-trend-${sensor.id}`}>
            Last 24h
          </div>
          <UiTooltip>
            <TooltipTrigger asChild>
              <button
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-foreground/5"
                data-testid={`button-sensor-info-${sensor.id}`}
              >
                <Info className="size-3.5" />
                Details
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-[260px] text-xs">
                Gauge shows current {sensor.label.toLowerCase()} with ideal range and last 24h micro-trend.
              </div>
            </TooltipContent>
          </UiTooltip>
        </div>
        <div className="mt-2">
          <Sparkline data={sensor.trend} status={sensor.status} />
        </div>
      </div>
    </Card>
  );
}

function InsightCard({
  title,
  icon,
  className,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("rounded-3xl p-5", className)}>
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-2xl bg-foreground/5">
          {icon}
        </div>
        <div className="text-sm font-semibold" data-testid={`text-insight-title-${title.replace(/\s+/g, "-").toLowerCase()}`}>
          {title}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function buildTrend(base: number, variance: number) {
  const hours = Array.from({ length: 24 }).map((_, i) => {
    const jitter = (Math.sin(i / 3) + Math.cos(i / 5)) * variance * 0.35;
    const drift = (i - 12) * variance * 0.03;
    return { t: String(i), v: base + jitter + drift };
  });
  return hours;
}

function mockSensors(seed: number): Sensor[] {
  const t = 28 + Math.sin(seed / 6) * 2.2;
  const h = 62 + Math.cos(seed / 7) * 6.8;
  const m = 12.4 + Math.sin(seed / 9) * 1.2;

  const tempStatus: SensorStatus = t < 31 ? "Safe" : t < 34 ? "Warning" : "Critical";
  const humidityStatus: SensorStatus = h < 70 ? "Safe" : h < 78 ? "Warning" : "Critical";
  const moistureStatus: SensorStatus = m < 13 ? "Safe" : m < 14.5 ? "Warning" : "Critical";

  return [
    {
      id: "temp",
      label: "Temperature",
      unit: "°C",
      ideal: "24–30°C",
      min: 18,
      max: 40,
      value: t,
      status: tempStatus,
      trend: buildTrend(t, 1.5),
    },
    {
      id: "humidity",
      label: "Humidity",
      unit: "%",
      ideal: "55–70%",
      min: 40,
      max: 90,
      value: h,
      status: humidityStatus,
      trend: buildTrend(h, 3.4),
    },
    {
      id: "moisture",
      label: "Moisture",
      unit: "%",
      ideal: "11.5–13%",
      min: 8,
      max: 20,
      value: m,
      status: moistureStatus,
      trend: buildTrend(m, 0.9),
    },
  ];
}

function mockReadings(seed: number): Reading[] {
  const now = new Date();
  return Array.from({ length: 18 }).map((_, i) => {
    const d = new Date(now.getTime() - i * 60 * 60 * 1000);
    const temperature = 28 + Math.sin((seed + i) / 6) * 2.2;
    const humidity = 62 + Math.cos((seed + i) / 7) * 6.8;
    const moisture = 12.4 + Math.sin((seed + i) / 9) * 1.2;
    const purity = 96.8 - (humidity - 62) * 0.04 - (moisture - 12.4) * 0.12 + Math.sin(i / 4) * 0.2;
    const price = 2430 + (purity - 96) * 24 + Math.cos(i / 3) * 18;
    const shelfLifeMonths = 9.5 - (moisture - 12.4) * 0.9 - (humidity - 62) * 0.07 + Math.sin(i / 5) * 0.25;

    return {
      ts: d.toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
      temperature: Number(temperature.toFixed(1)),
      humidity: Number(humidity.toFixed(1)),
      moisture: Number(moisture.toFixed(1)),
      purity: Number(purity.toFixed(1)),
      price: Math.round(price),
      shelfLifeMonths: Number(shelfLifeMonths.toFixed(1)),
    };
  });
}

export default function RealTimeAnalysisPage() {
  const [filter, setFilter] = useState<"today" | "week" | "month">("today");
  const { data: latestReport, isLoading, connected } = useGrainData();
  const [readings, setReadings] = useState<Reading[]>(mockReadings(1));
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      await apiService.downloadReportPdf(latestReport?._id || latestReport?.reportId || 'latest');
      toast.success("Grain Analysis PDF Exported!");
    } catch (err) {
      toast.error("Failed to generate PDF");
    } finally {
      setIsExporting(false);
    }
  };

  // Update readings history when latestReport changes
  useMemo(() => {
    if (latestReport) {
      const newReading: Reading = {
        ts: new Date().toLocaleTimeString(),
        temperature: latestReport.sensorSnapshot?.temperature ?? 0,
        humidity: latestReport.sensorSnapshot?.humidity ?? 0,
        moisture: latestReport.sensorSnapshot?.moisture ?? 0,
        purity: latestReport.purity ?? 0,
        price: latestReport.aiOutputs?.price?.value ?? 0,
        shelfLifeMonths: latestReport.aiOutputs?.shelfLife?.value
          ? Math.round((latestReport.aiOutputs.shelfLife.value / 30) * 10) / 10
          : 0,
      };

      setReadings(prev => {
        // Avoid duplicate readings with same timestamp if re-rendering
        if (prev.length > 0 && prev[0].ts === newReading.ts) return prev;
        return [newReading, ...prev].slice(0, 20);
      });
    }
  }, [latestReport]);

  // Compute sensors from latestReport
  const sensors = useMemo(() => {
    const temperature = latestReport?.sensorSnapshot?.temperature ?? 28.1;
    const humidity = latestReport?.sensorSnapshot?.humidity ?? 62.1;
    const moisture = latestReport?.sensorSnapshot?.moisture ?? 12.4;

    return [
      {
        id: "temp" as const,
        label: "Temperature",
        unit: "°C",
        ideal: "24–30°C",
        min: 18,
        max: 40,
        value: temperature,
        status: temperature < 31 ? "Safe" : temperature < 34 ? "Warning" : "Critical" as SensorStatus,
        trend: buildTrend(temperature, 1.5),
      },
      {
        id: "humidity" as const,
        label: "Humidity",
        unit: "%",
        ideal: "55–70%",
        min: 40,
        max: 90,
        value: humidity,
        status: humidity < 70 ? "Safe" : humidity < 78 ? "Warning" : "Critical" as SensorStatus,
        trend: buildTrend(humidity, 3.4),
      },
      {
        id: "moisture" as const,
        label: "Moisture",
        unit: "%",
        ideal: "11.5–13%",
        min: 8,
        max: 20,
        value: moisture,
        status: moisture < 13 ? "Safe" : moisture < 14.5 ? "Warning" : "Critical" as SensorStatus,
        trend: buildTrend(moisture, 0.9),
      }
    ];
  }, [latestReport]);

  const market = useMemo(() => {
    if (latestReport?.aiOutputs?.price) {
      const priceData = latestReport.aiOutputs.price;
      const decision = priceData.decision || "N/A";
      const action = decision.toUpperCase().includes("HOLD")
        ? "HOLD"
        : decision.toUpperCase().includes("SELL")
          ? "SELL"
          : null;
      return {
        purity: latestReport.purity ?? 0,
        confidence: 88,
        est: priceData.value ?? 0,
        up: decision.toUpperCase().includes("HOLD"),
        rec: decision,
        action,
        marketName: priceData.market || "Local Mandi",
        marketDate: priceData.date || "",
      };
    }
    return { purity: 0, confidence: 0, est: 0, up: false, rec: "Waiting for data...", action: null, marketName: "", marketDate: "" };
  }, [latestReport]);

  const shelf = useMemo(() => {
    if (latestReport?.aiOutputs?.shelfLife) {
      const sl = latestReport.aiOutputs.shelfLife;
      const days = sl.value ?? 0;
      const months = Math.round((days / 30) * 10) / 10;
      const risk = days > 300 ? 15 : days > 120 ? 45 : 80;
      const status = days > 300 ? "Safe Storage" : days > 120 ? "Monitor" : "At Risk";
      const summary = sl.paragraph || sl.risk || `Estimated ${days} days shelf life`;
      return { months, risk, status, summary };
    }
    return { months: 0, risk: 0, status: "Waiting for data...", summary: "No AI report yet" };
  }, [latestReport]);

  return (
    <div className="space-y-12" id="real-time-analysis-content">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-foreground/5">
              <ShieldCheck className="size-4.5 text-primary" strokeWidth={2.2} />
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-[-0.02em]" data-testid="text-page-title">
              Real-Time Analysis
            </h1>
            {latestReport?.reportId && (
              <Badge variant="outline" className="ml-2 rounded-full border-primary/20 bg-primary/5 text-primary">
                {latestReport.reportId}
              </Badge>
            )}
          </div>
          <p className="mt-2 max-w-2xl text-balance text-sm text-muted-foreground" data-testid="text-page-description">
            Monitor storage conditions, validate safety, and get AI-backed market guidance in one glance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full" data-testid="badge-live-status">
            <span
              className={cn(
                "mr-1 inline-flex size-1.5 animate-pulse rounded-full",
                connected ? "bg-emerald-500" : "bg-amber-500",
              )}
              aria-hidden
            />
            {connected ? "Live" : "Simulated"}
          </Badge>
          <Button
            variant="outline"
            className="rounded-2xl"
            data-testid="button-export-pdf"
            onClick={handleDownloadPDF}
            disabled={isExporting}
          >
            <Download className="mr-2 size-4" />
            {isExporting ? "Generating PDF..." : "Download PDF"}
          </Button>
        </div>
      </header>

      <div>
        <div className="mb-4 ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
          Sensor Snapshot
        </div>
        <motion.section
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          initial="hidden"
          animate="show"
        >
          {sensors.map((s) => (
            <motion.div key={s.id} variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}>
              <SensorGaugeCard sensor={s} />
            </motion.div>
          ))}
        </motion.section>
      </div>

      <div>
        <div className="mb-4 ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
          AI-Driven Predictions
        </div>
        <motion.section
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <InsightCard title="Market Price Prediction" className="glass-amber" icon={<Bot className="size-4.5 text-sky-600" strokeWidth={2.2} />}>
            {isLoading ? (
              <div className="space-y-4">
                <AiLoading lines={5} />
                <div className="ai-loading-shimmer h-8 w-32 rounded-full" />
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground" data-testid="text-market-label">Estimated price</div>
                    <div className="mt-1 font-display text-4xl font-semibold tracking-[-0.03em]" data-testid="text-market-price">
                      <RollingNumber value={market.est} prefix="₹" />
                      <span className="ml-2 text-sm font-medium text-muted-foreground">/ quintal</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant="secondary" className="rounded-full" data-testid="badge-market-rec">{market.rec}</Badge>
                      {market.action && (
                        <Badge className="rounded-full bg-primary/10 text-primary" data-testid="badge-market-action">
                          Action: {market.action}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground" data-testid="text-market-purity">Purity used: {market.purity.toFixed(1)}%</span>
                      <span className="text-xs text-muted-foreground" data-testid="text-market-confidence">Confidence: {market.confidence}%</span>
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-center gap-1 rounded-2xl px-3 py-2 text-sm font-semibold",
                    market.up ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/10 text-rose-700 dark:text-rose-300",
                  )} data-testid="status-market-trend">
                    {market.up ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                    {market.up ? "Uptrend" : "Downtrend"}
                  </div>
                </div>

                {(market.marketName || market.marketDate) && (
                  <div className="mt-4 flex items-center gap-4 rounded-2xl border bg-background/50 p-3 italic text-muted-foreground transition-all hover:bg-background/80">
                    <div className="flex flex-col gap-0.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Data Source (Mandi)</div>
                      <div className="text-xs font-medium text-foreground/80">{market.marketName}</div>
                    </div>
                    {market.marketDate && (
                      <div className="ml-auto flex flex-col items-end gap-0.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Mandi Date</div>
                        <div className="text-xs font-medium text-foreground/80">{market.marketDate}</div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </InsightCard>

          <InsightCard title="Shelf-Life Prediction" className="glass-rose" icon={<TriangleAlert className="size-4.5 text-amber-600" strokeWidth={2.2} />}>
            {isLoading ? (
              <div className="space-y-4">
                <AiLoading lines={5} />
                <div className="ai-loading-shimmer h-9 w-40 rounded-full" />
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground" data-testid="text-shelf-label">Months remaining</div>
                    <div className="mt-1 font-display text-4xl font-semibold tracking-[-0.03em]" data-testid="text-shelf-months">
                      <RollingNumber value={shelf.months} precision={1} />
                      <span className="ml-2 text-sm font-medium text-muted-foreground">months</span>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground" data-testid="text-shelf-summary">
                      {shelf.summary}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Badge
                        className={cn(
                          "rounded-full",
                          shelf.risk < 35
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : shelf.risk < 60
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                              : "bg-rose-500/10 text-rose-700 dark:text-rose-300",
                        )}
                        data-testid="badge-shelf-status"
                      >
                        {shelf.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground" data-testid="text-shelf-risk">Risk meter: {shelf.risk}/100</span>
                    </div>
                  </div>

                  <div className="w-44">
                    <div className="text-xs text-muted-foreground">Risk</div>
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-foreground/10">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          shelf.risk < 35
                            ? "bg-emerald-500"
                            : shelf.risk < 60
                              ? "bg-amber-500"
                              : "bg-rose-500",
                        )}
                        style={{ width: `${shelf.risk}%` }}
                        data-testid="progress-shelf-risk"
                      />
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button className="rounded-2xl" data-testid="button-shelf-action">
                        {shelf.status}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </InsightCard>
        </motion.section>
      </div>
    </div>
  );
}
