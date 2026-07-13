import { auth } from "../firebase";

/**
 * Sends a prompt to /api/chat with the current user's Firebase ID token and
 * validates the JSON reply against a zod schema.
 *
 * Returns { ok: true, data } on success, or
 * { ok: false, kind: "rate_limit" | "network" | "parse", message? } —
 * `message` is only set for rate_limit (the server's human-readable text).
 * Network-level throws (offline, token refresh) propagate to the caller.
 */
export async function askModel(prompt, schema) {
  const idToken = await auth.currentUser.getIdToken();
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ prompt }),
  });

  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, kind: "rate_limit", message: body.error };
  }
  if (!res.ok) return { ok: false, kind: "network" };

  const data = await res.json();
  const raw = data?.content?.[0]?.text ?? "";
  const cleaned = raw.replace(/```json|```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("askModel: JSON.parse failed.\nRaw output:", raw);
    return { ok: false, kind: "parse" };
  }

  const validation = schema.safeParse(parsed);
  if (!validation.success) {
    console.error("askModel: schema validation failed.", validation.error.flatten());
    return { ok: false, kind: "parse" };
  }

  return { ok: true, data: validation.data };
}
