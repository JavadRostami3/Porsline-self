import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useSurvey, type Demographics } from "@/context/survey-context";
import { questionnaires, stepLabels } from "@/data/questionnaires";
import { useCreateSubmission } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Progress Bar Component
function ProgressBar({ currentStep }: { currentStep: number }) {
  const total = 8;
  const progress = ((currentStep + 1) / total) * 100;

  return (
    <div className="w-full mb-8" data-testid="progress-bar">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-muted-foreground font-medium">
          بخش {currentStep + 1} از {total}
        </span>
        <span className="text-sm text-primary font-semibold">
          {stepLabels[currentStep]}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 overflow-x-auto gap-1">
        {stepLabels.map((label, i) => (
          <div
            key={i}
            className={`flex-1 min-w-0 text-center text-[10px] px-1 truncate transition-colors ${
              i < currentStep
                ? "text-primary font-medium"
                : i === currentStep
                ? "text-primary font-bold"
                : "text-muted-foreground/50"
            }`}
          >
            {i <= currentStep ? "●" : "○"}
          </div>
        ))}
      </div>
    </div>
  );
}

// Demographics Form
function DemographicsStep({ onSubmit }: { onSubmit: (data: Demographics) => void }) {
  const [form, setForm] = useState<Partial<Demographics>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: keyof Demographics, value: string | number) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    const required: (keyof Demographics)[] = [
      "fullName", "age", "competitionAgeGroup", "gender", "height", "weight",
      "city", "maritalStatus", "sport", "nationalTeamHistory",
      "premierLeagueHistory", "firstLeagueHistory", "yearsOfExperience",
      "injuryHistory", "physiotherapyTreatment", "surgerHistory",
    ];
    for (const f of required) {
      if (form[f] === undefined || form[f] === "" || form[f] === null) {
        errs[f] = "این فیلد الزامی است";
      }
    }
    if (form.injuryHistory === "بله" && !form.timeSinceLastInjury) {
      errs.timeSinceLastInjury = "این فیلد الزامی است";
    }
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstError = document.querySelector('[data-error="true"]');
      firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onSubmit(form as Demographics);
  };

  const field = (
    label: string,
    key: keyof Demographics,
    input: React.ReactNode
  ) => (
    <div className="flex flex-col gap-1.5" data-error={!!errors[key]}>
      <Label className="font-medium text-sm">{label}</Label>
      {input}
      {errors[key] && (
        <p className="text-destructive text-xs">{errors[key]}</p>
      )}
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-1">اطلاعات فردی</h2>
      <p className="text-muted-foreground text-sm mb-8">لطفاً اطلاعات زیر را با دقت وارد نمایید</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {field("نام و نام خانوادگی", "fullName",
          <Input
            data-testid="input-fullName"
            value={form.fullName ?? ""}
            onChange={(e) => update("fullName", e.target.value)}
            placeholder="نام و نام خانوادگی"
            className={errors.fullName ? "border-destructive" : ""}
          />
        )}

        {field("سن", "age",
          <Input
            data-testid="input-age"
            type="number"
            value={form.age ?? ""}
            onChange={(e) => update("age", Number(e.target.value))}
            placeholder="مثال: ۲۴"
            className={errors.age ? "border-destructive" : ""}
          />
        )}

        {field("رده سنی رقابت", "competitionAgeGroup",
          <Select onValueChange={(v) => update("competitionAgeGroup", v)}>
            <SelectTrigger data-testid="select-competitionAgeGroup" className={errors.competitionAgeGroup ? "border-destructive" : ""}>
              <SelectValue placeholder="انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="نوجوانان">نوجوانان</SelectItem>
              <SelectItem value="جوانان">جوانان</SelectItem>
              <SelectItem value="بزرگسالان">بزرگسالان</SelectItem>
            </SelectContent>
          </Select>
        )}

        {field("جنسیت", "gender",
          <Select onValueChange={(v) => update("gender", v)}>
            <SelectTrigger data-testid="select-gender" className={errors.gender ? "border-destructive" : ""}>
              <SelectValue placeholder="انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="مرد">مرد</SelectItem>
              <SelectItem value="زن">زن</SelectItem>
            </SelectContent>
          </Select>
        )}

        {field("قد (سانتیمتر)", "height",
          <Input
            data-testid="input-height"
            type="number"
            value={form.height ?? ""}
            onChange={(e) => update("height", Number(e.target.value))}
            placeholder="مثال: ۱۷۵"
            className={errors.height ? "border-destructive" : ""}
          />
        )}

        {field("وزن (کیلوگرم)", "weight",
          <Input
            data-testid="input-weight"
            type="number"
            value={form.weight ?? ""}
            onChange={(e) => update("weight", Number(e.target.value))}
            placeholder="مثال: ۷۰"
            className={errors.weight ? "border-destructive" : ""}
          />
        )}

        {field("شهر", "city",
          <Input
            data-testid="input-city"
            value={form.city ?? ""}
            onChange={(e) => update("city", e.target.value)}
            placeholder="نام شهر"
            className={errors.city ? "border-destructive" : ""}
          />
        )}

        {field("وضعیت تأهل", "maritalStatus",
          <Select onValueChange={(v) => update("maritalStatus", v)}>
            <SelectTrigger data-testid="select-maritalStatus" className={errors.maritalStatus ? "border-destructive" : ""}>
              <SelectValue placeholder="انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="مجرد">مجرد</SelectItem>
              <SelectItem value="متأهل">متأهل</SelectItem>
              <SelectItem value="مطلقه">مطلقه</SelectItem>
            </SelectContent>
          </Select>
        )}

        <div className="md:col-span-2">
          {field("رشته ورزشی", "sport",
            <Input
              data-testid="input-sport"
              value={form.sport ?? ""}
              onChange={(e) => update("sport", e.target.value)}
              placeholder="مثال: فوتبال، کشتی، تکواندو"
              className={errors.sport ? "border-destructive" : ""}
            />
          )}
        </div>

        {field("سابقه عضویت در تیم ملی", "nationalTeamHistory",
          <Select onValueChange={(v) => update("nationalTeamHistory", v)}>
            <SelectTrigger data-testid="select-nationalTeamHistory" className={errors.nationalTeamHistory ? "border-destructive" : ""}>
              <SelectValue placeholder="انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="بله">بله</SelectItem>
              <SelectItem value="خیر">خیر</SelectItem>
            </SelectContent>
          </Select>
        )}

        {field("سابقه عضویت در تیم های لیگ برتر", "premierLeagueHistory",
          <Select onValueChange={(v) => update("premierLeagueHistory", v)}>
            <SelectTrigger data-testid="select-premierLeagueHistory" className={errors.premierLeagueHistory ? "border-destructive" : ""}>
              <SelectValue placeholder="انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="بله">بله</SelectItem>
              <SelectItem value="خیر">خیر</SelectItem>
            </SelectContent>
          </Select>
        )}

        {field("سابقه عضویت در تیم های لیگ دسته اول", "firstLeagueHistory",
          <Select onValueChange={(v) => update("firstLeagueHistory", v)}>
            <SelectTrigger data-testid="select-firstLeagueHistory" className={errors.firstLeagueHistory ? "border-destructive" : ""}>
              <SelectValue placeholder="انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="بله">بله</SelectItem>
              <SelectItem value="خیر">خیر</SelectItem>
            </SelectContent>
          </Select>
        )}

        {field("سابقه ورزشی به سال", "yearsOfExperience",
          <Input
            data-testid="input-yearsOfExperience"
            type="number"
            value={form.yearsOfExperience ?? ""}
            onChange={(e) => update("yearsOfExperience", Number(e.target.value))}
            placeholder="مثال: ۱۰"
            className={errors.yearsOfExperience ? "border-destructive" : ""}
          />
        )}

        {field("سابقه آسیب دیدگی", "injuryHistory",
          <Select onValueChange={(v) => update("injuryHistory", v)}>
            <SelectTrigger data-testid="select-injuryHistory" className={errors.injuryHistory ? "border-destructive" : ""}>
              <SelectValue placeholder="انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="بله">بله</SelectItem>
              <SelectItem value="خیر">خیر</SelectItem>
            </SelectContent>
          </Select>
        )}

        {form.injuryHistory === "بله" && (
          <div className="md:col-span-2">
            {field("چند وقت از آخرین آسیب دیدگی می‌گذرد؟", "timeSinceLastInjury",
              <Input
                data-testid="input-timeSinceLastInjury"
                value={form.timeSinceLastInjury ?? ""}
                onChange={(e) => update("timeSinceLastInjury", e.target.value)}
                placeholder="مثال: ۶ ماه، ۲ سال"
                className={errors.timeSinceLastInjury ? "border-destructive" : ""}
              />
            )}
          </div>
        )}

        {field("درمان با فیزیوتراپی", "physiotherapyTreatment",
          <Select onValueChange={(v) => update("physiotherapyTreatment", v)}>
            <SelectTrigger data-testid="select-physiotherapyTreatment" className={errors.physiotherapyTreatment ? "border-destructive" : ""}>
              <SelectValue placeholder="انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="بله">بله</SelectItem>
              <SelectItem value="خیر">خیر</SelectItem>
            </SelectContent>
          </Select>
        )}

        {field("سابقه جراحی آسیب دیدگی", "surgerHistory",
          <Select onValueChange={(v) => update("surgerHistory", v)}>
            <SelectTrigger data-testid="select-surgerHistory" className={errors.surgerHistory ? "border-destructive" : ""}>
              <SelectValue placeholder="انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="بله">بله</SelectItem>
              <SelectItem value="خیر">خیر</SelectItem>
            </SelectContent>
          </Select>
        )}

        <div className="md:col-span-2">
          <div className="flex flex-col gap-1.5">
            <Label className="font-medium text-sm">آسیب ها ذکر شود (اختیاری)</Label>
            <Textarea
              data-testid="textarea-injuryDetails"
              value={form.injuryDetails ?? ""}
              onChange={(e) => update("injuryDetails", e.target.value)}
              placeholder="آسیب های قبلی خود را شرح دهید"
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="mt-10 flex justify-start">
        <Button
          size="lg"
          onClick={handleSubmit}
          data-testid="button-next-demographics"
          className="px-10 py-3 text-base"
        >
          مرحله بعد
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 rotate-180"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </Button>
      </div>
    </div>
  );
}

// Questionnaire Step
function QuestionnaireStep({
  questionnaireIndex,
  currentAnswers,
  onSubmit,
  onBack,
}: {
  questionnaireIndex: number;
  currentAnswers: number[];
  onSubmit: (answers: number[]) => void;
  onBack: () => void;
}) {
  const q = questionnaires[questionnaireIndex];
  const [answers, setAnswers] = useState<number[]>(
    currentAnswers.length === q.questions.length ? currentAnswers : new Array(q.questions.length).fill(0)
  );
  const [showError, setShowError] = useState(false);

  const setAnswer = (qIdx: number, value: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[qIdx] = value;
      return next;
    });
    setShowError(false);
  };

  const unanswered = answers.filter((a) => a === 0).length;

  const handleSubmit = () => {
    if (unanswered > 0) {
      setShowError(true);
      const firstUnanswered = document.querySelector('[data-unanswered="true"]');
      firstUnanswered?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onSubmit(answers);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-1">{q.title}</h2>
      <p className="text-muted-foreground text-sm mb-2">
        لطفاً به هر سوال پاسخ دهید
      </p>

      {showError && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 mb-6 text-destructive text-sm">
          {unanswered} سوال بی‌پاسخ وجود دارد. لطفاً به همه سوال‌ها پاسخ دهید.
        </div>
      )}

      {/* Scale legend */}
      <div className="bg-muted/40 rounded-xl p-4 mb-6 border border-border/50">
        <p className="text-xs text-muted-foreground mb-2 font-medium">مقیاس پاسخ‌ها:</p>
        <div className="flex flex-wrap gap-2">
          {q.scale.map((label, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-xs bg-background border border-border rounded-full px-3 py-1">
              <span className="font-semibold text-primary">{i + 1}</span>
              <span className="text-foreground">{label}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {q.questions.map((question, qIdx) => {
          const isUnanswered = answers[qIdx] === 0;
          return (
            <div
              key={qIdx}
              data-unanswered={isUnanswered && showError ? "true" : "false"}
              className={`bg-card border rounded-xl p-4 transition-all ${
                isUnanswered && showError ? "border-destructive/50 bg-destructive/5" : "border-border"
              }`}
            >
              <div className="flex gap-3 mb-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  {qIdx + 1}
                </span>
                <p className="text-sm md:text-base font-medium text-foreground leading-relaxed pt-0.5">
                  {question}
                </p>
              </div>
              <div className={`grid gap-2 ${q.scale.length <= 3 ? "grid-cols-3" : "grid-cols-5"}`}>
                {q.scale.map((label, optIdx) => {
                  const value = optIdx + 1;
                  const selected = answers[qIdx] === value;
                  return (
                    <button
                      key={optIdx}
                      data-testid={`radio-q${questionnaireIndex + 1}-${qIdx + 1}-${value}`}
                      onClick={() => setAnswer(qIdx, value)}
                      className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 md:p-3 cursor-pointer transition-all text-center ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background hover:border-primary/40 hover:bg-muted/50"
                      }`}
                    >
                      <span className={`text-base font-bold ${selected ? "text-primary" : "text-muted-foreground"}`}>
                        {value}
                      </span>
                      <span className="text-[10px] md:text-xs leading-tight text-center">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex justify-between items-center">
        <Button variant="outline" onClick={onBack} data-testid="button-back">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          مرحله قبل
        </Button>
        <Button
          size="lg"
          onClick={handleSubmit}
          data-testid="button-next-questionnaire"
          className="px-10"
        >
          {questionnaireIndex === 6 ? "ثبت نهایی" : "مرحله بعد"}
          {questionnaireIndex < 6 && (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 rotate-180"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function Survey() {
  const [, setLocation] = useLocation();
  const { state, setDemographics, setQuestionnaireAnswers, nextStep, prevStep } = useSurvey();
  const { toast } = useToast();
  const createSubmission = useCreateSubmission();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.currentStep]);

  const handleDemographicsSubmit = (data: Demographics) => {
    setDemographics(data);
    nextStep();
  };

  const handleQuestionnaireSubmit = async (qIndex: number, answers: number[]) => {
    setQuestionnaireAnswers(qIndex + 1, answers);

    if (qIndex === 6) {
      // Final step — submit
      const payload = {
        demographics: state.demographics!,
        questionnaire1: state.questionnaire1,
        questionnaire2: state.questionnaire2,
        questionnaire3: state.questionnaire3,
        questionnaire4: state.questionnaire4,
        questionnaire5: state.questionnaire5,
        questionnaire6: state.questionnaire6,
        questionnaire7: answers, // use current answers since state not updated yet
      };

      createSubmission.mutate(
        { data: payload },
        {
          onSuccess: () => {
            setLocation("/thank-you");
          },
          onError: () => {
            toast({
              variant: "destructive",
              title: "خطا در ثبت اطلاعات",
              description: "لطفاً دوباره تلاش کنید",
            });
          },
        }
      );
    } else {
      nextStep();
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background py-6 px-4 md:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-primary">پژوهش عوامل روانشناختی ورزشکاران مازندرانی</h1>
        </div>

        {/* Progress */}
        <ProgressBar currentStep={state.currentStep} />

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-md p-6 md:p-8">
          {state.currentStep === 0 ? (
            <DemographicsStep onSubmit={handleDemographicsSubmit} />
          ) : (
            <QuestionnaireStep
              questionnaireIndex={state.currentStep - 1}
              currentAnswers={(state as Record<string, number[]>)[`questionnaire${state.currentStep}`] ?? []}
              onSubmit={(answers) => handleQuestionnaireSubmit(state.currentStep - 1, answers)}
              onBack={prevStep}
            />
          )}

          {createSubmission.isPending && (
            <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
              <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-xl">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-foreground font-medium">در حال ثبت اطلاعات...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
