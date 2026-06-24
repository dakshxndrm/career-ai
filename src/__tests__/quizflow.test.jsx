import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ── Hoisted spies/mocks shared with the module factories ──
const h = vi.hoisted(() => ({
  navigate: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(async () => {}),
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
  setDoc: h.setDoc,
  serverTimestamp: () => null,
}));

vi.mock("react-router-dom", async (orig) => {
  const actual = await orig();
  return { ...actual, useNavigate: () => h.navigate };
});

import Assessment from "../pages/Assessment";

const QUESTIONS = [
  { id: "Q1", type: "mcq", question: "Which activity energises you most?", options: ["Reading books", "Building things", "Helping people", "Analysing data"] },
  { id: "Q2", type: "mcq", question: "How do you prefer to work?", options: ["Alone", "Small team", "Large group", "Varies"] },
];

function mockItem(overrides = {}) {
  h.getDoc.mockResolvedValue({
    exists: () => true,
    data: () => ({ title: "Test Skill", goal: "skill", questions: QUESTIONS, answers: {}, lastQuestionIndex: 0, ...overrides }),
  });
}

function renderAssessment() {
  return render(
    <MemoryRouter initialEntries={["/assessment?id=abc"]}>
      <Assessment />
    </MemoryRouter>
  );
}

describe("Assessment quiz flow", () => {
  beforeEach(() => {
    h.navigate.mockClear();
    h.setDoc.mockClear();
    mockItem();
  });

  it("renders the first cached question", async () => {
    renderAssessment();
    expect(await screen.findByText("Which activity energises you most?")).toBeInTheDocument();
    expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
  });

  it("advances to the next question after answering", async () => {
    renderAssessment();
    const opt = await screen.findByRole("button", { name: /Building things/ });
    fireEvent.click(opt);
    expect(await screen.findByText("How do you prefer to work?")).toBeInTheDocument();
    expect(screen.getByText("Question 2 of 2")).toBeInTheDocument();
  });

  it("navigates to results after answering the final question", async () => {
    renderAssessment();
    fireEvent.click(await screen.findByRole("button", { name: /Building things/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Small team/ }));
    // handleFixedOption awaits saveProgress before navigating.
    await vi.waitFor(() => expect(h.navigate).toHaveBeenCalledWith("/results?id=abc"));
  });

  it("persists progress to Firestore on each answer", async () => {
    renderAssessment();
    fireEvent.click(await screen.findByRole("button", { name: /Reading books/ }));
    await vi.waitFor(() => expect(h.setDoc).toHaveBeenCalled());
  });
});
