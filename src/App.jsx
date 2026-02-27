import { useState, useEffect, useCallback } from "react";
import { api } from "./api.js";
import { fmtUptime, fmtMb, NEON } from "./utils.js";
import { useWebSocket } from "./hooks/useWebSocket.js";
import StatBox from "./components/StatBox.jsx";
import Card from "./components/Card.jsx";
import Pill from "./components/Pill.jsx";
import ChatCard from "./components/ChatCard.jsx";
import EventLog from "./components/EventLog.jsx";
import Toast from "./components/Toast.jsx";

const btnStyle = (color, small = false) => ({
  background: "transparent",
  border: `1px solid ${color}44`,
  color,
  padding: small ? "3px 10px" : "5px 12px",
  borderRadius: 8,
  fontSize: small ? 11 : 12,
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: "opacity 0.15s",
  fontFamily: "monospace",
});

export default function App() {
  const [snapshot, setSnapshot] = useState(null);
  const [events, setEvents] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [filter, setFilter] = useState("all");

  // Persists the last known scoreboard for every chat across quiz end / bot crash.
  // Shape: { [chatId]: { scores, subject, year, endedAt } }
  const [lastScores, setLastScores] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("jamb_last_scores") || "{}");
    } catch {
      return {};
    }
  });

  const saveLastScores = useCallback((updated) => {
    setLastScores(updated);
    try {
      localStorage.setItem("jamb_last_scores", JSON.stringify(updated));
    } catch {}
  }, []);

  // ── Toast helper ────────────────────────────────────────────────
  const toast = useCallback((text, type = "ok") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, text, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  // ── WebSocket ────────────────────────────────────────────────────
  const handleSnapshot = useCallback((data) => {
    setSnapshot(data);

    // Whenever we see a chat with scores (active or not), save them.
    // This means as soon as the bot sends us live scores, we cache them.
    // When the quiz ends and scores disappear from the snapshot, we still
    // have them here.
    setLastScores((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const chat of data.chats || []) {
        if (chat.scores?.length > 0) {
          const existing = prev[chat.chatId];
          const incomingTop = chat.scores[0];
          const existingTop = existing?.scores?.[0];

          // Only update if scores actually changed (avoid unnecessary writes)
          if (
            !existing ||
            existing.subject !== chat.subject ||
            existing.year !== chat.year ||
            incomingTop?.score !== existingTop?.score ||
            chat.scores.length !== existing.scores?.length
          ) {
            next[chat.chatId] = {
              scores: chat.scores,
              subject: chat.subject,
              year: chat.year,
              savedAt: Date.now(),
            };
            changed = true;
          }
        }
      }

      if (changed) {
        try {
          localStorage.setItem("jamb_last_scores", JSON.stringify(next));
        } catch {}
        return next;
      }
      return prev;
    });
  }, []);

  const handleEvent = useCallback(
    (msg) => setEvents((ev) => [...ev.slice(-99), msg]),
    [],
  );
  const connected = useWebSocket(handleSnapshot, handleEvent);

  // ── REST polling fallback ────────────────────────────────────────
  useEffect(() => {
    const poll = async () => {
      try {
        const data = await api("/api/snapshot");
        if (!data.error) handleSnapshot(data);
      } catch (err) {
        console.log(err);
      }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [handleSnapshot]);

  // ── Events polling fallback ──────────────────────────────────────
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const { events: evs } = await api("/api/events");
        if (evs) setEvents(evs);
      } catch (err) {
        console.log(err);
      }
    }, 8000);
    return () => clearInterval(id);
  }, []);

  // ── Actions ──────────────────────────────────────────────────────
  const handleAction = useCallback(
    async (action, chatId, data) => {
      try {
        switch (action) {
          case "stopQuiz":
            await api("/api/quiz/stop", "POST", { chatId });
            toast("Quiz stopped");
            break;
          case "disableChat":
            await api("/api/chat/disable", "POST", { chatId });
            toast("Chat disabled");
            break;
          case "enableChat":
            await api("/api/chat/enable", "POST", { chatId });
            toast("Chat enabled ✓");
            break;
          case "saveConfig":
            await api("/api/config", "POST", { chatId, ...data });
            toast("Config saved ✓");
            break;
          case "globalDisable":
            await api("/api/global/disable", "POST", {});
            toast("Bot globally disabled ⚠️", "error");
            break;
          case "globalEnable":
            await api("/api/global/enable", "POST", {});
            toast("Bot globally enabled ✓");
            break;
          default:
            break;
        }
      } catch (err) {
        toast("Action failed: " + err.message, "error");
      }
    },
    [toast],
  );

  // ── Derived data ─────────────────────────────────────────────────
  const allChats = snapshot?.chats || [];
  const activeCount = allChats.filter((c) => c.isActive).length;
  const disabledCount = allChats.filter((c) => c.disabled).length;
  const totalPlayers = allChats.reduce((s, c) => s + (c.participants || 0), 0);

  const visibleChats = allChats.filter((c) => {
    if (filter === "active") return c.isActive;
    if (filter === "disabled") return c.disabled;
    return true;
  });

  // Global leaderboard — sum scores across all chats
  const globalLeader = {};
  for (const chat of allChats) {
    for (const s of chat.scores || []) {
      globalLeader[s.name] = (globalLeader[s.name] || 0) + s.score;
    }
  }
  const leaderboard = Object.entries(globalLeader)
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#eee",
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
        paddingBottom: 60,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Space+Grotesk:wght@400;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        button:hover { opacity: 0.75 !important; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Top bar ── */}
      <div
        style={{
          background: "rgba(0,0,0,0.85)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              fontSize: 20,
              fontWeight: 800,
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: -0.5,
            }}
          >
            <span style={{ color: "#00ff87" }}>JAMB</span>
            <span style={{ color: "#aaa" }}> Dashboard</span>
          </span>
          <Pill color={connected ? "#00ff87" : "#ff6b6b"}>
            {connected ? "● LIVE" : "○ OFFLINE"}
          </Pill>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {snapshot?.globalDisabled ? (
            <button
              onClick={() => handleAction("globalEnable")}
              style={btnStyle("#00ff87")}
            >
              🟢 Enable Bot
            </button>
          ) : (
            <button
              onClick={() => handleAction("globalDisable")}
              style={btnStyle("#ff6b6b")}
            >
              🔴 Disable Bot
            </button>
          )}
          {snapshot && (
            <span style={{ fontSize: 11, color: "#444" }}>
              uptime {fmtUptime(snapshot.uptime)}
            </span>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 24px 0" }}>
        {/* Loading state */}
        {!snapshot && (
          <div style={{ textAlign: "center", color: "#444", paddingTop: 80 }}>
            <div
              style={{
                fontSize: 32,
                animation: "spin 1s linear infinite",
                display: "inline-block",
              }}
            >
              ⟳
            </div>
            <div style={{ marginTop: 12 }}>Connecting to bot…</div>
            <div style={{ fontSize: 11, color: "#333", marginTop: 6 }}>
              Make sure api-server.js is running and VITE_API_URL is set
              correctly
            </div>
          </div>
        )}

        {snapshot && (
          <>
            {/* ── Stat row ── */}
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 24,
              }}
            >
              <StatBox
                label="Active Quizzes"
                value={activeCount}
                color="#00ff87"
              />
              <StatBox
                label="Players Now"
                value={totalPlayers}
                color="#00d4ff"
              />
              <StatBox
                label="Disabled Chats"
                value={disabledCount}
                color="#ff6b6b"
              />
              <StatBox
                label="AI Status"
                value={snapshot.aiStatus?.canTry ? "🟢" : "🟡"}
                color={snapshot.aiStatus?.canTry ? "#00ff87" : "#ffd93d"}
                sub={snapshot.aiStatus?.isOpen ? "Circuit open" : "Ready"}
              />
              <StatBox
                label="Memory"
                value={fmtMb(snapshot.memory?.heapUsed || 0)}
                color="#c77dff"
                sub="heap used"
              />
              <StatBox
                label="Bot Status"
                value={snapshot.globalDisabled ? "OFF" : "ON"}
                color={snapshot.globalDisabled ? "#ff6b6b" : "#00ff87"}
              />
            </div>

            {/* ── Main grid ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 320px",
                gap: 20,
                alignItems: "start",
              }}
            >
              {/* Left: Chat cards */}
              <div>
                {/* Filter tabs */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  {["all", "active", "disabled"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      style={{
                        ...btnStyle(filter === f ? "#00ff87" : "#444"),
                        background: filter === f ? "#00ff8714" : "transparent",
                        textTransform: "capitalize",
                      }}
                    >
                      {f}{" "}
                      {f === "all"
                        ? `(${allChats.length})`
                        : f === "active"
                          ? `(${activeCount})`
                          : `(${disabledCount})`}
                    </button>
                  ))}
                </div>

                {visibleChats.length === 0 && (
                  <div
                    style={{
                      color: "#444",
                      padding: 32,
                      textAlign: "center",
                      border: "1px dashed #222",
                      borderRadius: 12,
                    }}
                  >
                    No chats to show
                  </div>
                )}

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  {visibleChats.map((chat) => (
                    <ChatCard
                      key={chat.chatId}
                      chat={chat}
                      lastResult={lastScores[chat.chatId] || null}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              </div>

              {/* Right: Sidebar */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {/* Global leaderboard */}
                <Card>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#555",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      marginBottom: 12,
                    }}
                  >
                    🏆 Global Leaderboard
                  </div>
                  {leaderboard.length === 0 && (
                    <div style={{ color: "#444", fontSize: 12 }}>
                      No scores yet
                    </div>
                  )}
                  {leaderboard.map((p, i) => (
                    <div
                      key={p.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "6px 0",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "50%",
                          background:
                            i === 0
                              ? "#ffd93d33"
                              : i === 1
                                ? "#ffffff11"
                                : "#33333322",
                          fontSize: 11,
                          fontWeight: 700,
                          color:
                            i === 0
                              ? "#ffd93d"
                              : i === 1
                                ? "#ccc"
                                : i === 2
                                  ? "#cd7f32"
                                  : "#555",
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          fontSize: 13,
                          color: "#ccc",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.name}
                      </span>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontWeight: 700,
                          color: NEON[i % NEON.length],
                          fontSize: 14,
                        }}
                      >
                        {p.score}
                      </span>
                    </div>
                  ))}
                </Card>

                {/* AI status */}
                <Card>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#555",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      marginBottom: 12,
                    }}
                  >
                    🤖 AI Status
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      fontSize: 12,
                      color: "#aaa",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>Circuit breaker</span>
                      <Pill
                        color={
                          snapshot.aiStatus?.isOpen ? "#ff6b6b" : "#00ff87"
                        }
                      >
                        {snapshot.aiStatus?.isOpen ? "OPEN" : "CLOSED"}
                      </Pill>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>Failures</span>
                      <span style={{ fontFamily: "monospace", color: "#eee" }}>
                        {snapshot.aiStatus?.failures ?? 0}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>Can call AI</span>
                      <Pill
                        color={
                          snapshot.aiStatus?.canTry ? "#00ff87" : "#ffd93d"
                        }
                      >
                        {snapshot.aiStatus?.canTry ? "YES" : "NO"}
                      </Pill>
                    </div>
                    {snapshot.aiStatus?.isOpen && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#ff6b6b",
                          marginTop: 4,
                          lineHeight: 1.5,
                        }}
                      >
                        ⚠️ AI circuit open — likely no credits. Resets in ~10
                        min.
                      </div>
                    )}
                  </div>
                </Card>

                {/* Event log */}
                <Card>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#555",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      marginBottom: 12,
                    }}
                  >
                    📋 Event Log
                  </div>
                  <EventLog events={events} />
                </Card>
              </div>
            </div>
          </>
        )}
      </div>

      <Toast messages={toasts} />
    </div>
  );
}
