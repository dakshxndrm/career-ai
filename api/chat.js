/*
 * ── Model provider configuration ─────────────────────────────────────────────
 *
 * Set MODEL_PROVIDER in your .env (or Vercel env vars) to choose the backend.
 *
 * "ollama"  — local, no cost (default)
 *   MODEL_PROVIDER=ollama
 *   Requires: `ollama serve` running locally, llama3.1:8b pulled.
 *   (`ollama pull llama3.1:8b`)
 *   No other env vars needed.
 *
 * "gemini"  — Google Gemini free tier
 *   MODEL_PROVIDER=gemini
 *   GEMINI_API_KEY=<key>   ← aistudio.google.com/app/apikey
 *   Uses gemini-2.5-flash (1 500 free requests / day as of mid-2025).
 *
 * "anthropic"  — Anthropic Claude
 *   MODEL_PROVIDER=anthropic
 *   ANTHROPIC_API_KEY=<key>   ← console.anthropic.com
 *   Uses claude-haiku-4-5-20251001 (fastest / cheapest Claude model).
 *
 * All three paths return { content: [{ text }] } so the frontend is unchanged.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Per-user rate limit store: uid → { count, windowStart }
// Module-level — persists within a single function instance.
// Not distributed across instances; swap for Upstash KV if needed.
const rateLimitStore = new Map();
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_MAX = 10; // requests per window per user

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── 1. Require a Firebase ID token ────────────────────────────────────────
  const authHeader = req.headers.authorization ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization header missing or malformed" });
  }
  const idToken = authHeader.slice(7);

  let uid;
  try {
    uid = await verifyFirebaseToken(idToken);
  } catch {
    return res.status(401).json({ error: "Invalid or expired Firebase token" });
  }

  // ── 2. Per-user rate limit ────────────────────────────────────────────────
  const now = Date.now();
  const record = rateLimitStore.get(uid) ?? { count: 0, windowStart: now };

  if (now - record.windowStart >= RATE_WINDOW_MS) {
    record.count = 0;
    record.windowStart = now;
  }

  if (record.count >= RATE_MAX) {
    const resetMins = Math.ceil((record.windowStart + RATE_WINDOW_MS - now) / 60_000);
    return res.status(429).json({
      error: `Rate limit reached. Try again in ${resetMins} minute(s).`,
    });
  }

  record.count += 1;
  rateLimitStore.set(uid, record);

  // ── 3. Validate body ──────────────────────────────────────────────────────
  const { prompt } = req.body ?? {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "prompt is required" });
  }

  // ── 4. Dispatch to the configured model provider ──────────────────────────
  let raw;
  try {
    raw = await callModel(prompt);
  } catch (err) {
    const status = err instanceof ProviderError ? err.status : 502;
    return res.status(status).json({ error: err.message });
  }

  // Strip fenced-code wrappers that occasionally leak through
  const text = raw.replace(/```json|```/g, "").trim();

  return res.status(200).json({ content: [{ text }] });
}

// ── Provider dispatch ─────────────────────────────────────────────────────────

async function callModel(prompt) {
  const provider = (process.env.MODEL_PROVIDER ?? "ollama").toLowerCase();

  if (provider === "gemini") return callGemini(prompt);
  if (provider === "anthropic") return callAnthropic(prompt);
  return callOllama(prompt); // default: ollama
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

// ── Anthropic ────────────────────────────────────────────────────────────────

async function callAnthropic(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new ProviderError(500, "ANTHROPIC_API_KEY env var is not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new ProviderError(502, `Anthropic error: ${detail}`);
  }

  const data = await res.json();
  return data?.content?.[0]?.text ?? "";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

class ProviderError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function verifyFirebaseToken(idToken) {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) throw new Error("FIREBASE_WEB_API_KEY env var is not set");

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  );

  if (!res.ok) throw new Error("Token lookup failed");

  const body = await res.json();
  const user = body.users?.[0];
  if (!user?.localId) throw new Error("No user in token response");

  return user.localId;
}
