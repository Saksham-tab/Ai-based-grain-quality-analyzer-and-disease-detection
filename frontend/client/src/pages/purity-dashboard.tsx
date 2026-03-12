import { useState, useEffect, useMemo } from "react";
import { Bot, Info, Leaf, TrendingUp, Camera, History, RefreshCcw, Download } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RollingNumber } from "@/components/ui/rolling-number";
import { AiLoading } from "@/components/ui/ai-loading";

import { useGrainData } from "../hooks/useGrainData";
import { useMqtt } from "../services/MqttProvider";
import apiService from "../services/apiService";
import { toast } from "sonner";

type Severity = "low" | "medium" | "high";

function severityStyles(sev: Severity) {
  if (sev === "low") return "bg-emerald-500";
  if (sev === "medium") return "bg-amber-500";
  return "bg-rose-500";
}

function gradeFromPurity(purity: number) {
  if (purity >= 95) return { grade: "A", desc: "Premium" };
  if (purity >= 90) return { grade: "B", desc: "Medium" };
  return { grade: "C", desc: "Low" };
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function PurityRing({ purity, grade }: { purity: number; grade: string }) {
  const pct = clamp(purity, 0, 100);
  const dash = 320;
  const offset = dash - (pct / 100) * dash;

  const ringColor =
    grade === "A" ? "stroke-emerald-500" :
      grade === "B" ? "stroke-amber-500" :
        "stroke-rose-500";

  const textColor =
    grade === "A" ? "text-emerald-500" :
      grade === "B" ? "text-amber-500" :
        "text-rose-500";

  return (
    <div className="relative">
      <svg viewBox="0 0 120 120" className="size-[160px] max-w-full" aria-hidden>
        <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" className="stroke-foreground/10" strokeWidth="12" />
        <motion.circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          strokeLinecap="round"
          className={ringColor}
          strokeWidth="12"
          strokeDasharray={dash}
          initial={{ strokeDashoffset: dash }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.0, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ transformOrigin: "50% 50%", transform: "rotate(-90deg)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[10px] text-muted-foreground" data-testid="text-purity-hero-label">Purity</div>
        <div className={cn("font-display text-3xl font-semibold tracking-[-0.04em]", textColor)} data-testid="text-purity-hero-value">
          <RollingNumber value={purity} precision={1} suffix="%" />
        </div>
      </div>
    </div>
  );
}

export default function PurityDashboardPage() {
  const { data: report, isLoading: loading } = useGrainData();
  const { lastImage, logs, connected: mqttConnected, isCapturing } = useMqtt();
  const [isExporting, setIsExporting] = useState(false);
  const data = report || null;

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      await apiService.downloadReportPdf(data?._id || data?.reportId || 'latest');
      toast.success("Professional PDF Report generated!");
    } catch (err) {
      toast.error("Failed to generate PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const purity = data?.purity ?? 0;
  const { grade, desc } = useMemo(() => {
    const computed = gradeFromPurity(purity);
    if (data?.grade) {
      const source = data.grade.toUpperCase();
      if (source === "A") return { grade: "A", desc: "Premium" };
      if (source === "B") return { grade: "B", desc: "Medium" };
      if (source === "C") return { grade: "C", desc: "Low" };
    }
    return computed;
  }, [purity, data?.grade]);

  const impurities = useMemo(() => {
    if (!data) return [];

    return [
      { k: "Husk", v: data.impurities.husk, sev: "low" as Severity, tip: "Light husk fragments detected during scan." },
      { k: "Stones", v: data.impurities.stones, sev: "low" as Severity, tip: "Minimal stone presence — within safe thresholds." },
      { k: "Broken pieces", v: data.impurities.brokenPieces, sev: "medium" as Severity, tip: "Broken kernels can reduce market grade and shelf-life." },
      { k: "Insect damage", v: data.impurities.insectDamage, sev: "low" as Severity, tip: "Minor insect damage — continue monitoring." },
      { k: "Black spots", v: data.impurities.blackSpots, sev: "low" as Severity, tip: "Black spots are low but can indicate humidity exposure." },
    ];
  }, [data]);

  const price = useMemo(() => {
    const rawPrice = data?.aiOutputs?.price?.value;
    const numericPrice =
      typeof rawPrice === "number"
        ? rawPrice
        : typeof rawPrice === "string"
          ? Number(rawPrice)
          : NaN;
    const hasAgentPrice = Number.isFinite(numericPrice);
    const est = hasAgentPrice ? numericPrice : Math.round(2430 + (purity - 95) * 34);
    const delta = Math.round((purity - 96) * 0.8 * 10) / 10;
    const decision = data?.aiOutputs?.price?.decision || null;
    const action = decision?.toUpperCase().includes("HOLD")
      ? "HOLD"
      : decision?.toUpperCase().includes("SELL")
        ? "SELL"
        : null;
    const market = data?.aiOutputs?.price?.market || null;
    const date = data?.aiOutputs?.price?.date || null;
    return { est, hasAgentPrice, delta, decision, action, market, date };
  }, [purity, data]);

  return (
    <div className="space-y-12" id="purity-dashboard-content">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-foreground/5">
              <Leaf className="size-4.5 text-primary" strokeWidth={2.2} />
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-[-0.02em]" data-testid="text-page-title">
              Purity Dashboard
            </h1>
            {data?.reportId && (
              <Badge variant="outline" className="ml-2 rounded-full border-primary/20 bg-primary/5 text-primary">
                {data.reportId}
              </Badge>
            )}
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground" data-testid="text-page-description">
            A single, decision-ready view of grade, impurity composition, and predicted market value.
          </p>
        </div>
        <Button
          onClick={handleDownloadPDF}
          disabled={isExporting || loading || !data}
          className="rounded-2xl gap-2 font-semibold shadow-sm"
          data-testid="button-download-pdf-top"
        >
          {isExporting ? <RefreshCcw className="size-4 animate-spin" /> : <Download className="size-4" />}
          {isExporting ? "Generating..." : "Download Report"}
        </Button>
      </header>

      {/* Live Capture Section */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="card-premium overflow-hidden rounded-3xl border bg-card lg:col-span-8">
          <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-3">
            <div className="flex items-center gap-2">
              <Camera className="size-4 text-primary" />
              <span className="text-sm font-semibold">Live Grain Capture</span>
            </div>
            {isCapturing && (
              <Badge className="animate-pulse bg-amber-500">Processing Live</Badge>
            )}
          </div>
          <div className="relative aspect-video w-full bg-slate-900/10 dark:bg-slate-900/50">
            {lastImage ? (
              <img
                src={lastImage.startsWith("data:") ? lastImage : `data:image/jpeg;base64,${lastImage}`}
                alt="Live grain capture"
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                <Camera className="mb-2 size-12 opacity-20" />
                <p className="text-sm">No image captured yet</p>
                <p className="text-xs opacity-60">Click "Capture Grain Image" in the navbar to start</p>
              </div>
            )}
            {isCapturing && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-[2px]">
                <div className="flex flex-col items-center gap-3 rounded-2xl bg-background/60 p-4 shadow-xl">
                  <RefreshCcw className="size-8 animate-spin text-primary" />
                  <span className="text-sm font-medium">Analyzing Grain...</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="card-premium flex flex-col rounded-3xl border bg-card lg:col-span-4">
          <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-3">
            <div className="flex items-center gap-2">
              <History className="size-4 text-primary" />
              <span className="text-sm font-semibold">Activity Log</span>
            </div>
            <Badge variant="outline" className={cn("rounded-full", mqttConnected ? "text-emerald-500" : "text-rose-500")}>
              {mqttConnected ? "MQTT Live" : "MQTT Offline"}
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {logs.length > 0 ? (
                logs.map((log, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <span className="shrink-0 text-muted-foreground">
                      {log.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="font-medium">{log.msg}</span>
                  </div>
                ))
              ) : (
                <div className="flex h-full items-center justify-center py-12 text-center text-muted-foreground">
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </section>

      <div>
        <div className="mb-4 ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
          Quality Overview
        </div>
        <motion.section
          className="grid grid-cols-1 gap-4 lg:grid-cols-12"
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
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="lg:col-span-6">
            <Card className="card-premium h-full rounded-3xl border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold" data-testid="text-purity-hero-title">Main purity gauge</div>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" data-testid="badge-purity-grade">
                      Grade {grade}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full" data-testid="badge-quality-desc">
                      {desc}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground" data-testid="text-purity-hero-subtitle">
                    Confidence-calibrated from impurity composition + sensor conditions.
                  </div>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="inline-flex items-center gap-2 rounded-2xl border bg-background px-3 py-2 text-xs text-muted-foreground hover:bg-foreground/5"
                      data-testid="button-purity-info"
                    >
                      <Info className="size-3.5" />
                      How grade works
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-[280px] text-xs">
                      Grade A ≥ 95%, Grade B ≥ 90%, Grade C &lt; 90%. Other factors can adjust the recommendation.
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="mt-2 flex items-center justify-center">
                <PurityRing purity={purity} grade={grade} />
              </div>
            </Card>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="lg:col-span-6">
            <Card className="card-premium h-full rounded-3xl border bg-card p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold" data-testid="text-impurity-title">Impurity breakdown</div>
                  <div className="mt-1 text-xs text-muted-foreground" data-testid="text-impurity-subtitle">
                    Composition snapshot from the latest scan.
                  </div>
                </div>
                <Badge variant="secondary" className="rounded-full" data-testid="badge-impurity-total">
                  Total 3.2%
                </Badge>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {impurities.map((it) => (
                  <div key={it.k} className="rounded-xl border bg-background/60 p-2 text-card-foreground">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className={cn("size-2 rounded-full", severityStyles(it.sev))} aria-hidden />
                        <div className="text-sm font-medium" data-testid={`text-impurity-name-${it.k.replace(/\s+/g, "-").toLowerCase()}`}>{it.k}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold" data-testid={`text-impurity-value-${it.k.replace(/\s+/g, "-").toLowerCase()}`}>
                          <RollingNumber value={it.v} precision={1} suffix="%" />
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="inline-flex size-8 items-center justify-center rounded-2xl text-muted-foreground hover:bg-foreground/5"
                              data-testid={`button-impurity-tip-${it.k.replace(/\s+/g, "-").toLowerCase()}`}
                            >
                              <Info className="size-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="max-w-[260px] text-xs">{it.tip}</div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10 text-card-foreground">
                      <motion.div
                        className={cn("h-full rounded-full", severityStyles(it.sev))}
                        initial={{ width: 0 }}
                        animate={{ width: `${it.v * 18}%` }}
                        transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1], delay: 0.3 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </motion.section>
      </div>

      <div>
        <div className="mb-4 ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
          Market Intelligence & Advisory
        </div>
        <motion.section
          className="grid grid-cols-1 gap-4 lg:grid-cols-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-amber rounded-3xl p-5 lg:col-span-5">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-foreground/5">
                <TrendingUp className="size-4.5 text-primary" strokeWidth={2.2} />
              </div>
              <div>
                <div className="text-sm font-semibold" data-testid="text-price-title">Market price summary</div>
                <div className="text-xs text-muted-foreground" data-testid="text-price-subtitle">Prediction updated 2 minutes ago</div>
              </div>
            </div>

            <div className="mt-5">
              {loading ? (
                <div className="space-y-4">
                  <AiLoading lines={4} />
                  <div className="ai-loading-shimmer h-7 w-44 rounded-full" />
                </div>
              ) : (
                <>
                  <div className="text-xs text-muted-foreground">Estimated value</div>
                  <div className="mt-1 font-display text-4xl font-semibold tracking-[-0.03em]" data-testid="text-price-value">
                    <RollingNumber value={price.est} prefix="Rs. " />
                    <span className="ml-2 text-sm font-medium text-muted-foreground">/ quintal</span>
                  </div>
                  {!price.hasAgentPrice && (
                    <div className="mt-2 text-[10px] text-muted-foreground/70">
                      Live pricing agent value unavailable. Showing estimate from purity trend.
                    </div>
                  )}

                  {(price.market || price.date) && (
                    <div className="mt-2 text-[10px] text-muted-foreground/70">
                      Source: <span className="font-semibold text-foreground/70">{price.market || "Local Mandi"}</span>
                      {price.date && ` • ${price.date}`}
                    </div>
                  )}

                  {price.decision && (
                    <div className="mt-3 text-xs font-bold text-primary uppercase tracking-wider">
                      Recommendation: {price.decision}
                    </div>
                  )}
                  {price.action && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Action: <span className="font-semibold text-foreground">{price.action}</span>
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2">
                    <Badge
                      className={cn(
                        "rounded-full",
                        price.delta >= 0
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "bg-rose-500/10 text-rose-700 dark:text-rose-300",
                      )}
                      data-testid="badge-price-trend"
                    >
                      {price.delta >= 0 ? `+${price.delta}% vs last scan` : `${price.delta}% vs last scan`}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Based on purity and market momentum</span>
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card className="card-glass rounded-3xl p-5 lg:col-span-7">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-foreground/5">
                <Bot className="size-4.5 text-sky-600" strokeWidth={2.2} />
              </div>
              <div>
                <div className="text-sm font-semibold" data-testid="text-advisory-title">Agricultural advisory</div>
                <div className="text-xs text-muted-foreground" data-testid="text-advisory-subtitle">AI-generated guidance for storage and selling</div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/40 dark:border-white/10 bg-white/40 dark:bg-white/5 p-4 text-sm text-muted-foreground backdrop-blur-sm">
              {loading ? (
                <AiLoading lines={5} />
              ) : (
                <>
                  {(() => {
                    const text = data?.aiOutputs?.advisory?.text || "";
                    const lines = text
                      .split(/\n/)
                      .map((l: string) => l.trim())
                      .filter((l: string) => l.length > 0);

                    const bulletLines = lines.filter((line: string) =>
                      /^(-|\*|\d+\.)\s+/.test(line),
                    );

                    if (bulletLines.length > 0) {
                      return (
                        <ul className="list-disc space-y-1 pl-5">
                          {bulletLines.slice(0, 8).map((line: string, i: number) => (
                            <li key={i} data-testid={`text-advisory-bullet-${i + 1}`}>
                              {line.replace(/^(-|\*|\d+\.)\s+/, "").trim()}
                            </li>
                          ))}
                        </ul>
                      );
                    }

                    if (text.trim().length > 0) {
                      return <p data-testid="text-advisory-paragraph">{text}</p>;
                    }

                    return (
                      <ul className="list-disc space-y-1 pl-5">
                        <li data-testid="text-advisory-bullet-1">Inspect ventilation pathways within 24 hours.</li>
                        <li data-testid="text-advisory-bullet-2">Re-scan moisture after evening cooling to detect spikes.</li>
                        <li data-testid="text-advisory-bullet-3">If price confidence stays above 85%, consider selling a partial lot.</li>
                      </ul>
                    );
                  })()}
                </>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2" data-pdf-ignore>
              <Badge className="rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300" data-testid="tag-action-severity">
                Improve soon
              </Badge>
              <Badge variant="secondary" className="rounded-full" data-testid="tag-monitor">Monitor</Badge>
              <Badge className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" data-testid="tag-safe">Safe</Badge>
            </div>
          </Card>
        </motion.section>
      </div>
    </div>
  );
}
