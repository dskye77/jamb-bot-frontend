import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import Card from "./Card.jsx";
import Pill from "./Pill.jsx";
import ProgressBar from "./ProgressBar.jsx";
import { NEON, BAR_COLORS, shortId } from "../utils.js";

const btnStyle = (color, small = false) => ({
  background: "transparent",
  border: `1px solid ${color}44`,
  color,
  padding: small ? "3px 10px" : "5px 12px",
  borderRadius: 8,
  fontSize: small ? 11 : 12,
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: "background 0.15s",
  fontFamily: "monospace",
});

const labelStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 12,
  color: "#aaa",
};

const inputStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 6,
  color: "#eee",
  padding: "4px 8px",
  width: 90,
  fontFamily: "monospace",
  fontSize: 13,
};

export default function ChatCard({ chat, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [cfg, setCfg] = useState({
    questionInterval: 30,
    delayBeforeNextQuestion: 5,
    maxQuestionsPerQuiz: 50,
  });

  const topScore = chat.scores[0];

  return (
    <Card
      style={{
        borderColor: chat.isActive
          ? "rgba(0,255,135,0.25)"
          : chat.disabled
            ? "rgba(255,107,107,0.15)"
            : "rgba(255,255,255,0.06)",
        transition: "border-color 0.3s",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: chat.isActive
                  ? "#00ff87"
                  : chat.disabled
                    ? "#ff6b6b"
                    : "#555",
                flexShrink: 0,
                boxShadow: chat.isActive ? "0 0 8px #00ff87" : "none",
                animation: chat.isActive ? "pulse 2s infinite" : "none",
              }}
            />
            <span
              style={{ fontFamily: "monospace", fontSize: 12, color: "#aaa" }}
            >
              {shortId(chat.chatId)}
            </span>
            {chat.disabled && <Pill color="#ff6b6b">DISABLED</Pill>}
            {chat.isActive && <Pill color="#00ff87">LIVE</Pill>}
          </div>

          {chat.isActive && (
            <>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#eee",
                  marginBottom: 6,
                }}
              >
                {(chat.subject || "").toUpperCase()} — {chat.year}
              </div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
                Q {chat.currentQuestion}/{chat.totalQuestions} ·{" "}
                {chat.participants} player{chat.participants !== 1 ? "s" : ""}
              </div>
              <ProgressBar
                value={chat.currentQuestion - 1}
                max={chat.totalQuestions}
              />
              {topScore && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#00d4ff" }}>
                  🥇 {topScore.name} — {topScore.score} pts
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Action buttons ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            flexShrink: 0,
          }}
        >
          {chat.isActive && (
            <button
              onClick={() => onAction("stopQuiz", chat.chatId)}
              style={btnStyle("#ff6b6b")}
            >
              ⏹ Stop
            </button>
          )}
          {!chat.disabled ? (
            <button
              onClick={() => onAction("disableChat", chat.chatId)}
              style={btnStyle("#ff9f1c")}
            >
              🔇 Disable
            </button>
          ) : (
            <button
              onClick={() => onAction("enableChat", chat.chatId)}
              style={btnStyle("#00ff87")}
            >
              🔊 Enable
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            style={btnStyle("#555")}
          >
            {expanded ? "▲ Less" : "▼ More"}
          </button>
        </div>
      </div>

      {/* ── Expanded: Scoreboard ── */}
      {expanded && chat.scores.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              fontSize: 11,
              color: "#555",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            Scoreboard
          </div>
          {chat.scores.slice(0, 10).map((s, i) => (
            <div
              key={s.uid}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "5px 0",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <span
                style={{
                  width: 20,
                  color:
                    i === 0
                      ? "#ffd93d"
                      : i === 1
                        ? "#aaa"
                        : i === 2
                          ? "#cd7f32"
                          : "#555",
                  fontSize: 12,
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                {i + 1}
              </span>
              <span style={{ flex: 1, fontSize: 13, color: "#ccc" }}>
                {s.name}
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontWeight: 700,
                  color: NEON[i % NEON.length],
                }}
              >
                {s.score}
              </span>
            </div>
          ))}

          {chat.scores.length > 1 && (
            <div style={{ marginTop: 16, height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chat.scores.slice(0, 8)}
                  margin={{ top: 0, right: 0, bottom: 0, left: -20 }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#666" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#666" }} />
                  <Tooltip
                    contentStyle={{
                      background: "#111",
                      border: "1px solid #333",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#aaa" }}
                    itemStyle={{ color: "#00ff87" }}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {chat.scores.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ── Expanded: Config editor ── */}
      {expanded && (
        <div
          style={{
            marginTop: 16,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "#555",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Quiz Config
            </span>
            <button
              onClick={() => setEditing(!editing)}
              style={btnStyle("#00d4ff", true)}
            >
              {editing ? "Cancel" : "✏️ Edit"}
            </button>
          </div>

          {editing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={labelStyle}>
                <span>Question time (s)</span>
                <input
                  type="number"
                  value={cfg.questionInterval}
                  min={5}
                  max={300}
                  onChange={(e) =>
                    setCfg((c) => ({ ...c, questionInterval: +e.target.value }))
                  }
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                <span>Delay between Qs (s)</span>
                <input
                  type="number"
                  value={cfg.delayBeforeNextQuestion}
                  min={1}
                  max={60}
                  onChange={(e) =>
                    setCfg((c) => ({
                      ...c,
                      delayBeforeNextQuestion: +e.target.value,
                    }))
                  }
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                <span>Max questions</span>
                <input
                  type="number"
                  value={cfg.maxQuestionsPerQuiz}
                  min={1}
                  max={200}
                  onChange={(e) =>
                    setCfg((c) => ({
                      ...c,
                      maxQuestionsPerQuiz: +e.target.value,
                    }))
                  }
                  style={inputStyle}
                />
              </label>
              <button
                onClick={() => {
                  onAction("saveConfig", chat.chatId, cfg);
                  setEditing(false);
                }}
                style={btnStyle("#00ff87")}
              >
                💾 Save
              </button>
            </div>
          ) : (
            <div
              style={{ fontSize: 12, color: "#666", fontFamily: "monospace" }}
            >
              Click Edit to configure this chat&apos;s quiz settings
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
