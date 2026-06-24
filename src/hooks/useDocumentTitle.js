import { useEffect } from "react";

const DEFAULT_DESCRIPTION =
  "Career Atlas — AI-powered career discovery for students. Take an adaptive quiz, get matched to careers, and follow a personalised roadmap.";

/**
 * Sets document.title and the meta description for the current route.
 * Lighter than react-helmet-async (no dependency) — fine for an SPA where
 * crawlers that execute JS (Google) pick up the updated tags on navigation.
 */
export default function useDocumentTitle(title, description = DEFAULT_DESCRIPTION) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", "description");
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", description);
    }
  }, [title, description]);
}
