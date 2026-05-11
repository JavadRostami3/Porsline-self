import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Scores {
  q1: { aggression: number; competitiveAnger: number; total: number };
  q2: { emotionalExhaustion: number; total: number };
  q3: {
    importance: number;
    psychologicalConsequences: number;
    total: number;
    interpretation: string;
    interpretationLevel: "none" | "symptomatic" | "addicted";
  };
  q4: { total: number };
  q5: { confidence: number; constancy: number; control: number; total: number };
  q6: {
    tension: number; depression: number; anger: number; vigour: number;
    fatigue: number; confusion: number; calmness: number; happiness: number;
    positiveMood: number; negativeMood: number;
  };
  q7: {
    achievement: number; teamAffiliation: number; fitness: number;
    energyRelease: number; situationalFactors: number; skillDevelopment: number;
    friendship: number; fun: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TEAL = "hsl(172 66% 30%)";
const TEAL_LIGHT = "hsl(172 50% 55%)";
const AMBER = "hsl(38 92% 50%)";
const ROSE  = "hsl(346 77% 52%)";

function ScoreCard({ label, value, max, note }: { label: string; value: number; max: number; note?: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="bg-muted/40 rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold text-primary" dir="ltr">{value}</p>
      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      {note && <p className="text-[11px] text-muted-foreground mt-1">{note}</p>}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 mb-4">
      <h2 className="text-base font-bold text-foreground mb-4 pb-2 border-b border-border">{title}</h2>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Results() {
  const [, setLocation] = useLocation();
  const [scores, setScores] = useState<Scores | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("survey_scores");
    const n   = sessionStorage.getItem("survey_name");
    if (!raw) { setLocation("/"); return; }
    try { setScores(JSON.parse(raw)); } catch { setLocation("/"); }
    if (n) setName(n);
  }, []);

  if (!scores) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Q3 interpretation colour ────────────────────────────────────────────
  const q3Color = scores.q3.interpretationLevel === "none"
    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
    : scores.q3.interpretationLevel === "symptomatic"
    ? "bg-amber-50 border-amber-200 text-amber-800"
    : "bg-rose-50 border-rose-200 text-rose-800";
  const q3Icon = scores.q3.interpretationLevel === "none" ? "✓" :
                 scores.q3.interpretationLevel === "symptomatic" ? "!" : "⚠";

  // ── Q5 radar data ────────────────────────────────────────────────────────
  const q5RadarData = [
    { subject: "اطمینان", value: scores.q5.confidence, max: 30 },
    { subject: "پایداری", value: scores.q5.constancy,  max: 20 },
    { subject: "کنترل",   value: scores.q5.control,    max: 20 },
  ];

  // ── Q6 bar data ──────────────────────────────────────────────────────────
  const q6Data = [
    { name: "تنش",      value: scores.q6.tension,     fill: ROSE },
    { name: "افسردگی",  value: scores.q6.depression,  fill: ROSE },
    { name: "خشم",      value: scores.q6.anger,       fill: AMBER },
    { name: "سرزندگی",  value: scores.q6.vigour,      fill: TEAL },
    { name: "خستگی",    value: scores.q6.fatigue,     fill: AMBER },
    { name: "سردرگمی",  value: scores.q6.confusion,   fill: ROSE },
    { name: "آرامش",    value: scores.q6.calmness,    fill: TEAL },
    { name: "شادکامی",  value: scores.q6.happiness,   fill: TEAL },
  ];

  // ── Q7 bar data ──────────────────────────────────────────────────────────
  const q7Data = [
    { name: "پیشرفت",     value: scores.q7.achievement },
    { name: "گروه‌گرایی", value: scores.q7.teamAffiliation },
    { name: "آمادگی",     value: scores.q7.fitness },
    { name: "تخلیه",      value: scores.q7.energyRelease },
    { name: "موقعیتی",    value: scores.q7.situationalFactors },
    { name: "مهارت",      value: scores.q7.skillDevelopment },
    { name: "دوستی",      value: scores.q7.friendship },
    { name: "تفریح",      value: scores.q7.fun },
  ];

  return (
    <div className="min-h-[100dvh] bg-background" dir="rtl">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 py-8 text-center">
        <div className="w-14 h-14 rounded-full bg-primary-foreground/20 flex items-center justify-center mx-auto mb-3 text-2xl">
          📊
        </div>
        <h1 className="text-xl font-bold mb-1">نتایج پرسشنامه شما</h1>
        {name && <p className="text-primary-foreground/80 text-sm">{name} عزیز، نتایج ارزیابی شما آماده است</p>}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* ── Q3: Exercise Addiction (most prominent — has interpretation) ─── */}
        <SectionCard title="اعتیاد به تمرین">
          <div className={`border rounded-xl p-4 mb-4 flex items-start gap-3 ${q3Color}`}>
            <span className="text-2xl font-bold flex-shrink-0">{q3Icon}</span>
            <div>
              <p className="font-bold text-base">{scores.q3.interpretation}</p>
              <p className="text-xs mt-1 opacity-80">
                امتیاز کل: <span dir="ltr">{scores.q3.total} / 30</span>
                {" "}&nbsp;|&nbsp;
                {scores.q3.total <= 12 ? "محدوده: ۰–۱۲" :
                 scores.q3.total <= 23 ? "محدوده: ۱۳–۲۳" : "محدوده: ۲۴–۳۰"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ScoreCard label="اهمیت تمرین (برجستگی نقش)" value={scores.q3.importance} max={15} />
            <ScoreCard label="پیامدهای روانشناختی" value={scores.q3.psychologicalConsequences} max={15} />
          </div>
        </SectionCard>

        {/* ── Q1: Aggression ───────────────────────────────────────────────── */}
        <SectionCard title="پرخاشگری در ورزش">
          <div className="grid grid-cols-3 gap-3">
            <ScoreCard label="پرخاشگری (خشم شخصی)" value={scores.q1.aggression} max={30} note="سوالات ۱–۶" />
            <ScoreCard label="خشم رقابتی" value={scores.q1.competitiveAnger} max={30} note="سوالات ۷–۱۲" />
            <ScoreCard label="امتیاز کل" value={scores.q1.total} max={60} />
          </div>
        </SectionCard>

        {/* ── Q2: Burnout ──────────────────────────────────────────────────── */}
        <SectionCard title="تحلیل‌رفتگی ورزشکار">
          <div className="grid grid-cols-2 gap-3">
            <ScoreCard label="خستگی هیجانی–جسمانی" value={scores.q2.emotionalExhaustion} max={15} note="سوالات ۱، ۵، ۷" />
            <ScoreCard label="امتیاز کل تحلیل‌رفتگی" value={scores.q2.total} max={55} />
          </div>
        </SectionCard>

        {/* ── Q4: Competitive Anxiety ──────────────────────────────────────── */}
        <SectionCard title="اضطراب رقابتی">
          <div className="grid grid-cols-1 gap-3">
            <ScoreCard
              label="امتیاز کل اضطراب قبل از مسابقه (SCAT)"
              value={scores.q4.total}
              max={30}
              note="دامنه: ۱۰–۳۰ | امتیاز بالاتر = اضطراب بیشتر"
            />
          </div>
          <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${((scores.q4.total - 10) / 20) * 100}%`,
                background: scores.q4.total < 17 ? TEAL : scores.q4.total < 24 ? AMBER : ROSE,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1" dir="ltr">
            <span>کم (۱۰)</span>
            <span>متوسط (۱۷–۲۳)</span>
            <span>زیاد (۳۰)</span>
          </div>
        </SectionCard>

        {/* ── Q5: Mental Toughness — Radar ─────────────────────────────────── */}
        <SectionCard title="سرسختی ذهنی ورزشی">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <ScoreCard label="اطمینان" value={scores.q5.confidence} max={30} />
            <ScoreCard label="پایداری" value={scores.q5.constancy}  max={20} />
            <ScoreCard label="کنترل"   value={scores.q5.control}    max={20} />
          </div>
          <ScoreCard label="امتیاز کل سرسختی ذهنی" value={scores.q5.total} max={70} />
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={q5RadarData} cx="50%" cy="50%" outerRadius="65%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontFamily: "Vazirmatn" }}
                />
                <Radar
                  dataKey="value"
                  stroke={TEAL}
                  fill={TEAL}
                  fillOpacity={0.35}
                  dot={{ r: 4, fill: TEAL }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* ── Q6: Mood States — Bar ─────────────────────────────────────────── */}
        <SectionCard title="حالات خلقی">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <p className="text-xs text-emerald-700 mb-1">خلق مثبت (سرزندگی+آرامش+شادکامی)</p>
              <p className="text-2xl font-bold text-emerald-700" dir="ltr">{scores.q6.positiveMood}</p>
              <p className="text-[10px] text-emerald-600">از ۴۸</p>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
              <p className="text-xs text-rose-700 mb-1">خلق منفی (تنش+افسردگی+خشم+خستگی+سردرگمی)</p>
              <p className="text-2xl font-bold text-rose-700" dir="ltr">{scores.q6.negativeMood}</p>
              <p className="text-[10px] text-rose-600">از ۸۰</p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={q6Data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: "Vazirmatn", fill: "hsl(var(--foreground))" }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 16]} />
                <Tooltip
                  contentStyle={{ fontFamily: "Vazirmatn", fontSize: 12, direction: "rtl" }}
                  formatter={(v) => [v, "امتیاز"]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {q6Data.map((entry, i) => (
                    <rect key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* ── Q7: Participation Motivation — Bar ───────────────────────────── */}
        <SectionCard title="انگیزه مشارکت ورزشی">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={q7Data} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" domain={[0, 18]} tick={{ fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={58}
                  tick={{ fontSize: 11, fontFamily: "Vazirmatn", fill: "hsl(var(--foreground))" }}
                />
                <Tooltip
                  contentStyle={{ fontFamily: "Vazirmatn", fontSize: 12, direction: "rtl" }}
                  formatter={(v) => [v, "امتیاز"]}
                />
                <Bar dataKey="value" fill={TEAL} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground mb-4">
            اطلاعات شما با موفقیت ثبت شده است. از مشارکت شما سپاسگزاریم.
          </p>
          <button
            onClick={() => {
              sessionStorage.removeItem("survey_scores");
              sessionStorage.removeItem("survey_name");
              setLocation("/");
            }}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
          >
            بازگشت به صفحه اصلی
          </button>
        </div>
      </div>
    </div>
  );
}
