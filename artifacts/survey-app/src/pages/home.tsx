import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      <div className="max-w-3xl w-full bg-card border border-border rounded-2xl shadow-xl p-8 md:p-12 z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
            پرسشنامه عوامل روانشناختی<br/>موثر بر عملکرد ورزشی
          </h1>
          
          <div className="h-1 w-24 bg-primary/20 rounded-full my-4"></div>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed text-justify">
            پژوهش حاضر با هدف بررسی عوامل روانشناختی موثر بر عملکرد ورزشی ورزشکاران مرد استان مازندران طراحی شده است. مشارکت شما در این طرح پژوهشی کمک شایانی به درک بهتر این عوامل و ارتقاء سطح ورزشکاران خواهد کرد.
          </p>
          
          <div className="bg-muted/50 p-6 rounded-xl w-full text-right mt-6 border border-border/50">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              نکات مهم پیش از شروع:
            </h3>
            <ul className="space-y-3 text-muted-foreground list-disc list-inside mr-2 text-sm md:text-base">
              <li>اطلاعات شما کاملاً محرمانه باقی خواهد ماند و تنها برای اهداف پژوهشی استفاده می‌شود.</li>
              <li>پاسخگویی به این پرسشنامه حدود ۱۵ تا ۲۰ دقیقه زمان می‌برد.</li>
              <li>لطفاً در پاسخگویی کمال صداقت را داشته باشید، زیرا پاسخ‌های واقعی شما ارزش علمی این پژوهش را تضمین می‌کند.</li>
              <li>این پرسشنامه دارای ۸ بخش مجزا می‌باشد که پس از تکمیل هر بخش می‌توانید وارد بخش بعدی شوید.</li>
            </ul>
          </div>
          
          <div className="pt-8 w-full">
            <Link href="/survey" className="w-full block">
              <Button size="lg" className="w-full md:w-auto md:px-16 py-6 text-lg font-medium shadow-md hover:shadow-lg transition-all rounded-xl">
                شروع پرسشنامه
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 rotate-180"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="mt-12 text-sm text-muted-foreground/60 z-10 flex items-center gap-4">
        <span>پژوهش روانشناسی ورزشی • استان مازندران</span>
        <span className="w-1 h-1 bg-border rounded-full"></span>
        <Link href="/admin/login" className="hover:text-primary transition-colors">ورود پژوهشگر</Link>
      </div>
    </div>
  );
}
