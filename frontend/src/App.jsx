import { useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:8001";

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [mission, setMission] = useState("");
  const [leaderMission, setLeaderMission] = useState("");
  const [plan, setPlan] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("Ready");
  const [error, setError] = useState("");

  async function request(path, body) {
    const response = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Request failed");
    return data;
  }

  async function saveKey() {
    setError("");
    try {
      await request("/api/settings", { openrouter_api_key: apiKey });
      setStatus("API key saved for this backend session");
    } catch (e) {
      setError(e.message);
    }
  }

  async function planTeam() {
    setError("");
    setPlan(null);
    setResult(null);
    setStatus("Planning agent team...");
    try {
      const data = await request("/api/plan", { mission });
      setPlan(data);
      setLeaderMission(mission);
      setStatus("Team plan ready");
    } catch (e) {
      setError(e.message);
      setStatus("Planning failed");
    }
  }

  async function executeTeam() {
    if (!plan) return;
    setError("");
    setResult(null);
    setStatus("Team is building the website...");
    try {
      const data = await request("/api/execute", {
        mission: leaderMission,
        plan,
      });
      setResult(data);
      setStatus(data.status === "completed" ? "Website generated" : "Build needs review");
    } catch (e) {
      setError(e.message);
      setStatus("Execution failed");
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">Z</span>
          <span>ZORITH</span>
        </div>
        <div className="top-status">
          <span className="status-dot" />
          {status}
        </div>
      </header>

      <section className="hero">
        <div className="eyebrow">AUTONOMOUS AGENT WORKSPACE</div>
        <h1>Build your agent team.</h1>
        <p>Describe the outcome. Zorith plans the team and coordinates the work.</p>
      </section>

      <section className="settings-card">
        <div>
          <div className="card-kicker">CONFIGURATION</div>
          <h2>OpenRouter API key</h2>
          <p className="muted">Your key stays in backend memory for this session.</p>
        </div>
        <div className="key-row">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-or-v1-..."
            autoComplete="off"
          />
          <button onClick={saveKey} disabled={!apiKey.trim()}>
            Save key
          </button>
        </div>
      </section>

      <section className="mission-card">
        <div className="card-kicker">01 / MISSION INTAKE</div>
        <label htmlFor="mission">What kind of agent team do you need?</label>
        <textarea
          id="mission"
          value={mission}
          onChange={(e) => setMission(e.target.value)}
          placeholder="Example: I need a team that can build modern business websites."
        />
        <div className="actions">
          <button className="primary" onClick={planTeam} disabled={!mission.trim()}>
            Plan agent team
          </button>
        </div>
      </section>

      {plan && (
        <section className="result-card">
          <div className="card-kicker">02 / DYNAMIC TEAM PLAN</div>
          <h2>{plan.team_name || "Your agent team"}</h2>
          <p className="muted">{plan.mission_summary}</p>

          <div className="agent-grid">
            {plan.agents?.map((agent, index) => (
              <article className="agent-card" key={`${agent.name}-${index}`}>
                <span className="agent-avatar">{index + 1}</span>
                <div>
                  <strong>{agent.name}</strong>
                  <p>{agent.role}</p>
                  <small>{agent.goal}</small>
                </div>
              </article>
            ))}
          </div>

          <h3>Execution plan</h3>
          <ol className="execution-list">
            {plan.execution_plan?.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </section>
      )}

      {plan && (
        <section className="mission-card">
          <div className="card-kicker">03 / TEAM LEADER BRIEF</div>
          <label htmlFor="leaderMission">Tell the team leader what to build</label>
          <textarea
            id="leaderMission"
            value={leaderMission}
            onChange={(e) => setLeaderMission(e.target.value)}
            placeholder="Describe the website, its audience, pages, features, and style..."
          />
          <div className="actions">
            <button
              className="primary"
              onClick={executeTeam}
              disabled={!leaderMission.trim()}
            >
              Execute website mission
            </button>
          </div>
        </section>
      )}

      {result && (
        <section className="result-card">
          <div className="card-kicker">04 / EXECUTION RESULTS</div>
          <h2>{result.summary}</h2>
          <p className="muted">Status: {result.status}</p>

          <h3>Generated files</h3>
          <ul className="file-list">
            {result.files?.map((file) => <li key={file}>{file}</li>)}
          </ul>

          <h3>Verification</h3>
          <ul className="check-list">
            {Object.entries(result.checks || {})
              .filter(([key]) => key !== "passed")
              .map(([key, passed]) => (
                <li key={key}>
                  <span className={passed ? "check-good" : "check-bad"}>
                    {passed ? "✓" : "✕"}
                  </span>
                  {key.replaceAll("_", " ")}
                </li>
              ))}
          </ul>

          {result.preview_url && (
            <a className="preview-link" href={result.preview_url} target="_blank" rel="noreferrer">
              Open generated website preview ↗
            </a>
          )}
          <p className="workspace-path">{result.workspace}</p>
        </section>
      )}

      {error && <div className="error">{error}</div>}
    </main>
  );
}