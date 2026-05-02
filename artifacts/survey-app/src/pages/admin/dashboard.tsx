import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGetAdminStats } from "@workspace/api-client-react";
import AdminLayout from "@/components/admin-layout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(172,66%,30%)", "hsl(199,89%,48%)", "hsl(150,60%,45%)", "hsl(43,74%,66%)", "hsl(27,87%,67%)", "hsl(280,60%,55%)", "hsl(340,60%,50%)"];

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5" data-testid={`stat-${label}`}>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

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
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  const handleExport = () => {
    const link = document.createElement("a");
    fetch("/api/admin/export", { credentials: "include" })
      .then((r) => r.blob())
      .then((blob) => {
        link.href = URL.createObjectURL(blob);
        link.download = `survey-export-${Date.now()}.csv`;
        link.click();
      });
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="کل شرکت‌کنندگان" value={stats?.totalSubmissions ?? 0} />
          <StatCard label="این هفته" value={stats?.totalThisWeek ?? 0} />
          <StatCard label="این ماه" value={stats?.totalThisMonth ?? 0} />
          <StatCard label="میانگین سن" value={stats ? `${stats.avgAge.toFixed(1)} سال` : "-"} />
          <StatCard label="میانگین سابقه" value={stats ? `${stats.avgYearsExperience.toFixed(1)} سال` : "-"} sub="سابقه ورزشی" />
          <StatCard label="نرخ آسیب‌دیدگی" value={stats ? `${(stats.injuryRate * 100).toFixed(0)}٪` : "-"} />
          <StatCard label="نرخ تیم ملی" value={stats ? `${(stats.nationalTeamRate * 100).toFixed(0)}٪` : "-"} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Sport breakdown */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">توزیع رشته‌های ورزشی</h3>
            {stats?.sportBreakdown && stats.sportBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.sportBreakdown.slice(0, 7)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(160,20%,90%)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fontFamily: "Vazirmatn" }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(172,66%,30%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">داده‌ای موجود نیست</p>
            )}
          </div>

          {/* City breakdown */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">توزیع شهرها</h3>
            {stats?.cityBreakdown && stats.cityBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.cityBreakdown.slice(0, 7)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(160,20%,90%)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fontFamily: "Vazirmatn" }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(199,89%,48%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">داده‌ای موجود نیست</p>
            )}
          </div>

          {/* Age group breakdown */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">رده‌های سنی</h3>
            {stats?.ageGroupBreakdown && stats.ageGroupBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.ageGroupBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    dataKey="count"
                    nameKey="label"
                    label={({ label, percent }) => `${label} (${(percent * 100).toFixed(0)}٪)`}
                    labelLine={false}
                  >
                    {stats.ageGroupBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} نفر`, "تعداد"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">داده‌ای موجود نیست</p>
            )}
          </div>

          {/* Marital status breakdown */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">وضعیت تأهل</h3>
            {stats?.maritalStatusBreakdown && stats.maritalStatusBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.maritalStatusBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    dataKey="count"
                    nameKey="label"
                    label={({ label, percent }) => `${label} (${(percent * 100).toFixed(0)}٪)`}
                    labelLine={false}
                  >
                    {stats.maritalStatusBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} نفر`, "تعداد"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">داده‌ای موجود نیست</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
