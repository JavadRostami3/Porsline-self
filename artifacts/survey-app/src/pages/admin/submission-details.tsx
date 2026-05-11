import { useEffect } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useGetAdminSubmission, getGetAdminSubmissionQueryKey } from "@workspace/api-client-react";
import AdminLayout from "@/components/admin-layout";
import { questionnaires } from "@/data/questionnaires";
import { Button } from "@/components/ui/button";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ─── Scores type (mirrors server-side interface) ──────────────────────────────
interface Scores {
  q1: { aggression: number; competitiveAnger: number; total: number };
  q2: { emotionalExhaustion: number; total: number };
  q3: { importance: number; psychologicalConsequences: number; total: number; interpretation: string; interpretationLevel: string };
  q4: { total: number };
  q5: { confidence: number; constancy: number; control: number; total: number };
  q6: { tension: number; depression: number; anger: number; vigour: number; fatigue: number; confusion: number; calmness: number; happiness: number; positiveMood: number; negativeMood: number };
  q7: { achievement: number; teamAffiliation: number; fitness: number; energyRelease: number; situationalFactors: number; skillDevelopment: number; friendship: number; fun: number };
}

const TEAL = "hsl(172 66% 30%)";
const ROSE = "hsl(346 77% 52%)";
const AMBER = "hsl(38 92% 50%)";

function ScorePill({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="bg-muted/50 rounded-lg px-3 py-2 text-center">
      <p className="text-[10px] text-muted-foreground leading-tight mb-1">{label}</p>
      <p className="text-xl font-bold text-primary" dir="ltr">{value}</p>
      <p className="text-[10px] text-muted-foreground" dir="ltr">/ {max}</p>
    </div>
  );
}

function ScoresSection({ scores }: { scores: Scores }) {
  const q5RadarData = [
    { subject: "اطمینان", value: scores.q5.confidence },
    { subject: "پایداری", value: scores.q5.constancy },
    { subject: "کنترل",   value: scores.q5.control },
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
    { name: "پیشرفت",     value: scores.q7.achievement },
    { name: "گروه‌گرایی", value: scores.q7.teamAffiliation },
    { name: "آمادگی",     value: scores.q7.fitness },
    { name: "تخلیه",      value: scores.q7.energyRelease },
    { name: "موقعیتی",    value: scores.q7.situationalFactors },
    { name: "مهارت",      value: scores.q7.skillDevelopment },
    { name: "دوستی",      value: scores.q7.friendship },
    { name: "تفریح",      value: scores.q7.fun },
  ];

  const q3Color = scores.q3.interpretationLevel === "none"
    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
    : scores.q3.interpretationLevel === "symptomatic"
    ? "bg-amber-50 border-amber-200 text-amber-700"
    : "bg-rose-50 border-rose-200 text-rose-700";

  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-6">
      <h2 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
        <span className="text-primary">📊</span> امتیازات محاسبه‌شده
      </h2>

      {/* Q3 interpretation */}
      <div className={`border rounded-xl p-3 mb-5 flex items-center gap-3 ${q3Color}`}>
        <span className="text-2xl">
          {scores.q3.interpretationLevel === "none" ? "✓" : scores.q3.interpretationLevel === "symptomatic" ? "!" : "⚠"}
        </span>
        <div>
          <p className="font-bold text-sm">اعتیاد به تمرین: {scores.q3.interpretation}</p>
          <p className="text-xs opacity-80" dir="ltr">امتیاز: {scores.q3.total} / 30</p>
        </div>
      </div>

      {/* Q1 */}
      <p className="text-xs font-semibold text-muted-foreground mb-2">پرخاشگری</p>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <ScorePill label="پرخاشگری (خشم شخصی)" value={scores.q1.aggression} max={30} />
        <ScorePill label="خشم رقابتی" value={scores.q1.competitiveAnger} max={30} />
        <ScorePill label="کل پرخاشگری" value={scores.q1.total} max={60} />
      </div>

      {/* Q2 */}
      <p className="text-xs font-semibold text-muted-foreground mb-2">تحلیل‌رفتگی</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <ScorePill label="خستگی هیجانی–جسمانی" value={scores.q2.emotionalExhaustion} max={15} />
        <ScorePill label="کل تحلیل‌رفتگی" value={scores.q2.total} max={55} />
      </div>

      {/* Q3 sub-scales */}
      <p className="text-xs font-semibold text-muted-foreground mb-2">اعتیاد به تمرین (زیرمقیاس)</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <ScorePill label="اهمیت تمرین" value={scores.q3.importance} max={15} />
        <ScorePill label="پیامدهای روانشناختی" value={scores.q3.psychologicalConsequences} max={15} />
      </div>

      {/* Q4 */}
      <p className="text-xs font-semibold text-muted-foreground mb-2">اضطراب رقابتی</p>
      <div className="grid grid-cols-1 gap-2 mb-4">
        <ScorePill label="امتیاز کل SCAT (دامنه ۱۰–۳۰)" value={scores.q4.total} max={30} />
      </div>

      {/* Q5 */}
      <p className="text-xs font-semibold text-muted-foreground mb-2">سرسختی ذهنی</p>
      <div className="grid grid-cols-4 gap-2 mb-3">
        <ScorePill label="اطمینان" value={scores.q5.confidence} max={30} />
        <ScorePill label="پایداری" value={scores.q5.constancy}  max={20} />
        <ScorePill label="کنترل"   value={scores.q5.control}    max={20} />
        <ScorePill label="کل"      value={scores.q5.total}      max={70} />
      </div>
      <div className="h-44 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={q5RadarData} cx="50%" cy="50%" outerRadius="60%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fontFamily: "Vazirmatn" }} />
            <Radar dataKey="value" stroke={TEAL} fill={TEAL} fillOpacity={0.3} dot={{ r: 4, fill: TEAL }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Q6 */}
      <p className="text-xs font-semibold text-muted-foreground mb-2">حالات خلقی</p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center">
          <p className="text-[10px] text-emerald-700">خلق مثبت</p>
          <p className="text-xl font-bold text-emerald-700" dir="ltr">{scores.q6.positiveMood}</p>
          <p className="text-[10px] text-emerald-600">از ۴۸</p>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-center">
          <p className="text-[10px] text-rose-700">خلق منفی</p>
          <p className="text-xl font-bold text-rose-700" dir="ltr">{scores.q6.negativeMood}</p>
          <p className="text-[10px] text-rose-600">از ۸۰</p>
        </div>
      </div>
      <div className="h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={q6Data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: "Vazirmatn" }} />
            <YAxis tick={{ fontSize: 9 }} domain={[0, 16]} />
            <Tooltip contentStyle={{ fontFamily: "Vazirmatn", fontSize: 11 }} formatter={(v) => [v, "امتیاز"]} />
            <Bar dataKey="value" fill={TEAL} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Q7 */}
      <p className="text-xs font-semibold text-muted-foreground mb-2">انگیزه مشارکت</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={q7Data} layout="vertical" margin={{ top: 0, right: 10, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" domain={[0, 18]} tick={{ fontSize: 9 }} />
            <YAxis type="category" dataKey="name" width={55} tick={{ fontSize: 10, fontFamily: "Vazirmatn" }} />
            <Tooltip contentStyle={{ fontFamily: "Vazirmatn", fontSize: 11 }} formatter={(v) => [v, "امتیاز"]} />
            <Bar dataKey="value" fill={TEAL} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AnswersGrid({ answers, scale }: { answers: number[]; scale: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {answers.map((a, i) => (
        <div key={i} className="bg-muted rounded-lg px-3 py-1.5 text-center min-w-14">
          <div className="text-xs text-muted-foreground">سوال {i + 1}</div>
          <div className="font-bold text-primary text-lg">{a}</div>
          <div className="text-[10px] text-muted-foreground">{scale[a - 1] ?? ""}</div>
        </div>
      ))}
    </div>
  );
}

export default function SubmissionDetails() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/submissions/:id");
  const id = Number(params?.id);

  const { data, isLoading, error } = useGetAdminSubmission(id, {
    query: {
      enabled: !!id,
      queryKey: getGetAdminSubmissionQueryKey(id),
    },
  });

  useEffect(() => {
    if (error && (error as { status?: number }).status === 401) {
      setLocation("/admin/login");
    }
  }, [error]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!data) return null;

  const d = data.demographics;
  const resp = data as unknown as Record<string, unknown>;
  const scores = resp.scores as Scores | null | undefined;

  const demographicRows = [
    { label: "سن", value: `${d.age} سال` },
    { label: "رده سنی رقابت", value: d.competitionAgeGroup },
    { label: "جنسیت", value: d.gender },
    { label: "قد", value: `${d.height} سانتیمتر` },
    { label: "وزن", value: `${d.weight} کیلوگرم` },
    { label: "شهر", value: d.city },
    { label: "وضعیت تأهل", value: d.maritalStatus },
    { label: "رشته ورزشی", value: d.sport },
    { label: "سابقه تیم ملی", value: d.nationalTeamHistory },
    { label: "سابقه لیگ برتر", value: d.premierLeagueHistory },
    { label: "سابقه لیگ دسته اول", value: d.firstLeagueHistory },
    { label: "سابقه ورزشی", value: `${d.yearsOfExperience} سال` },
    { label: "سابقه آسیب دیدگی", value: d.injuryHistory },
    ...(d.timeSinceLastInjury ? [{ label: "مدت از آخرین آسیب", value: d.timeSinceLastInjury }] : []),
    { label: "درمان با فیزیوتراپی", value: d.physiotherapyTreatment },
    { label: "سابقه جراحی", value: d.surgerHistory },
    ...(d.injuryDetails ? [{ label: "جزئیات آسیب‌ها", value: d.injuryDetails }] : []),
  ];

  const questionnaireData = [
    { q: questionnaires[0], answers: data.questionnaire1 as number[] },
    { q: questionnaires[1], answers: data.questionnaire2 as number[] },
    { q: questionnaires[2], answers: data.questionnaire3 as number[] },
    { q: questionnaires[3], answers: data.questionnaire4 as number[] },
    { q: questionnaires[4], answers: data.questionnaire5 as number[] },
    { q: questionnaires[5], answers: data.questionnaire6 as number[] },
    { q: questionnaires[6], answers: data.questionnaire7 as number[] },
  ];

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/submissions">
            <Button variant="outline" size="sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
              بازگشت
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{d.fullName}</h1>
            <p className="text-muted-foreground text-sm">
              ثبت شده در: {new Date(data.submittedAt).toLocaleDateString("fa-IR")}
            </p>
          </div>
        </div>

        {/* Demographics */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">اطلاعات فردی</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {demographicRows.map((row) => (
              <div key={row.label} className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">{row.label}</p>
                <p className="font-semibold text-foreground text-sm">{row.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scores breakdown — only if scores are available */}
        {scores && <ScoresSection scores={scores} />}

        {/* Questionnaire Answers */}
        {questionnaireData.map(({ q, answers }) => (
          <div key={q.id} className="bg-card border border-border rounded-xl p-6 mb-4">
            <h2 className="text-base font-semibold text-foreground mb-1">{q.title}</h2>
            <div className="flex flex-wrap gap-1 mb-4">
              {q.scale.map((label, i) => (
                <span key={i} className="text-[10px] bg-muted rounded-full px-2 py-0.5 text-muted-foreground">
                  <span className="font-bold text-primary">{i + 1}</span> = {label}
                </span>
              ))}
            </div>
            <div className="space-y-2">
              {q.questions.map((question, qi) => (
                <div key={qi} className="flex items-start gap-3 py-1.5 border-b border-border/40 last:border-0">
                  <span className="flex-shrink-0 text-xs font-bold text-muted-foreground w-5 text-left pt-0.5">{qi + 1}.</span>
                  <span className="flex-1 text-sm text-foreground leading-relaxed">{question}</span>
                  <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg px-3 py-1 text-center min-w-16">
                    <div className="text-lg font-bold">{answers[qi] ?? "-"}</div>
                    <div className="text-[10px]">{q.scale[(answers[qi] ?? 1) - 1]}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
