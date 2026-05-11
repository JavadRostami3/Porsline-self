import { pgTable, serial, text, integer, jsonb, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const submissionsTable = pgTable("submissions", {
  id: serial("id").primaryKey(),

  // Demographics
  fullName: text("full_name").notNull(),
  age: integer("age").notNull(),
  competitionAgeGroup: text("competition_age_group").notNull(),
  gender: text("gender").notNull(),
  height: numeric("height", { precision: 5, scale: 2 }).notNull(),
  weight: numeric("weight", { precision: 5, scale: 2 }).notNull(),
  city: text("city").notNull(),
  maritalStatus: text("marital_status").notNull(),
  sport: text("sport").notNull(),
  nationalTeamHistory: text("national_team_history").notNull(),
  premierLeagueHistory: text("premier_league_history").notNull(),
  firstLeagueHistory: text("first_league_history").notNull(),
  yearsOfExperience: integer("years_of_experience").notNull(),
  injuryHistory: text("injury_history").notNull(),
  timeSinceLastInjury: text("time_since_last_injury"),
  physiotherapyTreatment: text("physiotherapy_treatment").notNull(),
  surgerHistory: text("surger_history").notNull(),
  injuryDetails: text("injury_details"),

  // Questionnaire answers stored as JSON arrays
  questionnaire1: jsonb("questionnaire1").notNull().$type<number[]>(),
  questionnaire2: jsonb("questionnaire2").notNull().$type<number[]>(),
  questionnaire3: jsonb("questionnaire3").notNull().$type<number[]>(),
  questionnaire4: jsonb("questionnaire4").notNull().$type<number[]>(),
  questionnaire5: jsonb("questionnaire5").notNull().$type<number[]>(),
  questionnaire6: jsonb("questionnaire6").notNull().$type<number[]>(),
  questionnaire7: jsonb("questionnaire7").notNull().$type<number[]>(),

  // Calculated scores stored after submission (nullable for backward compatibility)
  scores: jsonb("scores").$type<Record<string, unknown> | null>().default(null),

  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSubmissionSchema = createInsertSchema(submissionsTable).omit({ id: true, submittedAt: true });
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissionsTable.$inferSelect;
