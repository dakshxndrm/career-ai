import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { RESOURCE_CATEGORIES } from "../data/resourcesData";
import { C, font } from "../theme";

const PROVIDERS = ["All", "Free", "YouTube", "Udemy", "Web"];

export default function Resources() {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;

  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState("All");
  const [skillChips, setSkillChips] = useState([]);

  // Load newest assessment's skillsToLearn for personalised picks
  useEffect(() => {
    if (!uid) return;
    const load = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "assessments", uid, "items"), orderBy("createdAt", "desc"), limit(1))
        );
        if (snap.empty) return;
        const item = snap.docs[0].data();
        const skills = item.result?.skillsToLearn || [];
        setSkillChips(skills.slice(0, 8));
      } catch (err) {
        console.error("Resources:", err);
      }
    };
    load();
  }, [uid]);

  // Filter categories + items
  const filtered = RESOURCE_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.items.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch = !q
        || item.title.toLowerCase().includes(q)
        || item.provider.toLowerCase().includes(q)
        || cat.title.toLowerCase().includes(q);
      const matchProvider =
        filter === "All" ? true
        : filter === "Free" ? item.free
        : item.provider === filter;
      return matchSearch && matchProvider;
    }),
  })).filter((cat) => cat.items.length > 0);

  // Surface categories that match skill chips first
  const sortedCategories = skillChips.length > 0
    ? [...filtered].sort((a, b) => {
        const aMatch = skillChips.some((s) => a.keywords?.some((k) => s.toLowerCase().includes(k) || k.includes(s.toLowerCase())));
        const bMatch = skillChips.some((s) => b.keywords?.some((k) => s.toLowerCase().includes(k) || k.includes(s.toLowerCase())));
        return (bMatch ? 1 : 0) - (aMatch ? 1 : 0);
      })
    : filtered;

  return (
    <div className="page-enter">
      <style>{`
        .res-input { width:100%; padding:11px 14px; border-radius:10px; border:1.5px solid ${C.mist}; background:${C.paper}; color:${C.ink}; font-size:15px; font-family:${font.body}; outline:none; box-sizing:border-box; transition:border-color .15s; }
        .res-input:focus { border-color:${C.marigold}; }
        .res-chip { padding:7px 16px; border-radius:999px; border:1.5px solid ${C.mist}; background:${C.paper}; color:${C.ink}; font-size:13px; font-weight:600; cursor:pointer; font-family:${font.body}; transition:border-color .15s, background .15s; }
        .res-chip.active { border-color:${C.marigold}; background:${C.marigold}; color:#fff; }
        .res-card:hover { border-color:${C.marigold}; box-shadow:0 4px 18px rgba(22,22,29,.08); }
        @media(prefers-reduced-motion:reduce){ .res-card { transition:none; } }
      `}</style>

      <div style={{ minHeight: "100vh", background: C.paper, fontFamily: font.body, color: C.ink }}>
        <Navbar />

        <main style={{ maxWidth: 960, margin: "0 auto", padding: "56px clamp(20px,6vw,48px) 80px" }}>
          <p style={eyebrow}>Learning materials</p>
          <h1 style={h1}>Resources</h1>
          <p style={{ color: C.muted, fontSize: 15, margin: "8px 0 32px", lineHeight: 1.6 }}>
            A curated library of free and paid courses, videos, and guides — filtered to your career path.
          </p>

          {/* Personalised skill chips */}
          {skillChips.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".10em", textTransform: "uppercase", color: C.sage, margin: "0 0 10px" }}>
                Skills from your latest assessment
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {skillChips.map((s) => (
                  <span key={s} style={{ padding: "6px 14px", borderRadius: 999, background: `${C.sage}14`, color: C.sage, fontSize: 13, fontWeight: 600, border: `1px solid ${C.sage}28` }}>
                    {s}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: 12, color: C.muted, margin: "8px 0 0" }}>Matching categories are shown first.</p>
            </div>
          )}

          {/* Search + filter */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 36 }}>
            <div style={{ flex: "1 1 240px", position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16 }} aria-hidden="true">🔍</span>
              <input
                className="res-input"
                style={{ paddingLeft: 36 }}
                type="search"
                placeholder="Search courses, providers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search resources"
              />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {PROVIDERS.map((p) => (
                <button key={p} className={`res-chip${filter === p ? " active" : ""}`}
                  onClick={() => setFilter(p)} aria-pressed={filter === p}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          {sortedCategories.length === 0 ? (
            <p style={{ color: C.muted, fontSize: 15, textAlign: "center", padding: "40px 0" }}>
              No resources match your search. Try a different keyword or clear the filter.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 44 }}>
              {sortedCategories.map((cat) => (
                <section key={cat.id} aria-labelledby={`cat-${cat.id}`}>
                  <h2 id={`cat-${cat.id}`} style={{ fontFamily: font.display, fontSize: "clamp(18px,3vw,22px)", fontWeight: 800, color: C.ink, margin: "0 0 4px" }}>
                    {cat.title}
                  </h2>
                  <p style={{ fontSize: 14, color: C.muted, margin: "0 0 18px", lineHeight: 1.55 }}>{cat.blurb}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                    {cat.items.map((item) => (
                      <a
                        key={item.url}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="res-card"
                        style={{
                          display: "block", padding: "20px 22px",
                          background: "#fff", border: `1.5px solid ${C.mist}`,
                          borderRadius: 14, textDecoration: "none",
                          color: "inherit", transition: "border-color .15s, box-shadow .15s",
                        }}
                      >
                        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                          <ProviderTag provider={item.provider} />
                          {item.free
                            ? <span style={{ fontSize: 11, fontWeight: 700, color: C.sage, background: `${C.sage}14`, padding: "3px 8px", borderRadius: 4 }}>Free</span>
                            : <span style={{ fontSize: 11, fontWeight: 700, color: C.marigold, background: `${C.marigold}14`, padding: "3px 8px", borderRadius: 4 }}>Paid</span>
                          }
                        </div>
                        <h3 style={{ fontFamily: font.body, fontSize: 15, fontWeight: 700, color: C.ink, margin: "0 0 8px", lineHeight: 1.4 }}>
                          {item.title}
                        </h3>
                        {item.note && (
                          <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.55 }}>{item.note}</p>
                        )}
                        <p style={{ fontSize: 12, color: C.marigold, fontWeight: 600, margin: "10px 0 0" }}>Open →</p>
                      </a>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ProviderTag({ provider }) {
  const colors = {
    YouTube: { bg: "#ff0000", color: "#fff" },
    Udemy:   { bg: "#a435f0", color: "#fff" },
    Web:     { bg: C.mist,   color: C.ink   },
  };
  const { bg, color } = colors[provider] || { bg: C.mist, color: C.ink };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, background: bg, color, padding: "3px 8px", borderRadius: 4 }}>
      {provider}
    </span>
  );
}

const eyebrow = { fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: C.sage, margin: 0 };
const h1      = { fontFamily: font.display, fontSize: "clamp(26px,5vw,34px)", fontWeight: 900, color: C.ink, margin: "8px 0 0", lineHeight: 1.1 };
