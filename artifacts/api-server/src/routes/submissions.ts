import { Router, type IRouter } from "express";
import { db, submissionsTable } from "@workspace/db";
import { CreateSubmissionBody } from "@workspace/api-zod";
import { eq, sql, count, avg, gte } from "drizzle-orm";

const router: IRouter = Router();

router.post("/submissions", async (req, res): Promise<void> => {
  const parsed = CreateSubmissionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { demographics, ...questionnaires } = parsed.data;

  const [submission] = await db
    .insert(submissionsTable)
    .values({
      fullName: demographics.fullName,
      age: demographics.age,
      competitionAgeGroup: demographics.competitionAgeGroup,
      gender: demographics.gender,
      height: String(demographics.height),
      weight: String(demographics.weight),
      city: demographics.city,
      maritalStatus: demographics.maritalStatus,
      sport: demographics.sport,
      nationalTeamHistory: demographics.nationalTeamHistory,
      premierLeagueHistory: demographics.premierLeagueHistory,
      firstLeagueHistory: demographics.firstLeagueHistory,
      yearsOfExperience: demographics.yearsOfExperience,
      injuryHistory: demographics.injuryHistory,
      timeSinceLastInjury: demographics.timeSinceLastInjury ?? null,
      physiotherapyTreatment: demographics.physiotherapyTreatment,
      surgerHistory: demographics.surgerHistory,
      injuryDetails: demographics.injuryDetails ?? null,
      questionnaire1: questionnaires.questionnaire1,
      questionnaire2: questionnaires.questionnaire2,
      questionnaire3: questionnaires.questionnaire3,
      questionnaire4: questionnaires.questionnaire4,
      questionnaire5: questionnaires.questionnaire5,
      questionnaire6: questionnaires.questionnaire6,
      questionnaire7: questionnaires.questionnaire7,
    })
    .returning();

  res.status(201).json(formatSubmission(submission));
});

function formatSubmission(row: typeof submissionsTable.$inferSelect) {
  return {
    id: row.id,
    demographics: {
      fullName: row.fullName,
      age: row.age,
      competitionAgeGroup: row.competitionAgeGroup,
      gender: row.gender,
      height: Number(row.height),
      weight: Number(row.weight),
      city: row.city,
      maritalStatus: row.maritalStatus,
      sport: row.sport,
      nationalTeamHistory: row.nationalTeamHistory,
      premierLeagueHistory: row.premierLeagueHistory,
      firstLeagueHistory: row.firstLeagueHistory,
      yearsOfExperience: row.yearsOfExperience,
      injuryHistory: row.injuryHistory,
      timeSinceLastInjury: row.timeSinceLastInjury ?? null,
      physiotherapyTreatment: row.physiotherapyTreatment,
      surgerHistory: row.surgerHistory,
      injuryDetails: row.injuryDetails ?? null,
    },
    questionnaire1: row.questionnaire1 as number[],
    questionnaire2: row.questionnaire2 as number[],
    questionnaire3: row.questionnaire3 as number[],
    questionnaire4: row.questionnaire4 as number[],
    questionnaire5: row.questionnaire5 as number[],
    questionnaire6: row.questionnaire6 as number[],
    questionnaire7: row.questionnaire7 as number[],
    submittedAt: row.submittedAt.toISOString(),
  };
}

export { formatSubmission };
export default router;
