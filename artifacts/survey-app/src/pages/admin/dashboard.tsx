import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGetAdminStats } from "@workspace/api-client-react";
import AdminLayout from "@/components/admin-layout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const TEAL = "hsl(172,66%,30%)";
const SKY  = "hsl(199,89%,48%)";
const AMBER = "hsl(43,74%,55%)";
const ROSE  = "hsl(340,60%,50%)";
const VIOLET = "hsl(280,60%,55%)";
const GREEN = "hsl(150,55%,42%)";
const SLATE = "hsl(215,20%,60%)";

const PIE_COLORS = [TEAL, SKY, AMBER, ROSE, VIOLET, GREEN, SLATE];

// ── small helpers ─────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color: accent ?? "hsl(var(--foreground))" }}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="h-5 w-1 rounded-full bg-primary" />
      <h2 className="text-base font-semibold text-foreground">{children}</h2>
    </div>
  );
}

function ChartCard({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <p className="font-medium text-foreground text-sm mb-1">{title}</p>
      {hint && <p className="text-xs text-muted-foreground mb-4">{hint}</p>}
      {children}
    </div>
  );
}

function NoData() {
  return <p className="text-muted-foreground text-sm text-center py-8">داده‌ای موجود نیست</p>;
}

// ── custom tooltip (RTL-friendly) ─────────────────────────────────────────────
function FaTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      {label && <p className="font-medium mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i}>{p.name ? `${p.name}: ` : ""}<span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
}

// ── main dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading, error } = useGetAdminStats();

  useEffect(() => {
    if (error && (error as { status?: number }).status === 401) {
      setLocation("/admin/login");
    }
  }, [error]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const sa = (stats as unknown as Record<string, unknown>)?.scoreAverages as Record<string, number | null> | undefined;
  const q3Dist = (stats as unknown as Record<string, unknown>)?.q3Distribution as { label: string; count: number }[] | undefined;
  const hasScores = sa !== undefined && sa !== null;

  const handleExport = () => {
    fetch("/api/admin/export", { credentials: "include" })
      .then((r) => r.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `survey-export-${Date.now()}.csv`;
        link.click();
      });
  };

  // ── chart data ───────────────────────────────────────────────────────────────

  // Q5 Mental toughness radar
  const q5RadarData = hasScores ? [
    { axis: "اطمینان", value: sa.q5Confidence ?? 0, max: 40 },
    { axis: "پایداری",  value: sa.q5Constancy  ?? 0, max: 40 },
    { axis: "کنترل",   value: sa.q5Control    ?? 0, max: 32 },
  ] : [];

  // Q6 Mood bar chart (8 dimensions)
  const q6MoodData = hasScores ? [
    { name: "سرزندگی",      value: sa.q6Vigour     ?? 0, fill: GREEN },
    { name: "خوشحالی",     value: sa.q6Happiness  ?? 0, fill: SKY   },
    { name: "آرامش",        value: sa.q6Calmness   ?? 0, fill: TEAL  },
    { name: "خستگی",        value: sa.q6Fatigue    ?? 0, fill: AMBER },
    { name: "تنش",          value: sa.q6Tension    ?? 0, fill: ROSE  },
    { name: "خشم",          value: sa.q6Anger      ?? 0, fill: ROSE  },
    { name: "افسردگی",      value: sa.q6Depression ?? 0, fill: VIOLET},
    { name: "سردرگمی",     value: sa.q6Confusion  ?? 0, fill: SLATE },
  ] : [];

  // Q7 Motivation bar chart (8 dimensions)
  const q7MotivationData = hasScores ? [
    { name: "موفقیت",        value: sa.q7Achievement   ?? 0 },
    { name: "دوستی",         value: sa.q7Friendship    ?? 0 },
    { name: "مهارت",          value: sa.q7Skill         ?? 0 },
    { name: "تندرستی",       value: sa.q7Fitness        ?? 0 },
    { name: "تخلیه انرژی",  value: sa.q7EnergyRelease  ?? 0 },
    { name: "تفریح",          value: sa.q7Fun           ?? 0 },
    { name: "تعلق به تیم",   value: sa.q7Team          ?? 0 },
    { name: "عوامل موقعیتی", value: sa.q7Situational   ?? 0 },
  ] : [];

  // Q1 sub-scale comparison
  const q1Data = hasScores ? [
    { name: "پرخاشگری", value: sa.q1Aggression      ?? 0, fill: ROSE  },
    { name: "خشم رقابتی", value: sa.q1CompetitiveAnger ?? 0, fill: AMBER },
  ] : [];

  // Overview key scores bar
  const keyScoresData = hasScores ? [
    { name: "پرخاشگری (Q1)", value: sa.q1Total  ?? 0, max: 48,  fill: ROSE    },
    { name: "فرسودگی (Q2)",  value: sa.q2Total  ?? 0, max: 36,  fill: VIOLET  },
    { name: "اعتیاد (Q3)",   value: sa.q3Total  ?? 0, max: 24,  fill: AMBER   },
    { name: "اضطراب (Q4)",   value: sa.q4Total  ?? 0, max: 30,  fill: SKY     },
    { name: "ذهنی (Q5)",     value: sa.q5Total  ?? 0, max: 112, fill: TEAL    },
  ] : [];

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-10">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">داشبورد پژوهش</h1>
            <p className="text-muted-foreground text-sm mt-1">بررسی عوامل روانشناختی ورزشکاران مازندرانی</p>
          </div>
          <button
            onClick={handleExport}
            data-testid="button-export"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
            خروجی CSV
          </button>
        </div>

        {/* ── کارت‌های آماری ─────────────────────────────────────────────── */}
        <section>
          <SectionTitle>آمار کلی</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <StatCard label="کل شرکت‌کنندگان"  value={stats?.totalSubmissions ?? 0} accent={TEAL} />
            <StatCard label="این هفته"          value={stats?.totalThisWeek ?? 0} />
            <StatCard label="این ماه"           value={stats?.totalThisMonth ?? 0} />
            <StatCard label="میانگین سن"        value={stats ? `${stats.avgAge.toFixed(1)} سال` : "—"} />
            <StatCard label="میانگین سابقه"     value={stats ? `${stats.avgYearsExperience.toFixed(1)} سال` : "—"} sub="سابقه ورزشی" />
            <StatCard label="نرخ آسیب‌دیدگی"   value={stats ? `${(stats.injuryRate * 100).toFixed(0)}٪` : "—"} accent={ROSE} />
            <StatCard label="نرخ تیم ملی"       value={stats ? `${(stats.nationalTeamRate * 100).toFixed(0)}٪` : "—"} accent={SKY} />
          </div>
        </section>

        {/* ── امتیازات میانگین روانشناختی ──────────────────────────────── */}
        {hasScores && (
          <section>
            <SectionTitle>میانگین امتیازات روانشناختی — همه شرکت‌کنندگان</SectionTitle>

            {/* Row 1: key scores overview + Q3 pie */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

              <ChartCard
                title="مقایسه میانگین امتیازات کلی پرسشنامه‌ها"
                hint="میانگین نمره کل هر پرسشنامه در بین همه شرکت‌کنندگان"
              >
                {keyScoresData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={keyScoresData} layout="vertical" margin={{ right: 32, left: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(160,20%,90%)" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontFamily: "Vazirmatn" }} width={110} />
                      <Tooltip content={<FaTooltip />} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {keyScoresData.map((d, i) => (
                          <Cell key={i} fill={d.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <NoData />}
              </ChartCard>

              <ChartCard
                title="توزیع سطح اعتیاد به تمرین (Q3)"
                hint="درصد ورزشکاران در هر دسته از نظر اعتیاد به تمرین"
              >
                {q3Dist && q3Dist.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={q3Dist}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ label, percent }) => `${label} (${(percent * 100).toFixed(0)}٪)`}
                        labelLine
                      >
                        {q3Dist.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v} نفر`, "تعداد"]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <NoData />}
              </ChartCard>

            </div>

            {/* Row 2: Q5 Radar + Q1 sub-scales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

              <ChartCard
                title="سرسختی ذهنی — میانگین زیرمقیاس‌ها (Q5)"
                hint="میانگین امتیاز هر بُعد سرسختی ذهنی در بین شرکت‌کنندگان"
              >
                {q5RadarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <RadarChart data={q5RadarData} cx="50%" cy="50%" outerRadius={85}>
                      <PolarGrid stroke="hsl(160,20%,88%)" />
                      <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12, fontFamily: "Vazirmatn" }} />
                      <Radar name="میانگین" dataKey="value" stroke={TEAL} fill={TEAL} fillOpacity={0.25} />
                      <Tooltip content={<FaTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : <NoData />}
              </ChartCard>

              <ChartCard
                title="زیرمقیاس‌های پرخاشگری (Q1)"
                hint="مقایسه میانگین پرخاشگری عمومی و خشم رقابتی"
              >
                {q1Data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={q1Data} margin={{ top: 20, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(160,20%,90%)" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: "Vazirmatn" }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<FaTooltip />} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {q1Data.map((d, i) => (
                          <Cell key={i} fill={d.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <NoData />}
              </ChartCard>

            </div>

            {/* Row 3: Q7 Motivation full bar */}
            <ChartCard
              title="میانگین ابعاد انگیزه مشارکت (Q7)"
              hint="مقایسه انگیزه‌های مختلف مشارکت در ورزش — امتیاز بالاتر = انگیزه قوی‌تر"
            >
              {q7MotivationData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={q7MotivationData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(160,20%,90%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "Vazirmatn" }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<FaTooltip />} />
                    <Bar dataKey="value" fill={SKY} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <NoData />}
            </ChartCard>

            {/* Row 4: Q6 Mood sub-scales */}
            <div className="mt-6">
              <ChartCard
                title="میانگین حالات خلقی (Q6)"
                hint="میانگین ۸ بُعد خلقی — سبز/آبی = خلق مثبت | قرمز/بنفش = خلق منفی"
              >
                {q6MoodData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={q6MoodData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(160,20%,90%)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "Vazirmatn" }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<FaTooltip />} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {q6MoodData.map((d, i) => (
                          <Cell key={i} fill={d.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <NoData />}
              </ChartCard>
            </div>

            {/* Mood summary cards */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <StatCard
                label="میانگین خلق مثبت (Q6)"
                value={sa.q6Positive !== null ? sa.q6Positive! : "—"}
                sub="حداکثر نمره ممکن: ۳۲"
                accent={GREEN}
              />
              <StatCard
                label="میانگین خلق منفی (Q6)"
                value={sa.q6Negative !== null ? sa.q6Negative! : "—"}
                sub="حداکثر نمره ممکن: ۴۸"
                accent={ROSE}
              />
            </div>
          </section>
        )}

        {/* ── توزیع دموگرافیک ───────────────────────────────────────────── */}
        <section>
          <SectionTitle>توزیع دموگرافیک</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <ChartCard title="توزیع رشته‌های ورزشی">
              {stats?.sportBreakdown && stats.sportBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.sportBreakdown.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(160,20%,90%)" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fontFamily: "Vazirmatn" }} width={90} />
                    <Tooltip content={<FaTooltip />} />
                    <Bar dataKey="count" fill={TEAL} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <NoData />}
            </ChartCard>

            <ChartCard title="توزیع شهرها">
              {stats?.cityBreakdown && stats.cityBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.cityBreakdown.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(160,20%,90%)" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fontFamily: "Vazirmatn" }} width={90} />
                    <Tooltip content={<FaTooltip />} />
                    <Bar dataKey="count" fill={SKY} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <NoData />}
            </ChartCard>

            <ChartCard title="رده‌های سنی">
              {stats?.ageGroupBreakdown && stats.ageGroupBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={stats.ageGroupBreakdown}
                      cx="50%" cy="50%" outerRadius={80}
                      dataKey="count" nameKey="label"
                      label={({ label, percent }) => `${label} (${(percent * 100).toFixed(0)}٪)`}
                      labelLine
                    >
                      {stats.ageGroupBreakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} نفر`, "تعداد"]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <NoData />}
            </ChartCard>

            <ChartCard title="وضعیت تأهل">
              {stats?.maritalStatusBreakdown && stats.maritalStatusBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={stats.maritalStatusBreakdown}
                      cx="50%" cy="50%" outerRadius={80}
                      dataKey="count" nameKey="label"
                      label={({ label, percent }) => `${label} (${(percent * 100).toFixed(0)}٪)`}
                      labelLine
                    >
                      {stats.maritalStatusBreakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} نفر`, "تعداد"]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <NoData />}
            </ChartCard>

          </div>
        </section>

      </div>
    </AdminLayout>
  );
}
