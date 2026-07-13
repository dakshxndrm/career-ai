/*
 * ── Model provider configuration ─────────────────────────────────────────────
 *
 * Set MODEL_PROVIDER in your .env (or Vercel env vars) to choose the backend.
 *
 * "ollama"  — local, no cost (default)
 *   MODEL_PROVIDER=ollama
 *   Requires: `ollama serve` running locally, llama3.1:8b pulled.
 *   (`ollama pull llama3.1:8b`)
 *
 * "gemini"  — Google Gemini free tier
 *   MODEL_PROVIDER=gemini
 *   GEMINI_API_KEY=<key>   ← aistudio.google.com/app/apikey
 *   Uses gemini-2.5-flash (1 500 free requests / day as of mid-2025).
 *
 * Both paths return { content: [{ text }] } so the frontend is unchanged.
 *
 * FIREBASE_SERVICE_ACCOUNT (service-account JSON) is required — it backs both
 * ID-token verification and the durable per-user rate limit.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_MAX = 10; // requests per window per user
const MAX_PROMPT_CHARS = 20000; // hard cap on prompt size

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  return initializeApp({ credential: cert(JSON.parse(raw)) });
}

// Firestore sliding-window counter: durable and shared across serverless
// instances (an in-memory Map would reset on cold starts and never sync).
// Returns { allowed: boolean, resetMins: number }
async function checkRateLimit(db, uid) {
  const now = Date.now();
  const ref = db.collection("rateLimits").doc(uid);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    let hits = (snap.exists ? snap.data().hits : []) || [];
    hits = hits.filter((t) => now - t < RATE_WINDOW_MS);
    if (hits.length >= RATE_MAX) {
      const resetMins = Math.ceil((hits[0] + RATE_WINDOW_MS - now) / 60_000);
      return { allowed: false, resetMins };
    }
    hits.push(now);
    tx.set(ref, { hits, updatedAt: FieldValue.serverTimestamp() });
    return { allowed: true, resetMins: 0 };
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const app = getAdminApp();
  if (!app) {
    return res.status(503).json({ error: "FIREBASE_SERVICE_ACCOUNT env var is not set" });
  }

  // ── 1. Require a Firebase ID token ────────────────────────────────────────
  const authHeader = req.headers.authorization ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization header missing or malformed" });
  }

  let uid;
  try {
    ({ uid } = await getAuth(app).verifyIdToken(authHeader.slice(7)));
  } catch {
    return res.status(401).json({ error: "Invalid or expired Firebase token" });
  }

  // ── 2. Per-user rate limit ─────────────────────────────────────────────────
  let allowed, resetMins;
  try {
    ({ allowed, resetMins } = await checkRateLimit(getFirestore(app), uid));
  } catch (err) {
    console.error("Rate-limit transaction failed:", err.message);
    return res.status(503).json({ error: "Rate limiter unavailable, try again shortly" });
  }
  if (!allowed) {
    return res.status(429).json({
      error: `Rate limit reached. Try again in ${resetMins} minute(s).`,
      resetMins,
    });
  }

  // ── 3. Validate body ──────────────────────────────────────────────────────
  const { prompt } = req.body ?? {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "prompt is required" });
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    return res.status(413).json({ error: "prompt too large" });
  }

  // ── 4. Dispatch to the configured model provider ──────────────────────────
  let raw;
  try {
    const provider = (process.env.MODEL_PROVIDER ?? "ollama").toLowerCase();
    raw = provider === "gemini" ? await callGemini(prompt) : await callOllama(prompt);
  } catch (err) {
    const status = err instanceof ProviderError ? err.status : 502;
    return res.status(status).json({ error: err.message });
  }

  // Strip fenced-code wrappers that occasionally leak through
  const text = raw.replace(/```json|```/g, "").trim();

  return res.status(200).json({ content: [{ text }] });
}

// ── Ollama ────────────────────────────────────────────────────────────────────

async function callOllama(prompt) {
  let res;
  try {
    res = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.1:8b",
        format: "json",
        stream: false,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch {
    throw new ProviderError(502, "Ollama unreachable. Is `ollama serve` running?");
  }

  if (!res.ok) {
    const detail = await res.text();
    throw new ProviderError(502, `Ollama error: ${detail}`);
  }

  const data = await res.json();
  return data?.message?.content ?? "";
}

// ── Gemini ────────────────────────────────────────────────────────────────────

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new ProviderError(500, "GEMINI_API_KEY env var is not set");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // Ask Gemini to respond with JSON directly, reducing fence leakage
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new ProviderError(502, `Gemini error: ${detail}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

class ProviderError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
