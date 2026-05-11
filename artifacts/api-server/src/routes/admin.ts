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

  // ── Aggregate psychological scores from JSONB ──────────────────────────────
  const scoreAvgsResult = await db.execute(sql`
    SELECT
      ROUND(AVG((scores->'q1'->>'total')::float)::numeric, 1) AS avg_q1_total,
      ROUND(AVG((scores->'q1'->>'aggression')::float)::numeric, 1) AS avg_q1_aggression,
      ROUND(AVG((scores->'q1'->>'competitiveAnger')::float)::numeric, 1) AS avg_q1_competitive_anger,
      ROUND(AVG((scores->'q2'->>'total')::float)::numeric, 1) AS avg_q2_total,
      ROUND(AVG((scores->'q3'->>'total')::float)::numeric, 1) AS avg_q3_total,
      ROUND(AVG((scores->'q4'->>'total')::float)::numeric, 1) AS avg_q4_total,
      ROUND(AVG((scores->'q5'->>'total')::float)::numeric, 1) AS avg_q5_total,
      ROUND(AVG((scores->'q5'->>'confidence')::float)::numeric, 1) AS avg_q5_confidence,
      ROUND(AVG((scores->'q5'->>'constancy')::float)::numeric, 1) AS avg_q5_constancy,
      ROUND(AVG((scores->'q5'->>'control')::float)::numeric, 1) AS avg_q5_control,
      ROUND(AVG((scores->'q6'->>'positiveMood')::float)::numeric, 1) AS avg_q6_positive,
      ROUND(AVG((scores->'q6'->>'negativeMood')::float)::numeric, 1) AS avg_q6_negative,
      ROUND(AVG((scores->'q6'->>'vigour')::float)::numeric, 1) AS avg_q6_vigour,
      ROUND(AVG((scores->'q6'->>'fatigue')::float)::numeric, 1) AS avg_q6_fatigue,
      ROUND(AVG((scores->'q6'->>'tension')::float)::numeric, 1) AS avg_q6_tension,
      ROUND(AVG((scores->'q6'->>'calmness')::float)::numeric, 1) AS avg_q6_calmness,
      ROUND(AVG((scores->'q6'->>'anger')::float)::numeric, 1) AS avg_q6_anger,
      ROUND(AVG((scores->'q6'->>'happiness')::float)::numeric, 1) AS avg_q6_happiness,
      ROUND(AVG((scores->'q6'->>'depression')::float)::numeric, 1) AS avg_q6_depression,
      ROUND(AVG((scores->'q6'->>'confusion')::float)::numeric, 1) AS avg_q6_confusion,
      ROUND(AVG((scores->'q7'->>'fun')::float)::numeric, 1) AS avg_q7_fun,
      ROUND(AVG((scores->'q7'->>'fitness')::float)::numeric, 1) AS avg_q7_fitness,
      ROUND(AVG((scores->'q7'->>'friendship')::float)::numeric, 1) AS avg_q7_friendship,
      ROUND(AVG((scores->'q7'->>'achievement')::float)::numeric, 1) AS avg_q7_achievement,
      ROUND(AVG((scores->'q7'->>'energyRelease')::float)::numeric, 1) AS avg_q7_energy_release,
      ROUND(AVG((scores->'q7'->>'teamAffiliation')::float)::numeric, 1) AS avg_q7_team,
      ROUND(AVG((scores->'q7'->>'skillDevelopment')::float)::numeric, 1) AS avg_q7_skill,
      ROUND(AVG((scores->'q7'->>'situationalFactors')::float)::numeric, 1) AS avg_q7_situational
    FROM submissions
    WHERE scores IS NOT NULL
  `);
  // node-postgres returns QueryResult with .rows
  const scoreAvgs = (scoreAvgsResult as unknown as { rows: Record<string, string | null>[] }).rows[0] ?? {};

  // Q3 interpretation distribution (exercise addiction levels)
  const q3DistResult = await db.execute(sql`
    SELECT
      scores->'q3'->>'interpretationLevel' AS level,
      COUNT(*) AS cnt
    FROM submissions
    WHERE scores IS NOT NULL AND scores->'q3'->>'interpretationLevel' IS NOT NULL
    GROUP BY level
    ORDER BY cnt DESC
  `);
  const q3DistRows = (q3DistResult as unknown as { rows: { level: string; cnt: string }[] }).rows;

  const q3LevelLabel: Record<string, string> = {
    normal: "بدون علائم",
    none: "بدون علائم",
    symptomatic: "دارای علائم",
    addicted: "معتاد به تمرین",
  };

  const sa = scoreAvgs as Record<string, string | null>;
  const n = (k: string) => (sa[k] !== null && sa[k] !== undefined ? Number(sa[k]) : null);

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
    scoreAverages: {
      q1Total: n("avg_q1_total"),
      q1Aggression: n("avg_q1_aggression"),
      q1CompetitiveAnger: n("avg_q1_competitive_anger"),
      q2Total: n("avg_q2_total"),
      q3Total: n("avg_q3_total"),
      q4Total: n("avg_q4_total"),
      q5Total: n("avg_q5_total"),
      q5Confidence: n("avg_q5_confidence"),
      q5Constancy: n("avg_q5_constancy"),
      q5Control: n("avg_q5_control"),
      q6Positive: n("avg_q6_positive"),
      q6Negative: n("avg_q6_negative"),
      q6Vigour: n("avg_q6_vigour"),
      q6Fatigue: n("avg_q6_fatigue"),
      q6Tension: n("avg_q6_tension"),
      q6Calmness: n("avg_q6_calmness"),
      q6Anger: n("avg_q6_anger"),
      q6Happiness: n("avg_q6_happiness"),
      q6Depression: n("avg_q6_depression"),
      q6Confusion: n("avg_q6_confusion"),
      q7Fun: n("avg_q7_fun"),
      q7Fitness: n("avg_q7_fitness"),
      q7Friendship: n("avg_q7_friendship"),
      q7Achievement: n("avg_q7_achievement"),
      q7EnergyRelease: n("avg_q7_energy_release"),
      q7Team: n("avg_q7_team"),
      q7Skill: n("avg_q7_skill"),
      q7Situational: n("avg_q7_situational"),
    },
    q3Distribution: q3DistRows.map((r) => ({
      label: q3LevelLabel[r.level] ?? r.level,
      count: Number(r.cnt),
    })),
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
    // Q1 raw (12 questions)
    ...Array.from({ length: 12 }, (_, i) => `پرسشنامه1_سوال${i + 1}`),
    // Q2 raw (11 questions)
    ...Array.from({ length: 11 }, (_, i) => `پرسشنامه2_سوال${i + 1}`),
    // Q3 raw (6 questions)
    ...Array.from({ length: 6 }, (_, i) => `پرسشنامه3_سوال${i + 1}`),
    // Q4 raw (15 questions)
    ...Array.from({ length: 15 }, (_, i) => `پرسشنامه4_سوال${i + 1}`),
    // Q5 raw (14 questions)
    ...Array.from({ length: 14 }, (_, i) => `پرسشنامه5_سوال${i + 1}`),
    // Q6 raw (32 questions)
    ...Array.from({ length: 32 }, (_, i) => `پرسشنامه6_سوال${i + 1}`),
    // Q7 raw (30 questions)
    ...Array.from({ length: 30 }, (_, i) => `پرسشنامه7_سوال${i + 1}`),
    // Calculated scores
    "نمره_پرخاشگری_شخصی", "نمره_خشم_رقابتی", "نمره_کل_پرخاشگری",
    "نمره_خستگی_هیجانی_جسمانی", "نمره_کل_تحلیل_رفتگی",
    "نمره_اهمیت_تمرین", "نمره_پیامد_روانشناختی", "نمره_کل_اعتیاد_تمرین", "تفسیر_اعتیاد_تمرین",
    "نمره_کل_اضطراب_رقابتی",
    "نمره_اطمینان", "نمره_پایداری", "نمره_کنترل", "نمره_کل_سرسختی_ذهنی",
    "نمره_تنش", "نمره_افسردگی", "نمره_خشم_خلق", "نمره_سرزندگی", "نمره_خستگی",
    "نمره_سردرگمی", "نمره_آرامش", "نمره_شادکامی", "نمره_خلق_مثبت", "نمره_خلق_منفی",
    "نمره_پیشرفت", "نمره_گروه_گرایی", "نمره_آمادگی", "نمره_تخلیه_انرژی",
    "نمره_عوامل_موقعیتی", "نمره_بهبود_مهارت", "نمره_دوست_یابی", "نمره_تفریح",
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

    // Extract calculated scores if present
    type ScoresJSON = {
      q1?: { aggression?: number; competitiveAnger?: number; total?: number };
      q2?: { emotionalExhaustion?: number; total?: number };
      q3?: { importance?: number; psychologicalConsequences?: number; total?: number; interpretation?: string };
      q4?: { total?: number };
      q5?: { confidence?: number; constancy?: number; control?: number; total?: number };
      q6?: { tension?: number; depression?: number; anger?: number; vigour?: number; fatigue?: number; confusion?: number; calmness?: number; happiness?: number; positiveMood?: number; negativeMood?: number };
      q7?: { achievement?: number; teamAffiliation?: number; fitness?: number; energyRelease?: number; situationalFactors?: number; skillDevelopment?: number; friendship?: number; fun?: number };
    };
    const sc = (row.scores ?? {}) as ScoresJSON;
    const n = (v: number | undefined) => v ?? "";

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
      ...q1, ...q2, ...q3, ...q4, ...q5, ...q6, ...q7,
      // Scores
      n(sc.q1?.aggression), n(sc.q1?.competitiveAnger), n(sc.q1?.total),
      n(sc.q2?.emotionalExhaustion), n(sc.q2?.total),
      n(sc.q3?.importance), n(sc.q3?.psychologicalConsequences), n(sc.q3?.total), `"${sc.q3?.interpretation ?? ""}"`,
      n(sc.q4?.total),
      n(sc.q5?.confidence), n(sc.q5?.constancy), n(sc.q5?.control), n(sc.q5?.total),
      n(sc.q6?.tension), n(sc.q6?.depression), n(sc.q6?.anger), n(sc.q6?.vigour),
      n(sc.q6?.fatigue), n(sc.q6?.confusion), n(sc.q6?.calmness), n(sc.q6?.happiness),
      n(sc.q6?.positiveMood), n(sc.q6?.negativeMood),
      n(sc.q7?.achievement), n(sc.q7?.teamAffiliation), n(sc.q7?.fitness), n(sc.q7?.energyRelease),
      n(sc.q7?.situationalFactors), n(sc.q7?.skillDevelopment), n(sc.q7?.friendship), n(sc.q7?.fun),
      row.submittedAt.toISOString(),
    ].join(",");
  });

  const csv = [headers.join(","), ...csvRows].join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="survey-export-${Date.now()}.csv"`);
  res.send("\uFEFF" + csv); // BOM for Excel Persian compatibility
});

export default router;
