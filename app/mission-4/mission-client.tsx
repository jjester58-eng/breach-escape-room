"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { InvestigationHeatmap, MissionCountdown, MissionScoreboard, type HeatNode } from "@/components/breach/MissionRuntime";
import { DIFFICULTY_TIMES, MISSION_RUNTIME_CONFIG, type DifficultyId, formatTime } from "@/lib/breach/mission-runtime";

type Option = { label: string; correct: boolean; feedback: string };
type Stage = { title: string; subtitle: string; briefing: string; evidence: { label: string; value: string }[]; question: string; context: string; options: Option[]; explanation: string; hint: string; targetId: string };

const stages: Stage[] = [
  {
    title: "Find the Unusual Connection", subtitle: "Identify the first suspicious network indicator",
    briefing: "The monitoring console flags an outbound connection that does not match the workstation's normal pattern. All addresses and hostnames below are fictional training data.",
    evidence: [
      { label: "16:41:02", value: "PC-22  →  203.0.113.77:443  |  outbound TLS session" },
      { label: "16:41:04", value: "DNS-GW-01  |  cdn-roobank-update.example resolved to 203.0.113.77" },
      { label: "16:38:19", value: "PC-18  →  198.51.100.12:443  |  normal approved service" },
      { label: "NETWORK NOTE", value: "203.0.113.0/24 is reserved for documentation in this simulation" },
    ],
    question: "Which event is the strongest starting point for the investigation?",
    context: "Do not assume every external connection is malicious. Compare the host, destination, and surrounding evidence.",
    options: [
      { label: "PC-22 connecting to 203.0.113.77 after resolving an unfamiliar update hostname", correct: true, feedback: "Correct. The unusual hostname and matching destination create a lead worth correlating with endpoint and DNS records." },
      { label: "PC-18 connecting to its known approved service", correct: false, feedback: "That connection is explicitly identified as normal approved traffic. It is a useful comparison, not the suspicious lead." },
      { label: "Any use of port 443 because HTTPS is always suspicious", correct: false, feedback: "Port 443 is commonly used for legitimate encrypted web traffic. Context and destination matter." },
    ],
    explanation: "A destination, hostname, timestamp, and source endpoint should be correlated. A single indicator is a lead—not proof of compromise.",
    hint: "Compare the DNS answer and outbound connection from the same workstation. The matching destination is the useful link.",
    targetId: "pc22",
  },
  {
    title: "Trace the Internal Movement", subtitle: "Follow the timeline between network devices",
    briefing: "A second log export shows internal connections shortly after the outbound session. The team needs to determine which source and destination should be examined next.",
    evidence: [
      { label: "16:42:11", value: "PC-22  →  FILE-SRV-01  |  TCP 445  |  new SMB session" },
      { label: "16:42:13", value: "FILE-SRV-01  |  access attempt to shared folder /Operations" },
      { label: "16:43:02", value: "PC-14  →  FILE-SRV-01  |  TCP 445  |  established baseline session" },
      { label: "BASELINE", value: "PC-22 has no prior SMB session to FILE-SRV-01 in the supplied 30-day sample" },
    ],
    question: "Which connection is the strongest indicator of possible lateral movement?",
    context: "Lateral movement means activity from one system toward another internal system after an initial foothold.",
    options: [
      { label: "The new SMB session from PC-22 to FILE-SRV-01", correct: true, feedback: "Correct. The new source-to-server relationship is unusual for PC-22 and follows the suspicious outbound event." },
      { label: "The established PC-14 baseline session", correct: false, feedback: "The log identifies this as established baseline activity. It provides a comparison." },
      { label: "The DNS query from PC-22 by itself", correct: false, feedback: "The DNS query is useful evidence, but the new internal SMB session is the clearest supplied lateral-movement lead." },
    ],
    explanation: "Correlate the timeline and baseline. A new internal connection can indicate lateral movement, but the analyst should validate authentication and server logs before declaring the server compromised.",
    hint: "Look for a new internal connection that is absent from the workstation's normal baseline.",
    targetId: "filesrv",
  },
  {
    title: "Correlate the Identity Logs", subtitle: "Determine which account needs follow-up",
    briefing: "Authentication records arrive from AUTH-SRV-01. A service account appears in a pattern that differs from its documented purpose.",
    evidence: [
      { label: "16:44:08", value: "svc-backup  |  interactive sign-in attempt from PC-22" },
      { label: "ACCOUNT POLICY", value: "svc-backup is intended for scheduled, non-interactive backup jobs" },
      { label: "16:44:12", value: "Authentication result: success in this simulated log" },
      { label: "16:10:00", value: "Last scheduled backup event: completed from BACKUP-01" },
    ],
    question: "What is the most defensible interpretation of the authentication record?",
    context: "A service account used interactively may indicate credential misuse, but the record should be corroborated before assigning intent.",
    options: [
      { label: "The svc-backup interactive sign-in from PC-22 is anomalous and needs investigation", correct: true, feedback: "Correct. The account's intended use and the source workstation do not match the documented baseline." },
      { label: "The account is safe because the sign-in succeeded", correct: false, feedback: "Successful authentication only means the credentials were accepted. It does not establish that the activity was authorized." },
      { label: "The database is confirmed compromised because an account signed in", correct: false, feedback: "The supplied record shows an authentication event, not database access. Do not claim more than the evidence supports." },
    ],
    explanation: "Investigators should preserve the authentication event, check account ownership and expected behavior, and correlate access to the target service.",
    hint: "Compare the account's intended use with the type and source of the sign-in.",
    targetId: "auth",
  },
  {
    title: "Contain Without Causing More Damage", subtitle: "Choose a proportionate response",
    briefing: "The incident lead asks for an immediate recommendation. The evidence points to PC-22 as the likely initial affected endpoint, but FILE-SRV-01 and the service account need validation.",
    evidence: [
      { label: "LIKELY AFFECTED ENDPOINT", value: "PC-22 — suspicious outbound session and new internal SMB activity" },
      { label: "SYSTEM TO VALIDATE", value: "FILE-SRV-01 — unusual access attempt; compromise not confirmed" },
      { label: "ACCOUNT TO REVIEW", value: "svc-backup — unexpected interactive sign-in" },
      { label: "BUSINESS IMPACT", value: "Broad network shutdown would interrupt unrelated services" },
    ],
    question: "Which containment recommendation best balances risk and business impact?",
    context: "Containment should limit spread while preserving evidence and avoiding unnecessary disruption.",
    options: [
      { label: "Isolate PC-22 using the approved endpoint procedure, preserve logs, and restrict the suspicious account pending validation", correct: true, feedback: "Correct. This targets the likely affected endpoint, preserves evidence, and addresses the anomalous identity without declaring every connected server compromised." },
      { label: "Disconnect every network device immediately", correct: false, feedback: "A broad shutdown creates unnecessary business impact and may destroy useful network context. Use proportionate containment." },
      { label: "Delete the suspicious logs and reboot PC-22", correct: false, feedback: "Deleting logs destroys evidence, and rebooting may alter volatile information. Preserve evidence and follow the incident process." },
    ],
    explanation: "Containment decisions should be evidence-based, proportionate, and coordinated. Preserve relevant logs and document the time and scope of every action.",
    hint: "Which action contains the most likely foothold without taking unrelated systems offline?",
    targetId: "pc22",
  },
  {
    title: "Make the Incident Call", subtitle: "Separate confirmed facts from open questions",
    briefing: "The team needs a short incident determination before the handoff to Mission 5. Your report must distinguish what the logs establish from what still needs confirmation.",
    evidence: [
      { label: "SUPPORTED BY LOGS", value: "PC-22 made an unusual outbound connection, opened a new SMB session, and initiated an anomalous service-account sign-in" },
      { label: "NOT YET CONFIRMED", value: "Data exfiltration, database access, and full compromise of FILE-SRV-01" },
      { label: "NEXT COLLECTION", value: "Endpoint timeline, FILE-SRV-01 access records, DNS history, and svc-backup ownership / use" },
      { label: "NEXT MISSION", value: "Incident Response — scope, contain, eradicate, recover" },
    ],
    question: "Which incident statement is the most accurate?",
    context: "A strong analyst reports facts, identifies hypotheses, and names the evidence needed to resolve uncertainty.",
    options: [
      { label: "PC-22 is the likely affected endpoint; lateral movement and credential misuse are supported leads, while server compromise and exfiltration remain unconfirmed", correct: true, feedback: "Correct. This conclusion is specific, evidence-based, and careful about what has not yet been established." },
      { label: "The attacker definitely stole the entire database", correct: false, feedback: "No supplied record demonstrates database access or exfiltration. This overstates the evidence." },
      { label: "Nothing happened because all network traffic used standard ports", correct: false, feedback: "Standard ports do not make activity safe. The timeline and baseline deviations are the important evidence." },
    ],
    explanation: "The handoff should include indicators, confidence, confirmed scope, open questions, and prioritized evidence requests.",
    hint: "Choose the statement that reports the strongest supported conclusion without turning an unanswered question into a fact.",
    targetId: "db",
  },
];

const initialNodes: HeatNode[] = MISSION_RUNTIME_CONFIG["mission-4"].targets.map((target, index) => ({
  ...target,
  proximity: [18, 12, 15, 10, 8][index] ?? 10,
}));

const difficulties: { id: DifficultyId; name: string; role: string; description: string }[] = [
  { id: "rookie", name: "ROOKIE INVESTIGATOR", role: "GUIDED RESPONSE", description: "20 minutes · guided clues · evidence labels and extra context" },
  { id: "analyst", name: "SECURITY ANALYST", role: "INDEPENDENT REVIEW", description: "15 minutes · rawer evidence · fewer prompts and hints" },
  { id: "commander", name: "INCIDENT COMMANDER", role: "ADVANCED RESPONSE", description: "12 minutes · competing priorities · limited hints" },
];

export default function MissionFourClient() {
  const [difficulty, setDifficulty] = useState<DifficultyId | null>(null);
  const [running, setRunning] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [expired, setExpired] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [stage, setStage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [nodes, setNodes] = useState<HeatNode[]>(initialNodes);
  const [selectedNode, setSelectedNode] = useState("pc22");
  const [hintOpen, setHintOpen] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [report, setReport] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!running || deadline === null || expired) return;
    const tick = () => {
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) {
        setRunning(false);
        setExpired(true);
      }
    };
    tick();
    const interval = window.setInterval(tick, 200);
    return () => window.clearInterval(interval);
  }, [running, deadline, expired]);

  const correctCount = useMemo(() => Object.entries(answers).filter(([key, value]) => stages[Number(key)]?.options[value]?.correct).length, [answers]);
  const completed = Object.keys(answers).length;
  const score = Math.max(0, correctCount * 15 - hintsUsed * 3);
  const timeBonus = difficulty && !expired ? Math.min(10, Math.floor((remaining / DIFFICULTY_TIMES[difficulty]) * 10)) : 0;
  const canSubmit = completed === stages.length && report.trim().length >= 80;
  const current = stages[stage];
  const selected = nodes.find((node) => node.id === selectedNode) ?? nodes[0];

  function start(nextDifficulty: DifficultyId) {
    const duration = DIFFICULTY_TIMES[nextDifficulty];
    setDifficulty(nextDifficulty);
    setRemaining(duration);
    setDeadline(Date.now() + duration * 1000);
    setRunning(true);
    setExpired(false);
    setStage(0);
    setAnswers({});
    setNodes(initialNodes.map((node) => ({ ...node })));
    setSelectedNode("pc22");
    setHintsUsed(0);
    setHintOpen(false);
    setReport("");
    setSubmitted(false);
  }

  function pauseOrResume() {
    if (expired || submitted) return;
    if (running) {
      setRunning(false);
      setDeadline(Date.now() + remaining * 1000);
    } else {
      setRunning(true);
    }
  }

  function choose(index: number) {
    if (answers[stage] !== undefined || expired || !running) return;
    const answer = current.options[index];
    setAnswers((previous) => ({ ...previous, [stage]: index }));
    setNodes((previous) => previous.map((node) => node.id === current.targetId
      ? { ...node, proximity: Math.max(0, Math.min(100, node.proximity + (answer.correct ? 55 : -18))) }
      : node));
    setSelectedNode(current.targetId);
    setHintOpen(false);
  }

  function useHint() {
    if (!hintOpen && !expired && running && hintsUsed < (difficulty === "rookie" ? 5 : difficulty === "analyst" ? 3 : 1)) {
      setHintsUsed((value) => value + 1);
    }
    setHintOpen((value) => !value);
  }

  function submitReport() {
    if (!canSubmit || expired) return;
    setSubmitted(true);
    setRunning(false);
  }

  const finalScore = Math.min(100, score + (submitted ? 15 + timeBonus : 0));

  if (difficulty === null) {
    return (
      <main className="game-shell">
        <nav className="game-nav"><Link className="brand" href="/"><span className="brand-mark">B</span><span>BREACH<span className="brand-period">.</span></span></Link><span className="topbar-status"><i /> TRAINING ENVIRONMENT</span></nav>
        <div className="game-heading"><Link href="/" className="back-link">← BACK TO CASE FILES</Link><div className="eyebrow">MISSION 04 / NETWORK DEFENSE</div><h1 className="game-title">NETWORK <em>UNDER ATTACK</em><span className="accent">.</span></h1><p className="game-lead">The network is still active. Trace the suspicious connections, identify the likely affected endpoint, and make a proportionate containment recommendation before the incident clock expires.</p></div>
        <section className="scenario-panel"><div className="panel-kicker">LIVE INCIDENT / CASE 0417-D</div><h2>THE ROOBANK NETWORK ALERT</h2><p>A workstation has contacted an unfamiliar external host. Minutes later, it opened a new connection to an internal file server and used a service account in an unexpected way. The security team needs an evidence-based response.</p><div className="scenario-meta"><span>SIMULATED NETWORK ONLY</span><span>5 INVESTIGATION STAGES</span><span>COUNTDOWN ACTIVE DURING PLAY</span></div></section>
        <div className="level-heading"><div><div className="eyebrow">SELECT YOUR RESPONSE ROLE</div><h2>CHOOSE A DIFFICULTY<span className="accent">.</span></h2></div><p>The timer, available guidance, and independence expected change with each role.</p></div>
        <div className="level-grid">{difficulties.map((item) => <button key={item.id} className="level-card" onClick={() => start(item.id)}><div className="level-top"><span>{item.role}</span><span className="level-time">{formatTime(DIFFICULTY_TIMES[item.id])}</span></div><h3>{item.name}</h3><p>{item.description}</p><div className="level-footer"><span>START TIMED INCIDENT</span><b>↗</b></div></button>)}</div>
        <p className="game-footnote">The countdown begins when you select a role. A warning appears at 60, 45, 30, and 20 seconds; the final 10 seconds flash once per second. Reduced-flashing mode is available.</p>
        <footer className="game-footer"><span>BREACH / FICTIONAL TRAINING ENVIRONMENT</span><span>NO LIVE NETWORKS · NO EXTERNAL TARGETS</span></footer>
      </main>
    );
  }

  if (submitted || expired) {
    return (
      <main className="game-shell completion-shell">
        <nav className="game-nav"><Link className="brand" href="/"><span className="brand-mark">B</span><span>BREACH<span className="brand-period">.</span></span></Link><span className="topbar-status"><i /> INCIDENT REVIEW</span></nav>
        <section className="completion-panel">
          <div className="completion-mark">{submitted ? "✓" : "!"}</div>
          <div className="eyebrow">MISSION 04 / {submitted ? "REPORT RECEIVED" : "TIME EXPIRED"}</div>
          <h1 className="game-title">{submitted ? <>NETWORK <em>CONTAINED</em></> : <>INCIDENT <em>CONTINUES</em></>}<span className="accent">.</span></h1>
          <p className="game-lead">{submitted ? "Your incident determination has been recorded in this browser session." : "The clock reached zero. Your investigation is locked, but the evidence you collected is still available for review."}</p>
          <div className="completion-stats"><div><strong>{finalScore}/100</strong><span>MISSION SCORE</span></div><div><strong>{correctCount}/5</strong><span>CORRECT DECISIONS</span></div><div><strong>{hintsUsed}</strong><span>HINTS USED</span></div></div>
          <div className="report-review"><div className="panel-kicker">INCIDENT DETERMINATION</div><p>{report || "No final incident report was submitted before the countdown expired."}</p></div>
          <div className="completion-actions"><button className="secondary-button" onClick={() => { setDifficulty(null); setDeadline(null); setExpired(false); setSubmitted(false); }}>RETURN TO ROLE SELECTION</button><button className="secondary-button" onClick={() => difficulty && start(difficulty)}>RESTART THIS INCIDENT ↻</button><Link className="secondary-button" href="/">RETURN TO CASE FILES</Link></div>
        </section>
      </main>
    );
  }

  return (
    <main className="game-shell">
      <nav className="game-nav"><Link className="brand" href="/"><span className="brand-mark">B</span><span>BREACH<span className="brand-period">.</span></span></Link><div className="mission-nav-label">MISSION 04 <span>/</span> NETWORK UNDER ATTACK</div><span className="topbar-status"><i /> {difficulty.toUpperCase()} ACTIVE</span></nav>
      <div className="play-header"><div><Link href="/mission-4" className="back-link">← EXIT INCIDENT</Link><div className="eyebrow">OPERATION ROOBANK / CASE 0417-D</div><h1 className="play-title">NETWORK <em>INVESTIGATION</em></h1></div><div className="play-meta"><strong>{formatTime(remaining)}</strong><span>TIME REMAINING</span></div></div>
      <MissionCountdown remainingSeconds={remaining} running={running} expired={expired} onToggle={pauseOrResume} reducedMotion={reducedMotion} onReducedMotionChange={setReducedMotion} />
      <div className="runtime-progress"><div><span>INVESTIGATION PROGRESS</span><strong>{completed} / 5 DECISIONS</strong></div><i><span style={{ width: (completed / 5 * 100) + "%" }} /></i></div>
      <MissionScoreboard score={score + (completed === 5 && report.trim().length >= 80 ? 15 + timeBonus : 0)} hintsUsed={hintsUsed} completed={completed} total={5} />
      <div className="mission4-layout">
        <section className="evidence-panel">
          <div className="evidence-heading"><div><div className="panel-kicker">STAGE 0{stage + 1} / NETWORK TELEMETRY</div><h2>{current.title}</h2><p>{current.subtitle}</p></div><span className="evidence-count">{current.evidence.length} RECORDS</span></div>
          <div className="mission2-briefing">{current.briefing}</div>
          <div className="mission2-evidence">{current.evidence.map((item) => <div className="mission2-evidence-row" key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
          <div className="challenge-card"><div className="challenge-number">DECISION {stage + 1} / 5</div><h3>{current.question}</h3><p className="challenge-context">{current.context}</p><div className="choice-list">{current.options.map((option, index) => <button type="button" key={option.label} disabled={answers[stage] !== undefined || !running} className={"choice-button " + (answers[stage] === index ? (option.correct ? "choice-correct" : "choice-wrong") : "") + (answers[stage] !== undefined && option.correct ? " choice-reveal" : "")} onClick={() => choose(index)}><span className="choice-letter">{String.fromCharCode(65 + index)}</span><span>{option.label}</span>{answers[stage] === index && <b>{option.correct ? "✓" : "×"}</b>}</button>)}</div>{answers[stage] !== undefined && <div className={"feedback-box " + (current.options[answers[stage]].correct ? "" : "feedback-review")}><strong>{current.options[answers[stage]].correct ? "ANALYST NOTE — CORRECT" : "ANALYST NOTE — REVIEW"}</strong><p>{current.options[answers[stage]].feedback}</p><small>{current.explanation}</small></div>}</div>
          <div className="mission2-stage-controls"><button className="secondary-button" disabled={stage === 0} onClick={() => { setStage((value) => Math.max(0, value - 1)); setHintOpen(false); }}>← PREVIOUS STAGE</button><button className="primary-button" disabled={answers[stage] === undefined || stage === 4 || !running} onClick={() => { setStage((value) => Math.min(4, value + 1)); setHintOpen(false); }}>NEXT INVESTIGATION STAGE ↗</button></div>
          <div className="hint-box"><button className="hint-toggle" disabled={!running || answers[stage] !== undefined || hintsUsed >= (difficulty === "rookie" ? 5 : difficulty === "analyst" ? 3 : 1)} onClick={useHint}>{hintOpen ? "HIDE" : "REQUEST"} ANALYST HINT · COST 3 POINTS</button>{hintOpen && <p>{current.hint}</p>}<small className="runtime-hint-limit">{difficulty === "rookie" ? 5 : difficulty === "analyst" ? 3 : 1} hints maximum for this role</small></div>
        </section>
        <aside className="mission4-sidebar">
          <InvestigationHeatmap nodes={nodes} selectedId={selectedNode} onSelect={setSelectedNode} />
          <section className="runtime-response-note"><span className="runtime-kicker">INCIDENT LEAD REMINDER</span><p>Use the heatmap to follow evidence. A hot lead means your investigation is converging; it does not replace validation or prove compromise by itself.</p></section>
        </aside>
      </div>
      {completed === 5 && <section className="report-panel"><div className="panel-kicker">FINAL TASK / INCIDENT HANDOFF</div><h2>WHAT SHOULD THE NEXT TEAM KNOW?</h2><p>Write at least 80 characters. Identify the likely affected endpoint, cite two log indicators, recommend containment, and state what is not yet confirmed.</p><textarea value={report} onChange={(event) => setReport(event.target.value)} rows={6} placeholder="My assessment: PC-22 is the likely affected endpoint because... The logs show... I recommend... The evidence does not yet confirm..."/><button className="primary-button" disabled={!canSubmit || !running} onClick={submitReport}>SUBMIT INCIDENT HANDOFF ↗</button><small>Submit before the clock expires. Your final score includes decisions, hint deductions, and a time bonus.</small></section>}
      <footer className="game-footer"><span>BREACH / FICTIONAL TRAINING ENVIRONMENT</span><span>NO LIVE NETWORKS · NO EXTERNAL TARGETS · SIMULATED LOGS ONLY</span></footer>
    </main>
  );
}
