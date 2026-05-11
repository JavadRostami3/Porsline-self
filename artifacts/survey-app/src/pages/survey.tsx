import { useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useSurvey, type Demographics } from "@/context/survey-context";
import { questionnaires } from "@/data/questionnaires";
import { useCreateSubmission } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// ─── Shared helpers ──────────────────────────────────────────────────────────

function TapCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full py-4 px-5 rounded-2xl border-2 text-base font-medium text-right transition-all active:scale-[.97] ${
        selected
          ? "border-primary bg-primary text-primary-foreground shadow-md"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/40"
      }`}
    >
      {label}
    </button>
  );
}

function StepHeader({
  title,
  subtitle,
  current,
  total,
  onBack,
}: {
  title: string;
  subtitle?: string;
  current: number;
  total: number;
  onBack?: () => void;
}) {
  const pct = (current / total) * 100;
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground active:opacity-60 transition-opacity"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
            قبلی
          </button>
        ) : (
          <span />
        )}
        <span className="text-xs font-medium text-muted-foreground" dir="ltr">
          {current} / {total}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <h2 className="text-2xl font-bold text-foreground leading-tight">{title}</h2>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}

function NextButton({
  onClick,
  disabled,
  label = "بعدی",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full mt-6 py-4 rounded-2xl text-base font-semibold bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed active:scale-[.98] transition-all shadow-sm"
    >
      {label}
    </button>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-destructive text-xs mt-1.5 font-medium">{msg}</p>;
}

// ─── Demographics sub-steps ──────────────────────────────────────────────────

const DEMO_TOTAL = 8;

type DemoForm = Partial<Demographics>;

function DemoStep0({
  form,
  update,
  onNext,
}: {
  form: DemoForm;
  update: (k: keyof Demographics, v: string | number) => void;
  onNext: () => void;
}) {
  const [err, setErr] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const next = () => {
    if (!form.fullName?.trim()) { setErr("نام و نام خانوادگی الزامی است"); return; }
    onNext();
  };

  return (
    <div>
      <StepHeader title="نام و نام خانوادگی" current={1} total={DEMO_TOTAL} />
      <input
        ref={ref}
        type="text"
        value={form.fullName ?? ""}
        onChange={(e) => { update("fullName", e.target.value); setErr(""); }}
        placeholder="مثال: علی محمدی"
        className="w-full py-4 px-4 rounded-2xl border-2 border-border bg-card text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
        onKeyDown={(e) => e.key === "Enter" && next()}
      />
      <FieldError msg={err} />
      <NextButton onClick={next} disabled={!form.fullName?.trim()} />
    </div>
  );
}

function DemoStep1({
  form,
  update,
  onNext,
  onBack,
}: {
  form: DemoForm;
  update: (k: keyof Demographics, v: string | number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [err, setErr] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const next = () => {
    const n = Number(form.age);
    if (!form.age || n < 10 || n > 80) { setErr("یک سن معتبر وارد کنید"); return; }
    onNext();
  };

  return (
    <div>
      <StepHeader title="سن شما چند سال است؟" current={2} total={DEMO_TOTAL} onBack={onBack} />
      <input
        ref={ref}
        type="number"
        inputMode="numeric"
        value={form.age ?? ""}
        onChange={(e) => { update("age", Number(e.target.value)); setErr(""); }}
        placeholder="مثال: ۲۴"
        className="w-full py-4 px-4 rounded-2xl border-2 border-border bg-card text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
        onKeyDown={(e) => e.key === "Enter" && next()}
      />
      <FieldError msg={err} />
      <NextButton onClick={next} disabled={!form.age} />
    </div>
  );
}

function DemoStep2({
  form,
  update,
  onNext,
  onBack,
}: {
  form: DemoForm;
  update: (k: keyof Demographics, v: string | number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const genders = ["مرد", "زن"];
  const groups = ["نوجوانان", "جوانان", "بزرگسالان"];
  const ready = form.gender && form.competitionAgeGroup;

  return (
    <div>
      <StepHeader title="جنسیت و رده سنی" current={3} total={DEMO_TOTAL} onBack={onBack} />

      <p className="text-sm font-semibold text-foreground mb-3">جنسیت</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {genders.map((g) => (
          <TapCard key={g} label={g} selected={form.gender === g} onClick={() => update("gender", g)} />
        ))}
      </div>

      <p className="text-sm font-semibold text-foreground mb-3">رده سنی رقابت</p>
      <div className="grid grid-cols-1 gap-3">
        {groups.map((g) => (
          <TapCard key={g} label={g} selected={form.competitionAgeGroup === g} onClick={() => update("competitionAgeGroup", g)} />
        ))}
      </div>

      <NextButton onClick={onNext} disabled={!ready} />
    </div>
  );
}

function DemoStep3({
  form,
  update,
  onNext,
  onBack,
}: {
  form: DemoForm;
  update: (k: keyof Demographics, v: string | number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [errs, setErrs] = useState<Record<string, string>>({});

  const next = () => {
    const e: Record<string, string> = {};
    if (!form.height || Number(form.height) < 100 || Number(form.height) > 250) e.height = "قد معتبر وارد کنید";
    if (!form.weight || Number(form.weight) < 30 || Number(form.weight) > 200) e.weight = "وزن معتبر وارد کنید";
    if (Object.keys(e).length) { setErrs(e); return; }
    onNext();
  };

  return (
    <div>
      <StepHeader title="قد و وزن" current={4} total={DEMO_TOTAL} onBack={onBack} />

      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-foreground block mb-2">قد (سانتیمتر)</label>
          <input
            type="number"
            inputMode="numeric"
            value={form.height ?? ""}
            onChange={(e) => { update("height", Number(e.target.value)); setErrs((p) => ({ ...p, height: "" })); }}
            placeholder="مثال: ۱۷۵"
            className="w-full py-4 px-4 rounded-2xl border-2 border-border bg-card text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          <FieldError msg={errs.height} />
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground block mb-2">وزن (کیلوگرم)</label>
          <input
            type="number"
            inputMode="numeric"
            value={form.weight ?? ""}
            onChange={(e) => { update("weight", Number(e.target.value)); setErrs((p) => ({ ...p, weight: "" })); }}
            placeholder="مثال: ۷۰"
            className="w-full py-4 px-4 rounded-2xl border-2 border-border bg-card text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          <FieldError msg={errs.weight} />
        </div>
      </div>

      <NextButton onClick={next} disabled={!form.height || !form.weight} />
    </div>
  );
}

function DemoStep4({
  form,
  update,
  onNext,
  onBack,
}: {
  form: DemoForm;
  update: (k: keyof Demographics, v: string | number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [cityErr, setCityErr] = useState("");
  const statuses = ["مجرد", "متأهل", "مطلقه"];
  const ready = form.city?.trim() && form.maritalStatus;

  const next = () => {
    if (!form.city?.trim()) { setCityErr("شهر الزامی است"); return; }
    if (!form.maritalStatus) return;
    onNext();
  };

  return (
    <div>
      <StepHeader title="شهر و وضعیت تأهل" current={5} total={DEMO_TOTAL} onBack={onBack} />

      <div className="mb-6">
        <label className="text-sm font-semibold text-foreground block mb-2">شهر</label>
        <input
          type="text"
          value={form.city ?? ""}
          onChange={(e) => { update("city", e.target.value); setCityErr(""); }}
          placeholder="نام شهر"
          className="w-full py-4 px-4 rounded-2xl border-2 border-border bg-card text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />
        <FieldError msg={cityErr} />
      </div>

      <p className="text-sm font-semibold text-foreground mb-3">وضعیت تأهل</p>
      <div className="grid grid-cols-1 gap-3">
        {statuses.map((s) => (
          <TapCard key={s} label={s} selected={form.maritalStatus === s} onClick={() => update("maritalStatus", s)} />
        ))}
      </div>

      <NextButton onClick={next} disabled={!ready} />
    </div>
  );
}

function DemoStep5({
  form,
  update,
  onNext,
  onBack,
}: {
  form: DemoForm;
  update: (k: keyof Demographics, v: string | number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [errs, setErrs] = useState<Record<string, string>>({});

  const next = () => {
    const e: Record<string, string> = {};
    if (!form.sport?.trim()) e.sport = "رشته ورزشی الزامی است";
    if (!form.yearsOfExperience || Number(form.yearsOfExperience) < 0) e.years = "سابقه ورزشی معتبر وارد کنید";
    if (Object.keys(e).length) { setErrs(e); return; }
    onNext();
  };

  return (
    <div>
      <StepHeader title="رشته ورزشی" current={6} total={DEMO_TOTAL} onBack={onBack} />

      <div className="space-y-5">
        <div>
          <label className="text-sm font-semibold text-foreground block mb-2">رشته ورزشی</label>
          <input
            type="text"
            value={form.sport ?? ""}
            onChange={(e) => { update("sport", e.target.value); setErrs((p) => ({ ...p, sport: "" })); }}
            placeholder="مثال: فوتبال، کشتی، تکواندو"
            className="w-full py-4 px-4 rounded-2xl border-2 border-border bg-card text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          <FieldError msg={errs.sport} />
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground block mb-2">سابقه ورزشی (سال)</label>
          <input
            type="number"
            inputMode="numeric"
            value={form.yearsOfExperience ?? ""}
            onChange={(e) => { update("yearsOfExperience", Number(e.target.value)); setErrs((p) => ({ ...p, years: "" })); }}
            placeholder="مثال: ۱۰"
            className="w-full py-4 px-4 rounded-2xl border-2 border-border bg-card text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          <FieldError msg={errs.years} />
        </div>
      </div>

      <NextButton onClick={next} disabled={!form.sport?.trim() || form.yearsOfExperience === undefined} />
    </div>
  );
}

function DemoStep6({
  form,
  update,
  onNext,
  onBack,
}: {
  form: DemoForm;
  update: (k: keyof Demographics, v: string | number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const yesNo = ["بله", "خیر"];
  const ready = form.nationalTeamHistory && form.premierLeagueHistory && form.firstLeagueHistory;

  return (
    <div>
      <StepHeader title="سابقه حضور در تیم‌ها" current={7} total={DEMO_TOTAL} onBack={onBack} />

      {(
        [
          { label: "سابقه عضویت در تیم ملی", key: "nationalTeamHistory" },
          { label: "سابقه عضویت در لیگ برتر", key: "premierLeagueHistory" },
          { label: "سابقه عضویت در لیگ دسته اول", key: "firstLeagueHistory" },
        ] as { label: string; key: keyof Demographics }[]
      ).map(({ label, key }) => (
        <div key={key} className="mb-5">
          <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
          <div className="grid grid-cols-2 gap-3">
            {yesNo.map((v) => (
              <TapCard key={v} label={v} selected={form[key] === v} onClick={() => update(key, v)} />
            ))}
          </div>
        </div>
      ))}

      <NextButton onClick={onNext} disabled={!ready} />
    </div>
  );
}

function DemoStep7({
  form,
  update,
  onNext,
  onBack,
}: {
  form: DemoForm;
  update: (k: keyof Demographics, v: string | number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const yesNo = ["بله", "خیر"];
  const ready =
    form.injuryHistory &&
    form.physiotherapyTreatment &&
    form.surgerHistory &&
    (form.injuryHistory !== "بله" || form.timeSinceLastInjury?.trim());

  return (
    <div>
      <StepHeader title="سابقه آسیب‌دیدگی" current={8} total={DEMO_TOTAL} onBack={onBack} />

      <div className="mb-5">
        <p className="text-sm font-semibold text-foreground mb-2">سابقه آسیب دیدگی</p>
        <div className="grid grid-cols-2 gap-3">
          {yesNo.map((v) => (
            <TapCard key={v} label={v} selected={form.injuryHistory === v} onClick={() => update("injuryHistory", v)} />
          ))}
        </div>
      </div>

      {form.injuryHistory === "بله" && (
        <div className="mb-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="text-sm font-semibold text-foreground block mb-2">
            چند وقت از آخرین آسیب می‌گذرد؟
          </label>
          <input
            type="text"
            value={form.timeSinceLastInjury ?? ""}
            onChange={(e) => update("timeSinceLastInjury", e.target.value)}
            placeholder="مثال: ۶ ماه، ۲ سال"
            className="w-full py-4 px-4 rounded-2xl border-2 border-border bg-card text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      )}

      <div className="mb-5">
        <p className="text-sm font-semibold text-foreground mb-2">درمان با فیزیوتراپی</p>
        <div className="grid grid-cols-2 gap-3">
          {yesNo.map((v) => (
            <TapCard key={v} label={v} selected={form.physiotherapyTreatment === v} onClick={() => update("physiotherapyTreatment", v)} />
          ))}
        </div>
      </div>

      <div className="mb-5">
        <p className="text-sm font-semibold text-foreground mb-2">سابقه جراحی آسیب‌دیدگی</p>
        <div className="grid grid-cols-2 gap-3">
          {yesNo.map((v) => (
            <TapCard key={v} label={v} selected={form.surgerHistory === v} onClick={() => update("surgerHistory", v)} />
          ))}
        </div>
      </div>

      <div className="mb-5">
        <label className="text-sm font-medium text-muted-foreground block mb-2">آسیب‌ها را ذکر کنید (اختیاری)</label>
        <Textarea
          value={form.injuryDetails ?? ""}
          onChange={(e) => update("injuryDetails", e.target.value)}
          placeholder="توضیح مختصر درباره آسیب‌های قبلی"
          rows={3}
          className="rounded-2xl resize-none"
        />
      </div>

      <NextButton onClick={onNext} disabled={!ready} label="شروع پرسشنامه‌ها" />
    </div>
  );
}

// ─── Demographics container ───────────────────────────────────────────────────

function DemographicsFlow({ onComplete }: { onComplete: (d: Demographics) => void }) {
  const [subStep, setSubStep] = useState(0);
  const [form, setForm] = useState<DemoForm>({});

  const update = (k: keyof Demographics, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const next = () => { window.scrollTo({ top: 0, behavior: "smooth" }); setSubStep((s) => s + 1); };
  const back = () => { window.scrollTo({ top: 0, behavior: "smooth" }); setSubStep((s) => Math.max(0, s - 1)); };

  const props = { form, update, onNext: next, onBack: back };

  const submit = () => onComplete(form as Demographics);

  const steps = [
    <DemoStep0 key={0} form={form} update={update} onNext={next} />,
    <DemoStep1 key={1} {...props} />,
    <DemoStep2 key={2} {...props} />,
    <DemoStep3 key={3} {...props} />,
    <DemoStep4 key={4} {...props} />,
    <DemoStep5 key={5} {...props} />,
    <DemoStep6 key={6} {...props} />,
    <DemoStep7 key={7} form={form} update={update} onNext={submit} onBack={back} />,
  ];

  return <>{steps[subStep]}</>;
}

// ─── Questionnaire step ───────────────────────────────────────────────────────

function QuestionnaireFlow({
  qIndex,
  savedAnswers,
  onComplete,
  onBack,
}: {
  qIndex: number;
  savedAnswers: number[];
  onComplete: (answers: number[]) => void;
  onBack: () => void;
}) {
  const q = questionnaires[qIndex];
  const total = q.questions.length;
  const [answers, setAnswers] = useState<number[]>(
    savedAnswers.length === total ? savedAnswers : new Array(total).fill(0)
  );
  const [current, setCurrent] = useState(0);
  const [animDir, setAnimDir] = useState<"in" | "out">("in");
  const [visible, setVisible] = useState(true);

  const goTo = (idx: number) => {
    setVisible(false);
    setTimeout(() => {
      setCurrent(idx);
      setVisible(true);
    }, 150);
  };

  const selectAnswer = (value: number) => {
    const next = [...answers];
    next[current] = value;
    setAnswers(next);

    // auto-advance after short delay
    if (current < total - 1) {
      setTimeout(() => goTo(current + 1), 300);
    } else {
      // last question — check all answered
      const unanswered = next.filter((a) => a === 0).length;
      if (unanswered === 0) {
        setTimeout(() => onComplete(next), 400);
      } else {
        // jump to first unanswered
        const firstBlank = next.findIndex((a) => a === 0);
        setTimeout(() => goTo(firstBlank), 300);
      }
    }
  };

  const prevQuestion = () => {
    if (current > 0) goTo(current - 1);
    else onBack();
  };

  const question = q.questions[current];
  const answered = answers[current];
  const answeredCount = answers.filter((a) => a > 0).length;

  // show "finish" button if all answered but on last question
  const allAnswered = answers.every((a) => a > 0);

  return (
    <div className="flex flex-col min-h-0">
      {/* Single inner header: back button + question counter only */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevQuestion}
            className="flex items-center gap-1.5 text-sm text-muted-foreground active:opacity-60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
            قبلی
          </button>
          <span className="text-sm font-semibold text-foreground" dir="ltr">
            {current + 1} / {total}
          </span>
        </div>

        {/* The ONE and only progress bar on this screen */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((current + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div
        className={`transition-all duration-150 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
      >
        <div className="bg-card border border-border rounded-2xl p-5 mb-6 min-h-24 flex items-center">
          <p className="text-lg font-medium text-foreground leading-relaxed">
            {question}
          </p>
        </div>

        {/* Scale options */}
        <div className={`grid gap-3 ${q.scale.length <= 3 ? "grid-cols-1" : "grid-cols-1"}`}>
          {q.scale.map((label, i) => {
            const value = i + 1;
            const sel = answered === value;
            return (
              <button
                key={i}
                type="button"
                onClick={() => selectAnswer(value)}
                className={`w-full flex items-center gap-4 py-4 px-5 rounded-2xl border-2 text-right transition-all active:scale-[.97] ${
                  sel
                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                    : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/40"
                }`}
              >
                <span
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                    sel ? "border-primary-foreground bg-primary-foreground/20 text-primary-foreground" : "border-border text-muted-foreground"
                  }`}
                >
                  {value}
                </span>
                <span className="text-base font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation dots */}
      <div className="mt-6 flex justify-center gap-1.5 flex-wrap">
        {q.questions.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all ${
              i === current
                ? "w-5 h-2 bg-primary"
                : answers[i] > 0
                ? "w-2 h-2 bg-primary/40"
                : "w-2 h-2 bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Finish button if all answered */}
      {allAnswered && (
        <button
          type="button"
          onClick={() => onComplete(answers)}
          className="w-full mt-5 py-4 rounded-2xl text-base font-semibold bg-primary text-primary-foreground active:scale-[.98] transition-all shadow-sm animate-in fade-in duration-300"
        >
          {qIndex === questionnaires.length - 1 ? "ثبت نهایی" : "مرحله بعد"}
        </button>
      )}
    </div>
  );
}

// ─── Main survey page ─────────────────────────────────────────────────────────

const SECTION_LABELS = [
  "اطلاعات فردی",
  "پرخاشگری",
  "تحلیل رفتگی",
  "اعتیاد به تمرین",
  "اضطراب رقابتی",
  "سرسختی ذهنی",
  "حالات خلقی",
  "انگیزه مشارکت",
];

// Top bar: pure text context — zero bars, zero pills — never competes with inner progress
function SurveyTopBar({ step }: { step: number }) {
  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between gap-3">
      {/* Section label on the right (RTL start) */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold" dir="ltr">
          {step + 1}
        </span>
        <span className="text-sm font-bold text-foreground truncate">{SECTION_LABELS[step]}</span>
      </div>
      {/* Steps mini-dots on the left (RTL end) — circles, clearly NOT a bar */}
      <div className="flex-shrink-0 flex gap-1">
        {SECTION_LABELS.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i < step
                ? "w-1.5 h-1.5 bg-primary/50"
                : i === step
                ? "w-2 h-2 bg-primary"
                : "w-1.5 h-1.5 bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Survey() {
  const [, setLocation] = useLocation();
  const { state, setDemographics, setQuestionnaireAnswers, nextStep, prevStep } = useSurvey();
  const { toast } = useToast();
  const createSubmission = useCreateSubmission();
  // useRef guard — persists across renders, prevents double-submission
  const hasSubmittedRef = useRef(false);

  const handleDemographicsComplete = (data: Demographics) => {
    setDemographics(data);
    nextStep();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleQuestionnaireComplete = (qIdx: number, answers: number[]) => {
    setQuestionnaireAnswers(qIdx + 1, answers);

    if (qIdx === 6) {
      // Guard: prevent double submission from double-click or React timing
      if (hasSubmittedRef.current || createSubmission.isPending) return;
      hasSubmittedRef.current = true;
      const payload = {
        demographics: state.demographics!,
        questionnaire1: state.questionnaire1,
        questionnaire2: state.questionnaire2,
        questionnaire3: state.questionnaire3,
        questionnaire4: state.questionnaire4,
        questionnaire5: state.questionnaire5,
        questionnaire6: state.questionnaire6,
        questionnaire7: answers,
      };
      createSubmission.mutate(
        { data: payload },
        {
          onSuccess: (data) => {
            // Store scores in sessionStorage for the results page
            const resp = data as unknown as Record<string, unknown>;
            if (resp?.scores) {
              sessionStorage.setItem("survey_scores", JSON.stringify(resp.scores));
              sessionStorage.setItem("survey_name", state.demographics?.fullName ?? "");
              setLocation("/results");
            } else {
              setLocation("/thank-you");
            }
          },
          onError: () =>
            toast({
              variant: "destructive",
              title: "خطا در ثبت",
              description: "لطفاً دوباره تلاش کنید",
            }),
        }
      );
    } else {
      nextStep();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleQuestionnairBack = () => {
    prevStep();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <SurveyTopBar step={state.currentStep} />

      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {state.currentStep === 0 ? (
          <DemographicsFlow onComplete={handleDemographicsComplete} />
        ) : (
          <QuestionnaireFlow
            key={state.currentStep}
            qIndex={state.currentStep - 1}
            savedAnswers={(state as unknown as Record<string, number[]>)[`questionnaire${state.currentStep}`] ?? []}
            onComplete={(answers) => handleQuestionnaireComplete(state.currentStep - 1, answers)}
            onBack={handleQuestionnairBack}
          />
        )}
      </div>

      {createSubmission.isPending && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-3xl p-8 text-center shadow-2xl w-72">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-foreground font-semibold">در حال ثبت اطلاعات...</p>
            <p className="text-muted-foreground text-sm mt-1">لطفاً صبر کنید</p>
          </div>
        </div>
      )}
    </div>
  );
}
