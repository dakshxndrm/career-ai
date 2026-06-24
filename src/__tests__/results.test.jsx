import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const h = vi.hoisted(() => ({
  navigate: vi.fn(),
  getDoc: vi.fn(),
}));

vi.mock("../firebase", () => ({
  db: {},
  auth: { currentUser: { getIdToken: async () => "test-token" } },
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ currentUser: { uid: "u1", email: "a@b.com" }, logout: vi.fn() }),
}));

vi.mock("firebase/firestore", () => ({
  doc: () => ({}),
  getDoc: h.getDoc,
  setDoc: vi.fn(async () => {}),
  updateDoc: vi.fn(async () => {}),
  arrayUnion: (x) => x,
  arrayRemove: (x) => x,
  serverTimestamp: () => null,
}));

vi.mock("react-router-dom", async (orig) => {
  const actual = await orig();
  return { ...actual, useNavigate: () => h.navigate };
});

import Results from "../pages/Results";

const RESULT = {
  summary: "You show a strong analytical streak with a creative edge.",
  personalityType: "Analytical Builder",
  topCareers: [
    { title: "Data Scientist", match: 92, reason: "Strong with data and patterns." },
    { title: "Product Engineer", match: 84, reason: "Enjoys building end to end." },
  ],
  strengths: ["Problem-solving", "Persistence"],
  skillsToLearn: ["Statistics", "Python"],
  roadmap: [
    { step: 1, title: "Learn the basics", description: "Start with fundamentals." },
    { step: 2, title: "Build a project", description: "Apply the skills." },
  ],
  currentLevel: "intermediate",
  levelEvidence: "Answered the diagnostics well.",
  knownAreas: ["spreadsheets"],
  gapAreas: ["machine learning"],
};

describe("Results render path", () => {
  beforeEach(() => {
    h.navigate.mockClear();
    h.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ title: "Data Science", goal: "career", result: RESULT, savedCareers: [] }),
    });
  });

  it("renders the report when a result already exists (no AI call)", async () => {
    render(
      <MemoryRouter initialEntries={["/results?id=abc"]}>
        <Results />
      </MemoryRouter>
    );

    expect(await screen.findByText(RESULT.summary)).toBeInTheDocument();
    expect(screen.getByText("Data Scientist")).toBeInTheDocument();
    expect(screen.getByText("Product Engineer")).toBeInTheDocument();
    expect(screen.getByText("Analytical Builder")).toBeInTheDocument();
  });

  it("does not hit the network when result is cached", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    render(
      <MemoryRouter initialEntries={["/results?id=abc"]}>
        <Results />
      </MemoryRouter>
    );
    await screen.findByText(RESULT.summary);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
