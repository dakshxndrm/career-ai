import { describe, it, expect } from "vitest";
import { QuestionsSchema, ResultSchema } from "../schemas.js";

const minimalResult = {
  summary: "Good match for software engineering.",
  personalityType: "Analytical",
  topCareers: [{ title: "Frontend Developer", match: 85, reason: "Strong aptitude" }],
  strengths: ["Problem-solving"],
  skillsToLearn: ["TypeScript"],
  roadmap: [{ step: 1, title: "Learn basics", description: "Start with fundamentals" }],
};

const validMcq = { id: "q1", type: "mcq", question: "What is 2+2?", options: ["1", "2", "3", "4"] };
const validOpen = { id: "q2", type: "open", question: "Describe yourself." };

describe("QuestionsSchema", () => {
  it("accepts an array of MCQ questions (min 2 required)", () => {
    const input = [validMcq, { ...validMcq, id: "q2" }];
    expect(QuestionsSchema.safeParse(input).success).toBe(true);
  });

  it("accepts a mixed MCQ + open array", () => {
    const input = [validMcq, validOpen];
    expect(QuestionsSchema.safeParse(input).success).toBe(true);
  });

  it("rejects MCQ without exactly 4 options", () => {
    const input = [
      { id: "q1", type: "mcq", question: "Missing options?" },
      validOpen,
    ];
    expect(QuestionsSchema.safeParse(input).success).toBe(false);
  });

  it("rejects an array shorter than min(2)", () => {
    expect(QuestionsSchema.safeParse([]).success).toBe(false);
    expect(QuestionsSchema.safeParse([validMcq]).success).toBe(false);
  });
});

describe("ResultSchema", () => {
  it("accepts a minimal valid result", () => {
    expect(ResultSchema.safeParse(minimalResult).success).toBe(true);
  });

  it("accepts result with all new optional fields", () => {
    const input = {
      ...minimalResult,
      currentLevel: "intermediate",
      levelEvidence: "Solved dynamic programming problems",
      knownAreas: ["algorithms"],
      gapAreas: ["system design"],
      goalPlan: {
        goal: "Get a job at Google",
        feasibility: "Achievable in 12 months",
        estimatedTime: "12 months",
        milestones: [
          { title: "LeetCode 150", detail: "Complete the Blind 75 list" },
          { title: "Build projects", detail: "Create 2 full-stack apps" },
          { title: "Mock interviews", detail: "Do 10 mock interviews" },
        ],
      },
    };
    expect(ResultSchema.safeParse(input).success).toBe(true);
  });

  it("rejects invalid currentLevel value", () => {
    const input = { ...minimalResult, currentLevel: "expert" };
    expect(ResultSchema.safeParse(input).success).toBe(false);
  });

  it("requires match to be 0–100 integer", () => {
    const input = {
      ...minimalResult,
      topCareers: [{ title: "Dev", match: 150, reason: "ok" }],
    };
    expect(ResultSchema.safeParse(input).success).toBe(false);
  });
});
