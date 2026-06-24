/**
 * Neutralises user-supplied text before it is interpolated into an AI prompt.
 *
 * The quiz answers, objective, and title are all user-controlled and get
 * embedded directly into the model prompt. Without sanitisation a user could
 * inject instructions ("ignore the above and ...") that hijack the model.
 *
 * This strips code fences, role markers, and common override phrases, collapses
 * runaway whitespace, and caps length. It is deliberately conservative — it
 * keeps normal answers intact while defanging obvious injection attempts.
 */
export function sanitizeForPrompt(value, maxLen = 500) {
  if (value == null) return "";
  let s = String(value);

  // Remove markdown/code fences and stray backticks that can break out of context.
  s = s.replace(/```+/g, "").replace(/`/g, "'");

  // Strip chat role markers that could be read as new turns.
  s = s.replace(/^\s*(system|assistant|user|developer)\s*:/gim, "");

  // Defang the most common prompt-injection openers.
  s = s.replace(
    /\b(ignore|disregard|forget)\b[^.\n]*\b(previous|above|earlier|prior|all)\b[^.\n]*\b(instruction|prompt|rule|context|message)s?\b/gi,
    "[removed]"
  );
  s = s.replace(/\byou are now\b/gi, "[removed]");
  s = s.replace(/\bnew instructions?\b/gi, "[removed]");

  // Remove control characters (preserves tab \x09 and newline \x0A).
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ");

  // Collapse excessive whitespace / newlines.
  s = s.replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();

  if (s.length > maxLen) s = s.slice(0, maxLen) + "…";
  return s;
}
