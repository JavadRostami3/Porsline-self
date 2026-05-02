import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useListAdminSubmissions, getListAdminSubmissionsQueryKey } from "@workspace/api-client-react";
import AdminLayout from "@/components/admin-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminSubmissions() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [sportFilter, setSportFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ sport: "", city: "" });

  const { data, isLoading, error } = useListAdminSubmissions(
    {
      page,
      limit: 20,
      ...(appliedFilters.sport ? { sport: appliedFilters.sport } : {}),
      ...(appliedFilters.city ? { city: appliedFilters.city } : {}),
    },
    {
      query: {
        queryKey: getListAdminSubmissionsQueryKey({
          page,
          limit: 20,
          sport: appliedFilters.sport || undefined,
          city: appliedFilters.city || undefined,
        }),
      },
    }
  );

  useEffect(() => {
    if (error && (error as { status?: number }).status === 401) {
      setLocation("/admin/login");
    }
  }, [error]);

  const applyFilters = () => {
    setAppliedFilters({ sport: sportFilter, city: cityFilter });
    setPage(1);
  };

  const clearFilters = () => {
    setSportFilter("");
    setCityFilter("");
    setAppliedFilters({ sport: "", city: "" });
    setPage(1);
  };

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">فهرست پاسخ دهندگان</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {data ? `${data.total} نفر در پژوهش شرکت کرده‌اند` : "در حال بارگذاری..."}
            </p>
          </div>
          <button
            onClick={handleExport}
            data-testid="button-export-submissions"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
            خروجی CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-32">
            <label className="text-xs text-muted-foreground mb-1 block">فیلتر رشته ورزشی</label>
            <Input
              data-testid="input-filter-sport"
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              placeholder="مثال: فوتبال"
              className="text-sm"
            />
          </div>
          <div className="flex-1 min-w-32">
            <label className="text-xs text-muted-foreground mb-1 block">فیلتر شهر</label>
            <Input
              data-testid="input-filter-city"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="مثال: ساری"
              className="text-sm"
            />
          </div>
          <Button size="sm" onClick={applyFilters} data-testid="button-apply-filters">اعمال فیلتر</Button>
          {(appliedFilters.sport || appliedFilters.city) && (
            <Button size="sm" variant="outline" onClick={clearFilters} data-testid="button-clear-filters">پاکسازی</Button>
          )}
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : data?.submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <p>هیچ داده‌ای یافت نشد</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      <th className="px-4 py-3 text-right font-semibold text-foreground">#</th>
                      <th className="px-4 py-3 text-right font-semibold text-foreground">نام و نام خانوادگی</th>
                      <th className="px-4 py-3 text-right font-semibold text-foreground">سن</th>
                      <th className="px-4 py-3 text-right font-semibold text-foreground">رشته ورزشی</th>
                      <th className="px-4 py-3 text-right font-semibold text-foreground">شهر</th>
                      <th className="px-4 py-3 text-right font-semibold text-foreground">تاریخ ثبت</th>
                      <th className="px-4 py-3 text-right font-semibold text-foreground">جزئیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.submissions.map((s, i) => (
                      <tr
                        key={s.id}
                        data-testid={`row-submission-${s.id}`}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-muted-foreground">{(page - 1) * 20 + i + 1}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{s.fullName}</td>
                        <td className="px-4 py-3 text-foreground">{s.age}</td>
                        <td className="px-4 py-3 text-foreground">{s.sport}</td>
                        <td className="px-4 py-3 text-foreground">{s.city}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {new Date(s.submittedAt).toLocaleDateString("fa-IR")}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/submissions/${s.id}`}
                            data-testid={`link-submission-${s.id}`}
                            className="text-primary hover:underline text-xs font-medium"
                          >
                            مشاهده
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    data-testid="button-prev-page"
                  >
                    قبلی
                  </Button>
                  <span className="text-sm text-muted-foreground px-3">
                    صفحه {page} از {data.totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    data-testid="button-next-page"
                  >
                    بعدی
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
