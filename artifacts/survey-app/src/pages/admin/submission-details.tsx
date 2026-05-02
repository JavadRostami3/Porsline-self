import { useEffect } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useGetAdminSubmission, getGetAdminSubmissionQueryKey } from "@workspace/api-client-react";
import AdminLayout from "@/components/admin-layout";
import { questionnaires } from "@/data/questionnaires";
import { Button } from "@/components/ui/button";

function AnswersGrid({ answers, scale }: { answers: number[]; scale: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {answers.map((a, i) => (
        <div
          key={i}
          className="bg-muted rounded-lg px-3 py-1.5 text-center min-w-14"
          data-testid={`answer-${i + 1}`}
        >
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
            <Button variant="outline" size="sm" data-testid="button-back-submissions">
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
