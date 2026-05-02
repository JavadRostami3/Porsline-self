import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useSurvey } from "@/context/survey-context";
import { useEffect } from "react";

export default function ThankYou() {
  const { reset } = useSurvey();

  useEffect(() => {
    reset();
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-background">
      <div className="max-w-xl w-full bg-card border border-border rounded-2xl shadow-xl p-10 text-center animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <path d="m9 11 3 3L22 4"/>
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-4">
          با تشکر از مشارکت شما
        </h1>

        <p className="text-muted-foreground text-lg leading-relaxed mb-2">
          پاسخ‌های شما با موفقیت ثبت شد.
        </p>
        <p className="text-muted-foreground text-base leading-relaxed mb-8">
          مشارکت شما در این پژوهش علمی بسیار ارزشمند است و به پیشرفت دانش ورزشی مازندران کمک می‌کند.
        </p>

        <div className="bg-muted/50 rounded-xl p-4 mb-8 border border-border/50">
          <p className="text-sm text-muted-foreground">
            اطلاعات شما به صورت محرمانه نگهداری شده و تنها برای اهداف پژوهشی مورد استفاده قرار می‌گیرد.
          </p>
        </div>

        <Link href="/">
          <Button variant="outline" size="lg" data-testid="button-home" className="px-8">
            بازگشت به صفحه اصلی
          </Button>
        </Link>
      </div>
    </div>
  );
}
