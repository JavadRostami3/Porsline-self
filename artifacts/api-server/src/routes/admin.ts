import { Router, type IRouter } from "express";
import { db, submissionsTable } from "@workspace/db";
import {
  AdminLoginBody,
  ListAdminSubmissionsQueryParams,
  GetAdminSubmissionParams,
} from "@workspace/api-zod";
import { eq, sql, count, avg, gte, and, ilike } from "drizzle-orm";
import { formatSubmission } from "./submissions";

const router: IRouter = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin1234";
const ADMIN_SESSION_COOKIE = "admin_session";
const ADMIN_SESSION_TOKEN = "authenticated";

function isAdminAuthenticated(req: import("express").Request): boolean {
  return req.cookies?.[ADMIN_SESSION_COOKIE] === ADMIN_SESSION_TOKEN;
}

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  res.cookie(ADMIN_SESSION_COOKIE, ADMIN_SESSION_TOKEN, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ success: true });
});

router.post("/admin/logout", async (req, res): Promise<void> => {
  res.clearCookie(ADMIN_SESSION_COOKIE);
  res.json({ success: true });
});

router.get("/admin/stats", async (req, res): Promise<void> => {
  if (!isAdminAuthenticated(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalResult] = await db.select({ count: count() }).from(submissionsTable);
  const [weekResult] = await db
    .select({ count: count() })
    .from(submissionsTable)
    .where(gte(submissionsTable.submittedAt, oneWeekAgo));
  const [monthResult] = await db
    .select({ count: count() })
    .from(submissionsTable)
    .where(gte(submissionsTable.submittedAt, oneMonthAgo));

  const [avgResult] = await db
    .select({
      avgAge: avg(submissionsTable.age),
      avgYears: avg(submissionsTable.yearsOfExperience),
    })
    .from(submissionsTable);

  const sportRows = await db
    .select({ label: submissionsTable.sport, cnt: count() })
    .from(submissionsTable)
    .groupBy(submissionsTable.sport)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  const cityRows = await db
    .select({ label: submissionsTable.city, cnt: count() })
    .from(submissionsTable)
    .groupBy(submissionsTable.city)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  const ageGroupRows = await db
    .select({ label: submissionsTable.competitionAgeGroup, cnt: count() })
    .from(submissionsTable)
    .groupBy(submissionsTable.competitionAgeGroup)
    .orderBy(sql`count(*) desc`);

  const maritalRows = await db
    .select({ label: submissionsTable.maritalStatus, cnt: count() })
    .from(submissionsTable)
    .groupBy(submissionsTable.maritalStatus)
    .orderBy(sql`count(*) desc`);

  // Injury rate: count where injuryHistory is 'بله' (yes)
  const [injuryResult] = await db
    .select({ count: count() })
    .from(submissionsTable)
    .where(eq(submissionsTable.injuryHistory, "بله"));

  // National team rate: count where nationalTeamHistory is 'بله' (yes)
  const [nationalResult] = await db
    .select({ count: count() })
    .from(submissionsTable)
    .where(eq(submissionsTable.nationalTeamHistory, "بله"));

  const total = totalResult.count;

  res.json({
    totalSubmissions: total,
    totalThisWeek: weekResult.count,
    totalThisMonth: monthResult.count,
    sportBreakdown: sportRows.map((r) => ({ label: r.label, count: r.cnt })),
    cityBreakdown: cityRows.map((r) => ({ label: r.label, count: r.cnt })),
    ageGroupBreakdown: ageGroupRows.map((r) => ({ label: r.label, count: r.cnt })),
    maritalStatusBreakdown: maritalRows.map((r) => ({ label: r.label, count: r.cnt })),
    avgAge: Number(avgResult?.avgAge ?? 0),
    avgYearsExperience: Number(avgResult?.avgYears ?? 0),
    injuryRate: total > 0 ? injuryResult.count / total : 0,
    nationalTeamRate: total > 0 ? nationalResult.count / total : 0,
  });
});

router.get("/admin/submissions", async (req, res): Promise<void> => {
  if (!isAdminAuthenticated(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const qp = ListAdminSubmissionsQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }

  const { page = 1, limit = 20, sport, city } = qp.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (sport) conditions.push(ilike(submissionsTable.sport, `%${sport}%`));
  if (city) conditions.push(ilike(submissionsTable.city, `%${city}%`));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult] = await db
    .select({ count: count() })
    .from(submissionsTable)
    .where(whereClause);

  const rows = await db
    .select({
      id: submissionsTable.id,
      fullName: submissionsTable.fullName,
      age: submissionsTable.age,
      sport: submissionsTable.sport,
      city: submissionsTable.city,
      gender: submissionsTable.gender,
      submittedAt: submissionsTable.submittedAt,
    })
    .from(submissionsTable)
    .where(whereClause)
    .orderBy(sql`submitted_at desc`)
    .limit(limit)
    .offset(offset);

  const total = totalResult.count;

  res.json({
    submissions: rows.map((r) => ({
      ...r,
      submittedAt: r.submittedAt.toISOString(),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

router.get("/admin/submissions/:id", async (req, res): Promise<void> => {
  if (!isAdminAuthenticated(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetAdminSubmissionParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(submissionsTable)
    .where(eq(submissionsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }

  res.json(formatSubmission(row));
});

router.get("/admin/export", async (req, res): Promise<void> => {
  if (!isAdminAuthenticated(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rows = await db.select().from(submissionsTable).orderBy(sql`submitted_at desc`);

  const headers = [
    "id", "نام و نام خانوادگی", "سن", "رده سنی رقابت", "جنسیت", "قد", "وزن",
    "شهر", "وضعیت تأهل", "رشته ورزشی", "سابقه تیم ملی", "سابقه لیگ برتر",
    "سابقه لیگ دسته اول", "سابقه ورزشی (سال)", "سابقه آسیب دیدگی",
    "مدت از آخرین آسیب", "درمان با فیزیوتراپی", "سابقه جراحی", "جزئیات آسیب",
    // Q1 columns (12 questions)
    ...Array.from({ length: 12 }, (_, i) => `پرسشنامه1_سوال${i + 1}`),
    // Q2 columns (11 questions)
    ...Array.from({ length: 11 }, (_, i) => `پرسشنامه2_سوال${i + 1}`),
    // Q3 columns (6 questions)
    ...Array.from({ length: 6 }, (_, i) => `پرسشنامه3_سوال${i + 1}`),
    // Q4 columns (15 questions)
    ...Array.from({ length: 15 }, (_, i) => `پرسشنامه4_سوال${i + 1}`),
    // Q5 columns (14 questions)
    ...Array.from({ length: 14 }, (_, i) => `پرسشنامه5_سوال${i + 1}`),
    // Q6 columns (32 questions)
    ...Array.from({ length: 32 }, (_, i) => `پرسشنامه6_سوال${i + 1}`),
    // Q7 columns (30 questions)
    ...Array.from({ length: 30 }, (_, i) => `پرسشنامه7_سوال${i + 1}`),
    "تاریخ ثبت",
  ];

  const csvRows = rows.map((row) => {
    const q1 = row.questionnaire1 as number[];
    const q2 = row.questionnaire2 as number[];
    const q3 = row.questionnaire3 as number[];
    const q4 = row.questionnaire4 as number[];
    const q5 = row.questionnaire5 as number[];
    const q6 = row.questionnaire6 as number[];
    const q7 = row.questionnaire7 as number[];

    return [
      row.id,
      `"${row.fullName}"`,
      row.age,
      `"${row.competitionAgeGroup}"`,
      `"${row.gender}"`,
      row.height,
      row.weight,
      `"${row.city}"`,
      `"${row.maritalStatus}"`,
      `"${row.sport}"`,
      `"${row.nationalTeamHistory}"`,
      `"${row.premierLeagueHistory}"`,
      `"${row.firstLeagueHistory}"`,
      row.yearsOfExperience,
      `"${row.injuryHistory}"`,
      `"${row.timeSinceLastInjury ?? ""}"`,
      `"${row.physiotherapyTreatment}"`,
      `"${row.surgerHistory}"`,
      `"${row.injuryDetails ?? ""}"`,
      ...q1,
      ...q2,
      ...q3,
      ...q4,
      ...q5,
      ...q6,
      ...q7,
      row.submittedAt.toISOString(),
    ].join(",");
  });

  const csv = [headers.join(","), ...csvRows].join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="survey-export-${Date.now()}.csv"`);
  res.send("\uFEFF" + csv); // BOM for Excel Persian compatibility
});

export default router;
