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
} from "recharts";

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
    tension: number;
    depression: number;
    anger: number;
    vigour: number;
    fatigue: number;
    confusion: number;
    calmness: number;
    happiness: number;
    positiveMood: number;
    negativeMood: number;
  };
  q7: {
    achievement: number;
    teamAffiliation: number;
    fitness: number;
    energyRelease: number;
    situationalFactors: number;
    skillDevelopment: number;
    friendship: number;
    fun: number;
  };
}

type Tone = "good" | "watch" | "attention" | "neutral";

type SummaryItem = {
  title: string;
  level: string;
  description: string;
  tone: Tone;
};

const TEAL = "hsl(172 66% 30%)";
const AMBER = "hsl(38 92% 50%)";
const ROSE = "hsl(346 77% 52%)";

const toneClasses: Record<Tone, string> = {
  good: "bg-emerald-50 border-emerald-200 text-emerald-900",
  watch: "bg-amber-50 border-amber-200 text-amber-900",
  attention: "bg-rose-50 border-rose-200 text-rose-900",
  neutral: "bg-slate-50 border-slate-200 text-slate-900",
};

const toneDots: Record<Tone, string> = {
  good: "bg-emerald-500",
  watch: "bg-amber-500",
  attention: "bg-rose-500",
  neutral: "bg-slate-400",
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function normalized(value: number, min: number, max: number) {
  if (max <= min) return 0;
  return clamp((value - min) / (max - min));
}

function relativeRisk(value: number, min: number, max: number): Pick<SummaryItem, "level" | "tone"> {
  const pct = normalized(value, min, max);
  if (pct < 0.34) return { level: "کم", tone: "good" };
  if (pct < 0.67) return { level: "میانه", tone: "watch" };
  return { level: "بالا", tone: "attention" };
}

function relativeStrength(value: number, min: number, max: number): Pick<SummaryItem, "level" | "tone"> {
  const pct = normalized(value, min, max);
  if (pct < 0.34) return { level: "نیازمند تقویت", tone: "attention" };
  if (pct < 0.67) return { level: "متوسط", tone: "watch" };
  return { level: "خوب", tone: "good" };
}

function ScoreCard({
  label,
  value,
  min = 0,
  max,
  note,
}: {
  label: string;
  value: number;
  min?: number;
  max: number;
  note?: string;
}) {
  const pct = Math.round(normalized(value, min, max) * 100);
  return (
    <div className="bg-muted/40 rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold text-primary" dir="ltr">
        {value}
      </p>
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

function SummaryCard({ item }: { item: SummaryItem }) {
  return (
    <div className={`border rounded-2xl p-4 ${toneClasses[item.tone]}`}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="font-bold text-sm">{item.title}</p>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold whitespace-nowrap">
          <span className={`w-2 h-2 rounded-full ${toneDots[item.tone]}`} />
          {item.level}
        </span>
      </div>
      <p className="text-xs leading-6 opacity-90">{item.description}</p>
    </div>
  );
}

export default function Results() {
  const [, setLocation] = useLocation();
  const [scores, setScores] = useState<Scores | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("survey_scores");
    const n = sessionStorage.getItem("survey_name");
    if (!raw) {
      setLocation("/");
      return;
    }
    try {
      setScores(JSON.parse(raw));
    } catch {
      setLocation("/");
    }
    if (n) setName(n);
  }, [setLocation]);

  if (!scores) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const aggression = relativeRisk(scores.q1.total, 12, 60);
  const burnout = relativeRisk(scores.q2.total, 11, 55);
  const toughness = relativeStrength(scores.q5.total, 14, 70);

  const anxiety: Pick<SummaryItem, "level" | "tone"> =
    scores.q4.total <= 16
      ? { level: "کم", tone: "good" }
      : scores.q4.total <= 23
        ? { level: "متوسط", tone: "watch" }
        : { level: "بالا", tone: "attention" };

  const exercise: Pick<SummaryItem, "level" | "tone"> =
    scores.q3.interpretationLevel === "none"
      ? { level: "بدون علامت", tone: "good" }
      : scores.q3.interpretationLevel === "symptomatic"
        ? { level: "دارای نشانه", tone: "watch" }
        : { level: "نیازمند توجه", tone: "attention" };

  const positiveMoodPct = scores.q6.positiveMood / 48;
  const negativeMoodPct = scores.q6.negativeMood / 80;
  const mood: Pick<SummaryItem, "level" | "tone"> =
    positiveMoodPct >= negativeMoodPct + 0.15
      ? { level: "متعادل", tone: "good" }
      : negativeMoodPct >= positiveMoodPct + 0.15
        ? { level: "فشار بیشتر", tone: "attention" }
        : { level: "ترکیبی", tone: "watch" };

  const motivationOptions = [
    { label: "پیشرفت و موفقیت", value: normalized(scores.q7.achievement, 6, 18) },
    { label: "عضویت و همراهی با تیم", value: normalized(scores.q7.teamAffiliation, 3, 9) },
    { label: "آمادگی جسمانی", value: normalized(scores.q7.fitness, 3, 9) },
    { label: "تخلیه انرژی", value: normalized(scores.q7.energyRelease, 5, 15) },
    { label: "شرایط و موقعیت ورزش", value: normalized(scores.q7.situationalFactors, 3, 9) },
    { label: "یادگیری و رشد مهارت", value: normalized(scores.q7.skillDevelopment, 3, 9) },
    { label: "دوستی و ارتباط اجتماعی", value: normalized(scores.q7.friendship, 4, 12) },
    { label: "لذت و تفریح", value: normalized(scores.q7.fun, 3, 9) },
  ].sort((a, b) => b.value - a.value);
  const strongestMotivation = motivationOptions[0]?.label ?? "ورزش";

  const summaryItems: SummaryItem[] = [
    {
      title: "اضطراب قبل از رقابت",
      level: anxiety.level,
      tone: anxiety.tone,
      description:
        anxiety.tone === "good"
          ? "در پاسخ‌های شما فشار و نگرانی قبل از مسابقه در سطح پایین‌تری دیده می‌شود."
          : anxiety.tone === "watch"
            ? "مقداری نگرانی قبل از رقابت دیده می‌شود؛ داشتن روتین تنفس و گرم‌کردن ذهنی می‌تواند کمک‌کننده باشد."
            : "فشار و نگرانی قبل از رقابت در پاسخ‌های شما برجسته است و بهتر است روی مهارت‌های کنترل اضطراب کار کنید.",
    },
    {
      title: "فرسودگی و خستگی ورزشی",
      level: burnout.level,
      tone: burnout.tone,
      description:
        burnout.tone === "good"
          ? "نشانه‌های خستگی و فرسودگی در محدوده نسبی پایین‌تری قرار دارند."
          : burnout.tone === "watch"
            ? "مقداری خستگی و فشار تجمعی دیده می‌شود؛ کیفیت خواب، استراحت و حجم تمرین را جدی بگیرید."
            : "پاسخ‌ها از فشار و خستگی قابل‌توجه خبر می‌دهند؛ بازیابی و تنظیم بار تمرین در اولویت است.",
    },
    {
      title: "واکنش خشم و پرخاشگری",
      level: aggression.level,
      tone: aggression.tone,
      description:
        aggression.tone === "good"
          ? "تمایل به واکنش خشمگینانه یا پرخاشگرانه در پاسخ‌های شما پایین‌تر است."
          : aggression.tone === "watch"
            ? "واکنش هیجانی شما در موقعیت‌های رقابتی متوسط است؛ مکث کوتاه و تمرکز روی اقدام بعدی مفید است."
            : "خشم و واکنش پرخاشگرانه در پاسخ‌ها برجسته‌تر است؛ تمرین تنظیم هیجان می‌تواند عملکرد را پایدارتر کند.",
    },
    {
      title: "سرسختی ذهنی",
      level: toughness.level,
      tone: toughness.tone,
      description:
        toughness.tone === "good"
          ? "اعتماد، پایداری و احساس کنترل شما در مجموع نقطه قوت مناسبی به نظر می‌رسد."
          : toughness.tone === "watch"
            ? "سرسختی ذهنی شما در سطح متوسط است و با هدف‌گذاری فرایندی و تمرین تمرکز قابل تقویت است."
            : "اعتماد، پایداری یا کنترل ذهنی جای بیشتری برای رشد دارد؛ تمرین مهارت‌های ذهنی می‌تواند کمک کند.",
    },
    {
      title: "رابطه شما با تمرین",
      level: exercise.level,
      tone: exercise.tone,
      description:
        scores.q3.interpretationLevel === "none"
          ? "الگوی پاسخ شما نشانه‌ای از وابستگی مشکل‌ساز به تمرین نشان نمی‌دهد."
          : scores.q3.interpretationLevel === "symptomatic"
            ? "برخی نشانه‌های وابستگی زیاد به تمرین دیده می‌شود؛ تعادل بین تمرین، استراحت و زندگی روزمره را بررسی کنید."
            : "نشانه‌های وابستگی شدید به تمرین برجسته‌اند؛ اگر تمرین روی خواب، روابط یا کارهای روزمره اثر گذاشته، گفت‌وگو با متخصص ورزش یا سلامت روان توصیه می‌شود.",
    },
    {
      title: "تعادل خلقی",
      level: mood.level,
      tone: mood.tone,
      description:
        mood.tone === "good"
          ? "سرزندگی، آرامش و شادکامی نسبت به هیجان‌های منفی سهم بیشتری در پاسخ‌های شما دارند."
          : mood.tone === "watch"
            ? "خلق مثبت و منفی نسبتاً نزدیک‌اند؛ خواب، ریکاوری و شرایط روزهای اخیر می‌توانند روی این وضعیت اثر بگذارند."
            : "تنش، خستگی یا هیجان‌های منفی نسبت به خلق مثبت برجسته‌ترند؛ چند روز آینده ریکاوری و وضعیت انرژی خود را زیر نظر بگیرید.",
    },
  ];

  const attentionCount = summaryItems.filter((item) => item.tone === "attention").length;
  const watchCount = summaryItems.filter((item) => item.tone === "watch").length;
  const overallTone: Tone = attentionCount >= 2 ? "attention" : attentionCount === 1 || watchCount >= 3 ? "watch" : "good";
  const overallTitle =
    overallTone === "good"
      ? "وضعیت کلی شما متعادل به نظر می‌رسد"
      : overallTone === "watch"
        ? "چند بخش ارزش توجه بیشتری دارند"
        : "چند نشانه مهم نیازمند توجه هستند";
  const overallDescription =
    overallTone === "good"
      ? "در بیشتر شاخص‌ها نشانه نگران‌کننده برجسته‌ای دیده نمی‌شود. روی عادت‌های خوب فعلی و ریکاوری منظم ادامه دهید."
      : overallTone === "watch"
        ? "نتیجه شما ترکیبی است. لازم نیست نگران شوید، اما بهتر است روی بخش‌های زرد یا قرمز تمرکز و آن‌ها را در هفته‌های آینده دوباره ارزیابی کنید."
        : "چند شاخص هم‌زمان در محدوده بالاتری قرار گرفته‌اند. کاهش فشار، ریکاوری بهتر و در صورت تداوم نشانه‌ها گفت‌وگو با مربی یا روان‌شناس ورزشی می‌تواند مفید باشد.";

  const recommendations: string[] = [];
  if (anxiety.tone !== "good") recommendations.push("پیش از مسابقه یک روتین ۳ تا ۵ دقیقه‌ای تنفس آرام و تمرکز روی کار بعدی داشته باشید.");
  if (burnout.tone !== "good" || mood.tone === "attention") recommendations.push("برای چند روز کیفیت خواب، انرژی صبحگاهی و فشار تمرین را ثبت کنید و در صورت افت مداوم، بار تمرین را با مربی بازبینی کنید.");
  if (aggression.tone === "attention") recommendations.push("در موقعیت‌های تنش‌زا از قانون «مکث، یک نفس عمیق، انتخاب واکنش» استفاده کنید تا تصمیم‌گیری از هیجان جدا شود.");
  if (toughness.tone !== "good") recommendations.push("برای تمرین ذهنی، هدف‌های کوچک و قابل‌کنترل مثل کیفیت اجرای تکنیک یا حفظ تمرکز را جایگزین تمرکز صرف روی نتیجه کنید.");
  if (exercise.tone !== "good") recommendations.push("حداقل یک روز استراحت/ریکاوری واقعی در برنامه داشته باشید و بررسی کنید آیا تمرین به خواب، روابط یا مسئولیت‌های روزمره آسیب می‌زند یا نه.");
  if (recommendations.length === 0) recommendations.push("روتین فعلی خواب، ریکاوری و آمادگی ذهنی را حفظ کنید و این ارزیابی را در یک بازه مشابه دوباره انجام دهید.");

  const q3Color = scores.q3.interpretationLevel === "none"
    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
    : scores.q3.interpretationLevel === "symptomatic"
      ? "bg-amber-50 border-amber-200 text-amber-800"
      : "bg-rose-50 border-rose-200 text-rose-800";
  const q3Icon = scores.q3.interpretationLevel === "none" ? "✓" : scores.q3.interpretationLevel === "symptomatic" ? "!" : "⚠";

  const q5RadarData = [
    { subject: "اطمینان", value: scores.q5.confidence },
    { subject: "پایداری", value: scores.q5.constancy },
    { subject: "کنترل", value: scores.q5.control },
  ];

  const q6Data = [
    { name: "تنش", value: scores.q6.tension, fill: ROSE },
    { name: "افسردگی", value: scores.q6.depression, fill: ROSE },
    { name: "خشم", value: scores.q6.anger, fill: AMBER },
    { name: "سرزندگی", value: scores.q6.vigour, fill: TEAL },
    { name: "خستگی", value: scores.q6.fatigue, fill: AMBER },
    { name: "سردرگمی", value: scores.q6.confusion, fill: ROSE },
    { name: "آرامش", value: scores.q6.calmness, fill: TEAL },
    { name: "شادکامی", value: scores.q6.happiness, fill: TEAL },
  ];

  const q7Data = [
    { name: "پیشرفت", value: scores.q7.achievement },
    { name: "گروه‌گرایی", value: scores.q7.teamAffiliation },
    { name: "آمادگی", value: scores.q7.fitness },
    { name: "تخلیه", value: scores.q7.energyRelease },
    { name: "موقعیتی", value: scores.q7.situationalFactors },
    { name: "مهارت", value: scores.q7.skillDevelopment },
    { name: "دوستی", value: scores.q7.friendship },
    { name: "تفریح", value: scores.q7.fun },
  ];

  return (
    <div className="min-h-[100dvh] bg-background" dir="rtl">
      <div className="bg-primary text-primary-foreground px-4 py-8 text-center">
        <div className="w-14 h-14 rounded-full bg-primary-foreground/20 flex items-center justify-center mx-auto mb-3 text-2xl">📊</div>
        <h1 className="text-xl font-bold mb-1">نتیجه ارزیابی شما</h1>
        {name && <p className="text-primary-foreground/80 text-sm">{name} عزیز، این خلاصه کمک می‌کند وضعیت فعلی‌ات را ساده‌تر ببینی.</p>}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className={`border rounded-2xl p-5 mb-4 ${toneClasses[overallTone]}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2.5 h-2.5 rounded-full ${toneDots[overallTone]}`} />
            <h2 className="font-bold text-lg">{overallTitle}</h2>
          </div>
          <p className="text-sm leading-7">{overallDescription}</p>
          <div className="mt-4 rounded-xl bg-white/60 p-3 text-sm">
            <span className="font-bold">انگیزه برجسته شما برای ورزش: </span>
            {strongestMotivation}
          </div>
        </div>

        <SectionCard title="خلاصه ساده وضعیت شما">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {summaryItems.map((item) => (
              <SummaryCard key={item.title} item={item} />
            ))}
          </div>
          <p className="text-[11px] leading-5 text-muted-foreground mt-4">
            برچسب‌های کم، میانه و بالا در این خلاصه برای ساده‌سازی و بر اساس جایگاه نسبی امتیاز شما در دامنه همین پرسشنامه هستند؛ این بخش به‌تنهایی تشخیص پزشکی یا روان‌شناختی محسوب نمی‌شود.
          </p>
        </SectionCard>

        <SectionCard title="پیشنهادهای عملی برای شما">
          <div className="space-y-3">
            {recommendations.slice(0, 4).map((recommendation, index) => (
              <div key={recommendation} className="flex items-start gap-3 bg-muted/40 rounded-xl p-3">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-sm leading-6">{recommendation}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] leading-5 text-muted-foreground mt-4">
            اگر خستگی، اضطراب، افت خلق یا اجبار به تمرین برای چند هفته ادامه داشت یا روی زندگی روزمره و عملکرد شما اثر گذاشت، ارزیابی حضوری توسط روان‌شناس ورزشی یا متخصص سلامت انتخاب دقیق‌تری است.
          </p>
        </SectionCard>

        <div className="flex items-center gap-3 my-7">
          <div className="h-px bg-border flex-1" />
          <p className="text-xs font-semibold text-muted-foreground">جزئیات تخصصی امتیازها</p>
          <div className="h-px bg-border flex-1" />
        </div>

        <SectionCard title="اعتیاد به تمرین">
          <div className={`border rounded-xl p-4 mb-4 flex items-start gap-3 ${q3Color}`}>
            <span className="text-2xl font-bold flex-shrink-0">{q3Icon}</span>
            <div>
              <p className="font-bold text-base">{scores.q3.interpretation}</p>
              <p className="text-xs mt-1 opacity-80">
                امتیاز کل: <span dir="ltr">{scores.q3.total} / 30</span>{" "}|{" "}
                {scores.q3.total <= 12 ? "محدوده: ۰–۱۲" : scores.q3.total <= 23 ? "محدوده: ۱۳–۲۳" : "محدوده: ۲۴–۳۰"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ScoreCard label="اهمیت تمرین (برجستگی نقش)" value={scores.q3.importance} min={3} max={15} />
            <ScoreCard label="پیامدهای روانشناختی" value={scores.q3.psychologicalConsequences} min={3} max={15} />
          </div>
        </SectionCard>

        <SectionCard title="پرخاشگری در ورزش">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ScoreCard label="پرخاشگری (خشم شخصی)" value={scores.q1.aggression} min={6} max={30} note="سوالات ۱–۶" />
            <ScoreCard label="خشم رقابتی" value={scores.q1.competitiveAnger} min={6} max={30} note="سوالات ۷–۱۲" />
            <ScoreCard label="امتیاز کل" value={scores.q1.total} min={12} max={60} />
          </div>
        </SectionCard>

        <SectionCard title="تحلیل‌رفتگی ورزشکار">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ScoreCard label="خستگی هیجانی–جسمانی" value={scores.q2.emotionalExhaustion} min={3} max={15} note="سوالات ۱، ۵، ۷" />
            <ScoreCard label="امتیاز کل تحلیل‌رفتگی" value={scores.q2.total} min={11} max={55} />
          </div>
        </SectionCard>

        <SectionCard title="اضطراب رقابتی">
          <ScoreCard label="امتیاز کل اضطراب قبل از مسابقه (SCAT)" value={scores.q4.total} min={10} max={30} note="دامنه: ۱۰–۳۰ | امتیاز بالاتر = اضطراب بیشتر" />
          <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${normalized(scores.q4.total, 10, 30) * 100}%`,
                background: scores.q4.total < 17 ? TEAL : scores.q4.total < 24 ? AMBER : ROSE,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1" dir="ltr">
            <span>کم (۱۰–۱۶)</span>
            <span>متوسط (۱۷–۲۳)</span>
            <span>زیاد (۲۴–۳۰)</span>
          </div>
        </SectionCard>

        <SectionCard title="سرسختی ذهنی ورزشی">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <ScoreCard label="اطمینان" value={scores.q5.confidence} min={6} max={30} />
            <ScoreCard label="پایداری" value={scores.q5.constancy} min={4} max={20} />
            <ScoreCard label="کنترل" value={scores.q5.control} min={4} max={20} />
          </div>
          <ScoreCard label="امتیاز کل سرسختی ذهنی" value={scores.q5.total} min={14} max={70} />
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={q5RadarData} cx="50%" cy="50%" outerRadius="65%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontFamily: "Vazirmatn" }} />
                <Radar dataKey="value" stroke={TEAL} fill={TEAL} fillOpacity={0.35} dot={{ r: 4, fill: TEAL }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="حالات خلقی">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <p className="text-xs text-emerald-700 mb-1">خلق مثبت</p>
              <p className="text-2xl font-bold text-emerald-700" dir="ltr">{scores.q6.positiveMood}</p>
              <p className="text-[10px] text-emerald-600">از ۴۸</p>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
              <p className="text-xs text-rose-700 mb-1">خلق منفی</p>
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
                <Tooltip contentStyle={{ fontFamily: "Vazirmatn", fontSize: 12, direction: "rtl" }} formatter={(value) => [value, "امتیاز"]} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill={TEAL} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="انگیزه مشارکت ورزشی">
          <p className="text-xs text-muted-foreground mb-4">این بخش خوب یا بد بودن را نشان نمی‌دهد؛ فقط می‌گوید چه انگیزه‌هایی برای شما پررنگ‌ترند.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={q7Data} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" domain={[0, 18]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={58} tick={{ fontSize: 11, fontFamily: "Vazirmatn", fill: "hsl(var(--foreground))" }} />
                <Tooltip contentStyle={{ fontFamily: "Vazirmatn", fontSize: 12, direction: "rtl" }} formatter={(value) => [value, "امتیاز"]} />
                <Bar dataKey="value" fill={TEAL} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground mb-4">اطلاعات شما با موفقیت ثبت شده است. از مشارکت شما سپاسگزاریم.</p>
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
