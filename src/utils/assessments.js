import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";

/**
 * Pre-subcollection accounts stored a single doc at assessments/{uid}.
 * Normalizes it to the item shape, or returns null if there's nothing usable.
 */
export async function fetchLegacyAssessment(uid) {
  const snap = await getDoc(doc(db, "assessments", uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  if (!d.title && !d.result) return null;
  return {
    id: "legacy",
    title: d.title || "My first assessment",
    goal: d.goal || "career",
    objective: d.objective || "",
    result: d.result || null,
    roadmap: d.roadmap || null,
    createdAt: d.createdAt || null,
    updatedAt: d.updatedAt || null,
    isLegacy: true,
  };
}

/**
 * Newest-first list from assessments/{uid}/items, falling back to the
 * legacy single doc for accounts that predate the subcollection.
 */
export async function loadAssessments(uid) {
  const snap = await getDocs(
    query(collection(db, "assessments", uid, "items"), orderBy("createdAt", "desc"))
  );
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (list.length) return list;
  const legacy = await fetchLegacyAssessment(uid);
  return legacy ? [legacy] : [];
}
