import { z } from "zod";

// ── Assessment questions ───────────────────────────────────────────────────────

const McqQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  type: z.literal("mcq"),
  options: z.array(z.string().min(1)).length(4),
});

const OpenQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  type: z.literal("open"),
  options: z.array(z.string()).max(0).optional().default([]),
});

const QuestionSchema = z.discriminatedUnion("type", [
  McqQuestionSchema,
  OpenQuestionSchema,
]);

export const QuestionsSchema = z.array(QuestionSchema).min(2).max(35);

// ── Career report ─────────────────────────────────────────────────────────────

export const ResultSchema = z.object({
  topCareers: z
    .array(
      z.object({
        title: z.string().min(1),
        match: z.number().int().min(0).max(100),
        reason: z.string().min(1),
      })
    )
    .min(1)
    .max(10),
  strengths: z.array(z.string().min(1)).min(1),
  skillsToLearn: z.array(z.string().min(1)).min(1),
  roadmap: z
    .array(
      z.object({
        step: z.number().int().positive(),
        title: z.string().min(1),
        description: z.string().min(1),
      })
    )
    .min(1),
  personalityType: z.string().min(1),
  summary: z.string().min(1),
  // ── Knowledge diagnostic ──────────────────────────────────────────────────
  currentLevel:  z.enum(["beginner", "intermediate", "advanced"]).optional(),
  levelEvidence: z.string().min(1).optional(),
  knownAreas:    z.array(z.string()).default([]).optional(),
  gapAreas:      z.array(z.string()).min(1).optional(),
  // ── Goal plan ────────────────────────────────────────────────────────────
  goalPlan: z.object({
    goal:          z.string().min(1),
    feasibility:   z.string().min(1),
    estimatedTime: z.string().min(1),
    milestones: z.array(z.object({
      title:  z.string().min(1),
      detail: z.string().min(1),
    })).min(3),
  }).optional(),
});

// ── AI Roadmap phases ─────────────────────────────────────────────────────────

export const RoadmapSchema = z.object({
  phases: z
    .array(
      z.object({
        phase: z.number().int().positive(),
        title: z.string().min(1),
        blurb: z.string().min(1),
        weeks: z.string().min(1),
        skills: z
          .array(z.object({ id: z.string().min(1), label: z.string().min(1) }))
          .min(1),
        courses: z
          .array(
            z.object({
              title: z.string().min(1),
              provider: z.string().min(1),
              url: z.string().min(1),
            })
          )
          .min(1),
      })
    )
    .min(1)
    .max(8),
});
