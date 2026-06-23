/**
 * Pure date-logic utilities extracted from Roadmap.jsx so they can be unit-tested.
 * computeStreak and computeWeekCount accept an optional `today` string (YYYY-MM-DD)
 * that defaults to the real UTC date — pass an explicit date in tests for determinism.
 */

export function computeStreak(days, today = new Date().toISOString().slice(0, 10)) {
  if (!days.length) return 0;
  const sorted = [...new Set(days)].sort().reverse();
  const yesterday = new Date(new Date(today).getTime() - 86400000).toISOString().slice(0, 10);
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (prev - curr) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export function computeWeekCount(days, today = new Date().toISOString().slice(0, 10)) {
  const weekAgo = new Date(new Date(today).getTime() - 7 * 86400000).toISOString().slice(0, 10);
  return days.filter((d) => d >= weekAgo).length;
}
