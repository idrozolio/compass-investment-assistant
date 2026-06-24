import React, { useState } from "react";
import {
  ArrowRight,
  Sparkles,
  FileText,
  HelpCircle,
  Database,
  TrendingUp,
  Loader2,
  Check,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

// ---------- Design tokens ----------
const palette = {
  ink: "#0B1F2A",
  paper: "#F6F4EE",
  rule: "#1A2F3B",
  rule2: "#D9D2C2",
  accent: "#3FA34D",
  accentInk: "#0E3B14",
  warn: "#C2562A",
  muted: "#5C6B73",
  cardInk: "#11293A",
};

const fontStack = {
  display: `"Fraunces", "Times New Roman", Georgia, serif`,
  body: `"Inter", system-ui, -apple-system, "Segoe UI", sans-serif`,
  mono: `"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace`,
};

// ---------- Claude API helper ----------
// The user pastes their own Anthropic API key once; it's stored in the
// browser's localStorage and never leaves their machine (except in the direct
// API request to Anthropic). The site author never sees it.
const API_KEY_STORAGE = "compass_anthropic_api_key";

function getApiKey() {
  try {
    return localStorage.getItem(API_KEY_STORAGE) || "";
  } catch {
    return "";
  }
}

function setApiKey(key) {
  try {
    if (key) localStorage.setItem(API_KEY_STORAGE, key);
    else localStorage.removeItem(API_KEY_STORAGE);
  } catch {}
}

async function callClaude(systemPrompt, userPrompt, expectJson = true) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("MISSING_KEY");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  if (!expectJson) return text;
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

const STEPS = [
  { id: "intake", label: "Intake", icon: FileText },
  { id: "understanding", label: "Understanding", icon: Sparkles },
  { id: "questions", label: "Questions", icon: HelpCircle },
  { id: "assumptions", label: "Assumptions", icon: Database },
  { id: "model", label: "Model & Returns", icon: TrendingUp },
];

const EXAMPLES = [
  "We are evaluating a 150 MW solar PV project in West Texas with a 20-year PPA at $42/MWh. Construction expected to complete in 18 months.",
  "We are considering building a new whisky distillery in the Galilee, Israel, producing 50,000 bottles annually after a 4-year maturation period.",
  "We are looking at acquiring a 60 MW operating wind farm in Croatia from a distressed seller. Asking price €78M.",
  "Joint venture for a 200 MWh battery storage facility in Arizona, providing grid services and merchant arbitrage.",
];

export default function App() {
  const [step, setStep] = useState("intake");
  const [projectText, setProjectText] = useState("");
  const [understanding, setUnderstanding] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [assumptions, setAssumptions] = useState(null);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasKey, setHasKey] = useState(() => Boolean(getApiKey()));
  const [showKeyModal, setShowKeyModal] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: palette.paper,
        color: palette.ink,
        fontFamily: fontStack.body,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        button { font-family: inherit; cursor: pointer; }
        input, textarea { font-family: inherit; }
        .num { font-family: ${fontStack.mono}; font-variant-numeric: tabular-nums; }
        .display { font-family: ${fontStack.display}; font-weight: 600; letter-spacing: -0.02em; }
        .eyebrow {
          font-family: ${fontStack.mono};
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: ${palette.muted};
        }
        .btn-primary {
          background: ${palette.ink};
          color: ${palette.paper};
          border: none;
          padding: 14px 22px;
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 0.02em;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: background 0.15s ease;
        }
        .btn-primary:hover:not(:disabled) { background: ${palette.accentInk}; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-ghost {
          background: transparent;
          border: 1px solid ${palette.rule2};
          color: ${palette.ink};
          padding: 10px 16px;
          font-weight: 500;
          font-size: 13px;
          transition: all 0.15s ease;
        }
        .btn-ghost:hover { border-color: ${palette.ink}; }
        .card {
          background: #FFFFFF;
          border: 1px solid ${palette.rule2};
          padding: 28px;
        }
        .field-label {
          font-family: ${fontStack.mono};
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: ${palette.muted};
          margin-bottom: 6px;
          display: block;
        }
        textarea, input[type="text"], input[type="number"] {
          width: 100%;
          background: ${palette.paper};
          border: 1px solid ${palette.rule2};
          padding: 12px 14px;
          font-size: 14px;
          color: ${palette.ink};
          outline: none;
          transition: border-color 0.15s;
        }
        textarea:focus, input:focus { border-color: ${palette.ink}; }
        .pulse { animation: pulse 1.4s ease-in-out infinite; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @media (max-width: 768px) {
          .responsive-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <header
        style={{
          borderBottom: `1px solid ${palette.rule2}`,
          padding: "20px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <div className="display" style={{ fontSize: 22, color: palette.ink }}>
            Compass
          </div>
          <div className="eyebrow" style={{ marginBottom: 0 }}>
            Investment evaluation, accelerated
          </div>
        </div>
        <div className="eyebrow" style={{ marginBottom: 0, display: "flex", alignItems: "center", gap: 16 }}>
          <span>built for Enlight · prototype v0.1</span>
          <button
            onClick={() => setShowKeyModal(true)}
            style={{
              background: hasKey ? "transparent" : palette.accent,
              border: `1px solid ${hasKey ? palette.rule2 : palette.accent}`,
              color: hasKey ? palette.muted : palette.paper,
              padding: "6px 12px",
              fontSize: 11,
              fontFamily: fontStack.mono,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {hasKey ? "API key ✓" : "Add API key"}
          </button>
        </div>
      </header>

      <Stepper currentStep={step} />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 48px 80px" }}>
        {error && (
          <div
            style={{
              background: "#FFF3EE",
              border: `1px solid ${palette.warn}`,
              padding: 14,
              marginBottom: 24,
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <AlertCircle size={18} color={palette.warn} />
            <div style={{ fontSize: 13, color: palette.warn }}>{error}</div>
          </div>
        )}

        {step === "intake" && (
          <Intake
            projectText={projectText}
            setProjectText={setProjectText}
            loading={loading}
            onSubmit={async () => {
              if (!projectText.trim()) {
                setError("Please describe a project first.");
                return;
              }
              setError(null);
              setLoading(true);
              try {
                const result = await callClaude(
                  `You are a senior investment analyst at a renewable energy company.
You receive a short, often unstructured project description and produce a tight, structured understanding.
Output ONLY a JSON object with this exact shape:
{
  "project_type": "string (e.g. Solar PV, Wind, Battery Storage, Distillery, Acquisition)",
  "one_line": "string (single sentence summarizing the deal)",
  "industry": "string",
  "business_model": "string (how it makes money in 1-2 sentences)",
  "revenue_drivers": ["string", ...],
  "cost_drivers": ["string", ...],
  "capex_components": ["string", ...],
  "financing_considerations": ["string", ...],
  "key_unknowns": ["string", ...]
}
Be specific to the project. No prose outside the JSON.`,
                  projectText
                );
                setUnderstanding(result);
                setStep("understanding");
              } catch (e) {
                if (e.message === "MISSING_KEY") {
                  setShowKeyModal(true);
                  setError("Add your Anthropic API key to continue.");
                } else {
                  setError("Could not analyze project. " + (e.message || ""));
                }
              } finally {
                setLoading(false);
              }
            }}
            onExample={(t) => setProjectText(t)}
          />
        )}

        {step === "understanding" && understanding && (
          <Understanding
            data={understanding}
            loading={loading}
            onBack={() => setStep("intake")}
            onNext={async () => {
              setError(null);
              setLoading(true);
              try {
                const result = await callClaude(
                  `You are a senior investment analyst. Given a structured understanding of a project, generate the most important follow-up questions needed to build a first-pass financial model.
Output ONLY a JSON object:
{
  "questions": [
    { "id": "q1", "category": "Revenue | Operations | CAPEX | Financing | Timing | Other",
      "question": "string", "hint": "short hint or typical unit",
      "suggested_default": "string with a reasonable industry-standard guess" },
    ...
  ]
}
Return between 6 and 9 questions. Tailor to the specific project type. Make hints concrete (e.g. "$/MWh", "years", "% of capex"). Suggested defaults should be realistic industry midpoints.`,
                  JSON.stringify(understanding)
                );
                setQuestions(result.questions || []);
                const initial = {};
                (result.questions || []).forEach((q) => {
                  initial[q.id] = q.suggested_default || "";
                });
                setAnswers(initial);
                setStep("questions");
              } catch (e) {
                if (e.message === "MISSING_KEY") {
                  setShowKeyModal(true);
                  setError("Add your Anthropic API key to continue.");
                } else {
                  setError("Could not generate questions. " + (e.message || ""));
                }
              } finally {
                setLoading(false);
              }
            }}
          />
        )}

        {step === "questions" && (
          <Questions
            questions={questions}
            answers={answers}
            setAnswers={setAnswers}
            loading={loading}
            onBack={() => setStep("understanding")}
            onNext={async () => {
              setError(null);
              setLoading(true);
              try {
                const qa = questions.map((q) => ({
                  question: q.question,
                  category: q.category,
                  answer: answers[q.id],
                }));
                const result = await callClaude(
                  `You are an investment analyst building the assumptions database for a project.
Given (1) the project understanding and (2) the analyst's answers to follow-up questions, produce a structured assumptions object.
Output ONLY a JSON object with this shape:
{
  "horizon_years": number (project life, 5-30),
  "currency": "USD" | "EUR" | "ILS",
  "revenue": [ { "name": "string", "value": "string with unit", "rationale": "1 short sentence" }, ... ],
  "opex": [ { "name": "string", "value": "string with unit", "rationale": "1 short sentence" }, ... ],
  "capex": [ { "name": "string", "value": "string with unit", "rationale": "1 short sentence" }, ... ],
  "financing": [ { "name": "string", "value": "string with unit", "rationale": "1 short sentence" }, ... ],
  "tax": [ { "name": "string", "value": "string with unit", "rationale": "1 short sentence" }, ... ],
  "key_numeric": {
     "total_capex_usd": number,
     "annual_revenue_year1_usd": number,
     "annual_opex_year1_usd": number,
     "revenue_growth_pct": number,
     "debt_share_pct": number,
     "interest_rate_pct": number,
     "tax_rate_pct": number,
     "horizon_years": number,
     "discount_rate_pct": number,
     "ramp_up_years": number
  }
}
For key_numeric, you MUST convert all monetary values to USD for consistent modeling. Use the analyst's answers where given, otherwise the suggested defaults, otherwise reasonable industry assumptions. ramp_up_years = years before full revenue (e.g. 4 for whisky, 0-1 for solar).`,
                  JSON.stringify({ understanding, answers: qa })
                );
                setAssumptions(result);
                setStep("assumptions");
              } catch (e) {
                if (e.message === "MISSING_KEY") {
                  setShowKeyModal(true);
                  setError("Add your Anthropic API key to continue.");
                } else {
                  setError("Could not build assumptions. " + (e.message || ""));
                }
              } finally {
                setLoading(false);
              }
            }}
          />
        )}

        {step === "assumptions" && assumptions && (
          <Assumptions
            data={assumptions}
            setData={setAssumptions}
            loading={loading}
            onBack={() => setStep("questions")}
            onNext={() => {
              const m = computeModel(assumptions);
              setModel(m);
              setStep("model");
            }}
          />
        )}

        {step === "model" && model && (
          <Model
            model={model}
            assumptions={assumptions}
            understanding={understanding}
            onBack={() => setStep("assumptions")}
            onRestart={() => {
              setStep("intake");
              setProjectText("");
              setUnderstanding(null);
              setQuestions([]);
              setAnswers({});
              setAssumptions(null);
              setModel(null);
            }}
          />
        )}
      </main>

      {(showKeyModal || !hasKey) && (
        <KeyModal
          initialOpen={!hasKey}
          onClose={() => setShowKeyModal(false)}
          onSave={(key) => {
            setApiKey(key);
            setHasKey(Boolean(key));
            setShowKeyModal(false);
            setError(null);
          }}
        />
      )}
    </div>
  );
}

function Stepper({ currentStep }) {
  const idx = STEPS.findIndex((s) => s.id === currentStep);
  return (
    <div
      style={{
        borderBottom: `1px solid ${palette.rule2}`,
        padding: "18px 48px",
        background: "#FFFFFF",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: 0,
        }}
      >
        {STEPS.map((s, i) => {
          const active = i === idx;
          const done = i < idx;
          return (
            <React.Fragment key={s.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  className="num"
                  style={{
                    width: 28,
                    height: 28,
                    border: `1px solid ${active || done ? palette.ink : palette.rule2}`,
                    background: active ? palette.ink : "transparent",
                    color: active ? palette.paper : done ? palette.ink : palette.muted,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {done ? <Check size={14} /> : String(i + 1).padStart(2, "0")}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    color: active ? palette.ink : palette.muted,
                  }}
                >
                  {s.label}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: palette.rule2,
                    margin: "0 16px",
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function Intake({ projectText, setProjectText, loading, onSubmit, onExample }) {
  return (
    <div>
      <div
        className="responsive-grid"
        style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 48, marginTop: 24 }}
      >
        <div>
          <div className="eyebrow">Step 01 — Intake</div>
          <h1 className="display" style={{ fontSize: 44, lineHeight: 1.05, margin: "8px 0 14px" }}>
            Describe the deal.
            <br />
            <span style={{ color: palette.accent }}>We'll do the analyst work.</span>
          </h1>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.6,
              color: palette.muted,
              maxWidth: 520,
              marginBottom: 28,
            }}
          >
            Paste a project brief, a teaser, or a one-liner. Compass identifies what
            matters, asks the questions a junior analyst would miss, and lands you on a
            first-pass model in minutes — not days.
          </p>

          <label className="field-label">Project description</label>
          <textarea
            rows={7}
            value={projectText}
            onChange={(e) => setProjectText(e.target.value)}
            placeholder="e.g. 150 MW solar PV project in West Texas, 20-year PPA at $42/MWh, COD expected Q3 2027…"
            style={{ resize: "vertical", marginBottom: 20 }}
          />

          <button
            className="btn-primary"
            onClick={onSubmit}
            disabled={loading || !projectText.trim()}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="pulse" /> Reading the deal
              </>
            ) : (
              <>
                Analyze project <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        <div>
          <div className="eyebrow">Try an example</div>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => onExample(ex)}
                style={{
                  textAlign: "left",
                  background: "#FFFFFF",
                  border: `1px solid ${palette.rule2}`,
                  padding: 14,
                  fontSize: 13,
                  lineHeight: 1.45,
                  color: palette.ink,
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = palette.ink)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = palette.rule2)}
              >
                <div
                  className="num"
                  style={{ fontSize: 11, color: palette.accent, marginBottom: 4 }}
                >
                  0{i + 1}
                </div>
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Understanding({ data, loading, onBack, onNext }) {
  return (
    <div>
      <div className="eyebrow">Step 02 — What Compass sees</div>
      <h2 className="display" style={{ fontSize: 32, margin: "8px 0 8px" }}>
        {data.one_line}
      </h2>
      <div
        style={{
          fontSize: 13,
          color: palette.muted,
          marginBottom: 28,
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <span>
          <span className="eyebrow" style={{ marginRight: 6 }}>Type</span>
          {data.project_type}
        </span>
        <span style={{ color: palette.rule2 }}>·</span>
        <span>
          <span className="eyebrow" style={{ marginRight: 6 }}>Industry</span>
          {data.industry}
        </span>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="eyebrow">Business model</div>
        <div style={{ fontSize: 15, marginTop: 6, lineHeight: 1.5 }}>
          {data.business_model}
        </div>
      </div>

      <div
        className="responsive-grid"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
      >
        <DriverList title="Revenue drivers" items={data.revenue_drivers} accent={palette.accent} />
        <DriverList title="Cost drivers" items={data.cost_drivers} />
        <DriverList title="CAPEX components" items={data.capex_components} />
        <DriverList title="Financing considerations" items={data.financing_considerations} />
      </div>

      {data.key_unknowns && data.key_unknowns.length > 0 && (
        <div
          style={{
            marginTop: 20,
            background: "#FFF3EE",
            border: `1px solid ${palette.warn}`,
            padding: 20,
          }}
        >
          <div className="eyebrow" style={{ color: palette.warn }}>
            Key unknowns Compass flagged
          </div>
          <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: 14, lineHeight: 1.7 }}>
            {data.key_unknowns.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
        <button className="btn-ghost" onClick={onBack}>Back</button>
        <button className="btn-primary" onClick={onNext} disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={16} className="pulse" /> Generating questions
            </>
          ) : (
            <>
              Ask the right questions <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function DriverList({ title, items, accent }) {
  return (
    <div className="card">
      <div className="eyebrow" style={{ color: accent || palette.muted }}>
        {title}
      </div>
      <ul style={{ margin: "10px 0 0", paddingLeft: 0, listStyle: "none" }}>
        {(items || []).map((it, i) => (
          <li
            key={i}
            style={{
              fontSize: 14,
              padding: "8px 0",
              borderBottom: i < items.length - 1 ? `1px solid ${palette.rule2}` : "none",
              display: "flex",
              gap: 10,
            }}
          >
            <span className="num" style={{ color: palette.muted, fontSize: 12 }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Questions({ questions, answers, setAnswers, loading, onBack, onNext }) {
  const grouped = questions.reduce((acc, q) => {
    acc[q.category] = acc[q.category] || [];
    acc[q.category].push(q);
    return acc;
  }, {});

  return (
    <div>
      <div className="eyebrow">Step 03 — Follow-up questions</div>
      <h2 className="display" style={{ fontSize: 32, margin: "8px 0 8px" }}>
        Confirm or correct.
      </h2>
      <p style={{ color: palette.muted, fontSize: 15, marginBottom: 28, maxWidth: 640 }}>
        Compass has populated reasonable industry defaults. Adjust anything you have
        better information on — empty fields will fall back to the defaults.
      </p>

      {Object.entries(grouped).map(([cat, qs]) => (
        <div key={cat} style={{ marginBottom: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            {cat}
          </div>
          <div
            className="responsive-grid"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            {qs.map((q) => (
              <div key={q.id} className="card" style={{ padding: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                  {q.question}
                </div>
                <div
                  className="num"
                  style={{ fontSize: 11, color: palette.muted, marginBottom: 10 }}
                >
                  {q.hint}
                </div>
                <input
                  type="text"
                  value={answers[q.id] || ""}
                  onChange={(e) =>
                    setAnswers({ ...answers, [q.id]: e.target.value })
                  }
                  placeholder={q.suggested_default}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
        <button className="btn-ghost" onClick={onBack}>Back</button>
        <button className="btn-primary" onClick={onNext} disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={16} className="pulse" /> Structuring assumptions
            </>
          ) : (
            <>
              Build assumptions <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Assumptions({ data, setData, loading, onBack, onNext }) {
  const sections = [
    { key: "revenue", label: "Revenue" },
    { key: "opex", label: "Operating expenses" },
    { key: "capex", label: "Capital expenditure" },
    { key: "financing", label: "Financing" },
    { key: "tax", label: "Tax" },
  ];

  return (
    <div>
      <div className="eyebrow">Step 04 — Assumptions database</div>
      <h2 className="display" style={{ fontSize: 32, margin: "8px 0 8px" }}>
        The model's backbone.
      </h2>
      <p style={{ color: palette.muted, fontSize: 15, marginBottom: 28, maxWidth: 640 }}>
        Every line is editable. The rationale column is what an analyst would write
        in the right margin of a model — keep it honest.
      </p>

      <div
        style={{
          display: "flex",
          gap: 24,
          marginBottom: 24,
          padding: 18,
          background: palette.ink,
          color: palette.paper,
          flexWrap: "wrap",
        }}
      >
        <KPI label="Horizon" value={`${data.horizon_years} years`} />
        <KPI label="Currency" value={data.currency} />
        <KPI label="Total CAPEX (USD)" value={fmt(data.key_numeric?.total_capex_usd)} />
        <KPI label="Yr1 Revenue (USD)" value={fmt(data.key_numeric?.annual_revenue_year1_usd)} />
        <KPI label="Discount rate" value={`${data.key_numeric?.discount_rate_pct}%`} />
      </div>

      {sections.map((s) => (
        <AssumptionTable
          key={s.key}
          title={s.label}
          rows={data[s.key] || []}
          onChange={(rows) => setData({ ...data, [s.key]: rows })}
        />
      ))}

      <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
        <button className="btn-ghost" onClick={onBack}>Back</button>
        <button className="btn-primary" onClick={onNext}>
          Generate model <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function KPI({ label, value }) {
  return (
    <div style={{ flex: 1, minWidth: 140, borderLeft: `2px solid ${palette.accent}`, paddingLeft: 12 }}>
      <div className="eyebrow" style={{ color: "rgba(246,244,238,0.6)", fontSize: 10 }}>
        {label}
      </div>
      <div className="num" style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}

function AssumptionTable({ title, rows, onChange }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>{title}</div>
      <div style={{ background: "#FFFFFF", border: `1px solid ${palette.rule2}`, overflowX: "auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr 2fr",
            padding: "10px 16px",
            background: palette.paper,
            borderBottom: `1px solid ${palette.rule2}`,
            fontSize: 11,
            fontFamily: fontStack.mono,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: palette.muted,
            minWidth: 600,
          }}
        >
          <div>Item</div>
          <div>Value</div>
          <div>Rationale</div>
        </div>
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 2fr",
              padding: "10px 16px",
              borderBottom: i < rows.length - 1 ? `1px solid ${palette.rule2}` : "none",
              alignItems: "center",
              gap: 12,
              minWidth: 600,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
            <input
              type="text"
              value={r.value}
              onChange={(e) => {
                const newRows = [...rows];
                newRows[i] = { ...r, value: e.target.value };
                onChange(newRows);
              }}
              style={{
                fontFamily: fontStack.mono,
                fontSize: 13,
                padding: "6px 10px",
                background: palette.paper,
              }}
            />
            <div style={{ fontSize: 12, color: palette.muted, lineHeight: 1.45 }}>
              {r.rationale}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function computeModel(a) {
  const k = a.key_numeric || {};
  const years = Math.max(5, Math.min(30, Number(k.horizon_years) || 15));
  const capex = Number(k.total_capex_usd) || 0;
  const rev1 = Number(k.annual_revenue_year1_usd) || 0;
  const opex1 = Number(k.annual_opex_year1_usd) || 0;
  const growth = (Number(k.revenue_growth_pct) || 0) / 100;
  const debtShare = (Number(k.debt_share_pct) || 0) / 100;
  const interest = (Number(k.interest_rate_pct) || 0) / 100;
  const tax = (Number(k.tax_rate_pct) || 0) / 100;
  const discount = (Number(k.discount_rate_pct) || 8) / 100;
  const ramp = Math.max(0, Math.min(years - 1, Number(k.ramp_up_years) || 0));

  const debt = capex * debtShare;
  const equity = capex - debt;
  const depreciation = capex / years;

  const rows = [];
  let peakFunding = equity;
  const equityCashflows = [-equity];

  const annualDebtPayment =
    debt > 0
      ? (debt * (interest * Math.pow(1 + interest, years))) /
        (Math.pow(1 + interest, years) - 1)
      : 0;
  let debtBalance = debt;

  rows.push({
    year: 0,
    revenue: 0,
    opex: 0,
    ebitda: 0,
    depreciation: 0,
    ebit: 0,
    interest: 0,
    tax: 0,
    netIncome: 0,
    capex: capex,
    debtDraw: debt,
    debtRepay: 0,
    fcf: -equity,
    cumCash: -equity,
  });

  let cumEquityCash = -equity;
  for (let y = 1; y <= years; y++) {
    let rampFactor;
    if (ramp === 0) {
      rampFactor = 1;
    } else {
      rampFactor = Math.min(1, y / (ramp + 1));
    }
    const revenue = rev1 * rampFactor * Math.pow(1 + growth, Math.max(0, y - ramp - 1));
    const opex = opex1 * (y === 1 ? 1 : Math.pow(1 + growth * 0.5, y - 1));
    const ebitda = revenue - opex;
    const dep = depreciation;
    const ebit = ebitda - dep;
    const interestExpense = debtBalance * interest;
    const principal = Math.max(0, annualDebtPayment - interestExpense);
    debtBalance = Math.max(0, debtBalance - principal);
    const ebt = ebit - interestExpense;
    const taxAmt = Math.max(0, ebt) * tax;
    const netIncome = ebt - taxAmt;
    const fcfEquity = netIncome + dep - principal;
    cumEquityCash += fcfEquity;
    if (cumEquityCash < -peakFunding) peakFunding = -cumEquityCash;
    equityCashflows.push(fcfEquity);
    rows.push({
      year: y,
      revenue,
      opex,
      ebitda,
      depreciation: dep,
      ebit,
      interest: interestExpense,
      tax: taxAmt,
      netIncome,
      capex: 0,
      debtDraw: 0,
      debtRepay: principal,
      fcf: fcfEquity,
      cumCash: cumEquityCash,
    });
  }

  const npv = equityCashflows.reduce(
    (sum, cf, i) => sum + cf / Math.pow(1 + discount, i),
    0
  );

  const irr = computeIRR(equityCashflows);

  let payback = null;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].cumCash >= 0) {
      const prev = rows[i - 1].cumCash;
      const curr = rows[i].cumCash;
      const frac = curr === prev ? 0 : -prev / (curr - prev);
      payback = i - 1 + frac;
      break;
    }
  }

  return {
    rows,
    npv,
    irr,
    payback,
    peakFunding: Math.max(equity, peakFunding),
    equity,
    debt,
    capex,
    discount: discount * 100,
    totalReturned: equityCashflows.slice(1).reduce((s, x) => s + x, 0),
  };
}

function computeIRR(cashflows) {
  const npvAt = (r) =>
    cashflows.reduce((sum, cf, i) => sum + cf / Math.pow(1 + r, i), 0);
  let low = -0.99;
  let high = 5;
  if (npvAt(low) * npvAt(high) > 0) return null;
  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const v = npvAt(mid);
    if (Math.abs(v) < 1) return mid;
    if (npvAt(low) * v < 0) high = mid;
    else low = mid;
  }
  return (low + high) / 2;
}

function Model({ model, assumptions, understanding, onBack, onRestart }) {
  const metrics = [
    {
      label: "IRR (equity)",
      value: model.irr != null ? `${(model.irr * 100).toFixed(1)}%` : "n/a",
      tone:
        model.irr != null &&
        model.irr > assumptions.key_numeric.discount_rate_pct / 100
          ? "good"
          : "neutral",
    },
    { label: "NPV (equity)", value: fmt(model.npv), tone: model.npv > 0 ? "good" : "warn" },
    {
      label: "Payback (years)",
      value: model.payback != null ? model.payback.toFixed(1) : "> horizon",
      tone: "neutral",
    },
    { label: "Peak funding (equity)", value: fmt(model.peakFunding), tone: "neutral" },
    { label: "Total CAPEX", value: fmt(model.capex), tone: "neutral" },
    {
      label: "Debt / Equity",
      value: `${fmt(model.debt)} / ${fmt(model.equity)}`,
      tone: "neutral",
    },
  ];

  const cumMin = Math.min(...model.rows.map((r) => r.cumCash));
  const cumMax = Math.max(...model.rows.map((r) => r.cumCash));
  const sparkW = 600;
  const sparkH = 120;
  const pts = model.rows
    .map((r, i) => {
      const x = (i / (model.rows.length - 1)) * sparkW;
      const y = sparkH - ((r.cumCash - cumMin) / (cumMax - cumMin || 1)) * sparkH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const zeroY = sparkH - ((0 - cumMin) / (cumMax - cumMin || 1)) * sparkH;

  return (
    <div>
      <div className="eyebrow">Step 05 — First-pass financial model</div>
      <h2 className="display" style={{ fontSize: 32, margin: "8px 0 8px" }}>
        Investment readout
      </h2>
      <p style={{ color: palette.muted, fontSize: 14, marginBottom: 28 }}>
        {understanding.one_line}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 0,
          background: palette.ink,
          color: palette.paper,
          marginBottom: 28,
        }}
      >
        {metrics.map((m, i) => (
          <div
            key={i}
            style={{
              padding: "22px 24px",
              borderRight: i % 3 !== 2 ? `1px solid rgba(246,244,238,0.12)` : "none",
              borderBottom: i < 3 ? `1px solid rgba(246,244,238,0.12)` : "none",
            }}
          >
            <div className="eyebrow" style={{ color: "rgba(246,244,238,0.55)", fontSize: 10 }}>
              {m.label}
            </div>
            <div
              className="num"
              style={{
                fontSize: 28,
                fontWeight: 600,
                marginTop: 6,
                color:
                  m.tone === "good"
                    ? palette.accent
                    : m.tone === "warn"
                    ? "#E89164"
                    : palette.paper,
              }}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="eyebrow">Cumulative equity cash flow</div>
        <svg
          viewBox={`0 0 ${sparkW} ${sparkH + 20}`}
          style={{ width: "100%", height: "auto", marginTop: 12 }}
        >
          <line
            x1={0}
            x2={sparkW}
            y1={zeroY}
            y2={zeroY}
            stroke={palette.rule2}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <polyline points={pts} fill="none" stroke={palette.accent} strokeWidth={2} />
          {model.rows.map((r, i) => {
            const x = (i / (model.rows.length - 1)) * sparkW;
            const y = sparkH - ((r.cumCash - cumMin) / (cumMax - cumMin || 1)) * sparkH;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={2.5} fill={palette.ink} />
                {i % Math.ceil(model.rows.length / 8) === 0 && (
                  <text
                    x={x}
                    y={sparkH + 14}
                    textAnchor="middle"
                    fontSize={9}
                    fill={palette.muted}
                    fontFamily={fontStack.mono}
                  >
                    Y{r.year}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="eyebrow" style={{ marginBottom: 8 }}>
        Project cash flow (USD)
      </div>
      <div
        style={{
          background: "#FFFFFF",
          border: `1px solid ${palette.rule2}`,
          overflowX: "auto",
          marginBottom: 28,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 12,
            fontFamily: fontStack.mono,
          }}
        >
          <thead>
            <tr style={{ background: palette.paper, borderBottom: `1px solid ${palette.rule2}` }}>
              <th style={th}>Year</th>
              <th style={th}>Revenue</th>
              <th style={th}>OPEX</th>
              <th style={th}>EBITDA</th>
              <th style={th}>D&amp;A</th>
              <th style={th}>Interest</th>
              <th style={th}>Tax</th>
              <th style={th}>Net Inc.</th>
              <th style={th}>CAPEX</th>
              <th style={th}>FCF (Eq.)</th>
              <th style={th}>Cum. Cash</th>
            </tr>
          </thead>
          <tbody>
            {model.rows.map((r, i) => (
              <tr
                key={i}
                style={{
                  borderBottom:
                    i < model.rows.length - 1 ? `1px solid ${palette.rule2}` : "none",
                  background: r.year === 0 ? "#FAF7EE" : "transparent",
                }}
              >
                <td style={{ ...td, fontWeight: 600 }}>{r.year}</td>
                <td style={td}>{fmtCompact(r.revenue)}</td>
                <td style={td}>{fmtCompact(r.opex)}</td>
                <td style={td}>{fmtCompact(r.ebitda)}</td>
                <td style={td}>{fmtCompact(r.depreciation)}</td>
                <td style={td}>{fmtCompact(r.interest)}</td>
                <td style={td}>{fmtCompact(r.tax)}</td>
                <td style={td}>{fmtCompact(r.netIncome)}</td>
                <td style={td}>{fmtCompact(r.capex)}</td>
                <td
                  style={{
                    ...td,
                    color: r.fcf < 0 ? palette.warn : palette.accentInk,
                    fontWeight: 600,
                  }}
                >
                  {fmtCompact(r.fcf)}
                </td>
                <td
                  style={{
                    ...td,
                    color: r.cumCash < 0 ? palette.warn : palette.accentInk,
                    fontWeight: 600,
                  }}
                >
                  {fmtCompact(r.cumCash)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          padding: 20,
          background: palette.paper,
          border: `1px solid ${palette.rule2}`,
          marginBottom: 24,
          fontSize: 13,
          lineHeight: 1.6,
          color: palette.muted,
        }}
      >
        <strong style={{ color: palette.ink }}>Caveat.</strong> This is a first-pass
        equity-perspective model intended to accelerate analyst review. Ramp-up,
        depreciation, and debt amortization use simplified conventions. Refine
        assumptions and rerun before any committee discussion.
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button className="btn-ghost" onClick={onBack}>Edit assumptions</button>
        <button className="btn-primary" onClick={onRestart}>
          <RefreshCw size={16} /> Evaluate another project
        </button>
      </div>
    </div>
  );
}

function KeyModal({ initialOpen, onClose, onSave }) {
  const [key, setKey] = useState(getApiKey());
  const existing = Boolean(getApiKey());

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(11,31,42,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        zIndex: 1000,
      }}
      onClick={!initialOpen ? onClose : undefined}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: palette.paper,
          maxWidth: 520,
          width: "100%",
          padding: 36,
          border: `1px solid ${palette.ink}`,
        }}
      >
        <div className="eyebrow">Setup</div>
        <h2 className="display" style={{ fontSize: 28, margin: "8px 0 14px" }}>
          {existing ? "Your API key" : "Add your Anthropic API key"}
        </h2>
        <p style={{ fontSize: 14, color: palette.muted, lineHeight: 1.55, marginBottom: 20 }}>
          Compass calls Anthropic's Claude API directly from your browser. The key is
          stored only in your browser (localStorage) and is sent only to{" "}
          <code style={{ fontFamily: fontStack.mono, fontSize: 12 }}>api.anthropic.com</code>
          . It never reaches any server we control.
        </p>
        <p style={{ fontSize: 14, color: palette.muted, lineHeight: 1.55, marginBottom: 20 }}>
          Get a key at{" "}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noreferrer"
            style={{ color: palette.accentInk, fontWeight: 600 }}
          >
            console.anthropic.com
          </a>
          . Free credits are included for new accounts.
        </p>

        <label className="field-label">Anthropic API key</label>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-ant-api03-..."
          style={{ fontFamily: fontStack.mono, fontSize: 13, marginBottom: 20 }}
          autoFocus
        />

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          {existing && (
            <button
              className="btn-ghost"
              onClick={() => {
                onSave("");
              }}
              style={{ color: palette.warn, borderColor: palette.warn }}
            >
              Remove key
            </button>
          )}
          {!initialOpen && (
            <button className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
          )}
          <button
            className="btn-primary"
            onClick={() => onSave(key.trim())}
            disabled={!key.trim()}
          >
            Save and continue <ArrowRight size={16} />
          </button>
        </div>

        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: `1px solid ${palette.rule2}`,
            fontSize: 12,
            color: palette.muted,
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: palette.ink }}>Note for reviewers:</strong> this prototype
          uses your key so demo costs go to you, not the project authors. Typical
          evaluation costs &lt; $0.10.
        </div>
      </div>
    </div>
  );
}


const th = {
  padding: "10px 12px",
  textAlign: "right",
  fontSize: 10,
  fontFamily: fontStack.mono,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: palette.muted,
  fontWeight: 600,
};
const td = {
  padding: "8px 12px",
  textAlign: "right",
};

function fmt(n) {
  if (n == null || isNaN(n)) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}
function fmtCompact(n) {
  if (n == null || isNaN(n) || n === 0) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(0)}K`;
  return `${sign}${abs.toFixed(0)}`;
}
