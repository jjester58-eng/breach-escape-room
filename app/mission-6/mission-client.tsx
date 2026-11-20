"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Point = { x: number; y: number };
type Evidence = { id: string; icon: string; name: string; location: string; detail: string; x: number; y: number; lesson: string };

const evidence: Evidence[] = [
  { id: "badge", icon: "▣", name: "VISITOR BADGE LOG", location: "FRONT DESK", detail: "Badge V-17 was issued to a guest, then used at the staff-only east door 11 minutes later. The guest profile lists no reason for staff access.", x: 21, y: 60, lesson: "A badge record is a lead, not proof by itself. Compare it with the access log and the visitor's stated purpose." },
  { id: "terminal", icon: "⌨", name: "UNATTENDED TERMINAL", location: "BUSINESS LOUNGE", detail: "A staff terminal is unlocked. The password reset page for the hotel booking system is open. A note beside it says: 'Call me back on the number in the email.'", x: 56, y: 31, lesson: "Never use contact details supplied by a suspicious message to verify a request. Use a known, independent channel." },
  { id: "roster", icon: "▤", name: "SHIFT ROSTER", location: "SERVICE HALL", detail: "The visitor asked which employee handles account resets. The roster shows that employee, Mina, starts her break at 14:20.", x: 75, y: 66, lesson: "Attackers can use harmless-seeming questions to learn routines and target the right person at the right time." },
  { id: "phone", icon: "◉", name: "CALLBACK RECORD", location: "LOBBY PHONE", detail: "Mina's desk phone received a call from the number printed in the reset email. The call lasted 48 seconds and was not logged as an IT support call.", x: 37, y: 76, lesson: "A matching timeline strengthens an investigation. Preserve records and confirm who made the call before drawing conclusions." },
];
const route: Point[] = [{ x: 35, y: 50 }, { x: 46, y: 50 }, { x: 46, y: 40 }, { x: 68, y: 40 }, { x: 68, y: 57 }, { x: 84, y: 57 }];

export default function MissionSixClient() {
  const [player, setPlayer] = useState<Point>({ x: 12, y: 52 });
  const [suspectStep, setSuspectStep] = useState(0);
  const [found, setFound] = useState<string[]>([]);
  const [selected, setSelected] = useState<Evidence | null>(null);
  const [decision, setDecision] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [storedXp, setStoredXp] = useState(0);
  const [time, setTime] = useState(0);

  const currentTarget = useMemo(() => evidence.filter((item) => !found.includes(item.id)).sort((a, b) => {
    const da = Math.hypot(a.x - player.x, a.y - player.y); const db = Math.hypot(b.x - player.x, b.y - player.y); return da - db;
  })[0], [found, player]);

  useEffect(() => { const id = window.setInterval(() => setTime((t) => t + 1), 1000); return () => window.clearInterval(id); }, []);
  useEffect(() => { const id = window.setInterval(() => setSuspectStep((step) => Math.min(step + 1, route.length - 1)), 3400); return () => window.clearInterval(id); }, []);
  useEffect(() => {
    try {
      const record = JSON.parse(window.localStorage.getItem("breach-campaign") || "{}");
      if (record.completedMissions?.includes("mission-6")) { setCompleted(true); setStoredXp(Number(record.xp || 0)); }
    } catch { /* Ignore an invalid local save and allow a fresh mission. */ }
  }, []);
  useEffect(() => {
    function move(event: KeyboardEvent) {
      const directions: Record<string, Point> = { ArrowUp: { x: 0, y: -4 }, w: { x: 0, y: -4 }, W: { x: 0, y: -4 }, ArrowDown: { x: 0, y: 4 }, s: { x: 0, y: 4 }, S: { x: 0, y: 4 }, ArrowLeft: { x: -4, y: 0 }, a: { x: -4, y: 0 }, A: { x: -4, y: 0 }, ArrowRight: { x: 4, y: 0 }, d: { x: 4, y: 0 }, D: { x: 4, y: 0 } };
      const direction = directions[event.key];
      if (direction) { event.preventDefault(); setPlayer((p) => ({ x: Math.max(5, Math.min(95, p.x + direction.x)), y: Math.max(12, Math.min(88, p.y + direction.y)) })); }
      if (event.key.toLowerCase() === "e") interact();
    }
    window.addEventListener("keydown", move); return () => window.removeEventListener("keydown", move);
  });

  const interact = useCallback(() => {
    const nearby = evidence.find((item) => !found.includes(item.id) && Math.hypot(item.x - player.x, item.y - player.y) < 11);
    if (nearby) { setSelected(nearby); setFound((items) => items.includes(nearby.id) ? items : [...items, nearby.id]); }
  }, [found, player]);

  const finish = (answer: string) => {
    setDecision(answer);
    if (answer === "correct" && !completed && found.length === evidence.length) {
      const record = JSON.parse(window.localStorage.getItem("breach-campaign") || "{}");
      const missions = Array.isArray(record.completedMissions) ? record.completedMissions : [];
      if (missions.includes("mission-6")) { setStoredXp(Number(record.xp || 0)); setCompleted(true); return; }
      const xp = Number(record.xp || 0) + 250;
      if (!missions.includes("mission-6")) missions.push("mission-6");
      record.xp = xp; record.completedMissions = missions;
      window.localStorage.setItem("breach-campaign", JSON.stringify(record)); setStoredXp(xp); setCompleted(true);
    }
  };

  const playerStyle = { left: `${player.x}%`, top: `${player.y}%` };
  const suspect = route[suspectStep];

  return <main className="game-shell mission6-shell">
    <nav className="game-nav"><Link className="brand" href="/"><span className="brand-mark">B</span><span>BREACH<span className="brand-period">.</span></span></Link><span className="mission-nav-label">FIELD OPERATIONS / MISSION 06</span><span className="topbar-status"><i /> SIMULATION ACTIVE</span></nav>
    <header className="game-heading"><Link href="/" className="back-link">← BACK TO CASE FILES</Link><div className="eyebrow">IMPOSTER MISSION / HOTEL MERIDIAN</div><h1 className="game-title">THE <em>STOLEN CREDENTIALS</em><span className="accent">.</span></h1><p className="game-lead">A visitor is asking staff about account resets. Follow their route, inspect what they leave behind, and stop a suspicious reset before credentials are exposed.</p></header>
    <section className="scenario-panel mission6-brief"><div className="panel-kicker">INCIDENT BRIEF / 0417-B</div><h2>THE VISITOR IS STILL INSIDE</h2><p>A hotel employee reported a guest asking detailed questions about the booking system. A staff badge was used at a restricted door soon afterward. Investigate the shared lobby and service areas. This is a fictional training environment.</p><div className="scenario-meta"><span>OBJECTIVE: COLLECT EVIDENCE</span><span>MOVE: WASD / ARROW KEYS</span><span>INTERACT: E</span></div></section>

    <div className="mission6-status"><div><span>TIME ON SCENE</span><strong>{String(Math.floor(time / 60)).padStart(2,"0")}:{String(time % 60).padStart(2,"0")}</strong></div><div><span>EVIDENCE COLLECTED</span><strong>{found.length} / {evidence.length}</strong></div><div><span>FOLLOW THE VISITOR</span><strong>{suspectStep >= route.length - 1 ? "EAST WING" : `ZONE ${String.fromCharCode(65 + suspectStep)}`}</strong></div></div>

    <section className="mission6-layout">
      <div className="mission6-map-panel"><div className="mission6-map-heading"><div><span className="runtime-kicker">HOTEL MERIDIAN / FLOOR 1</span><h2>LIVE SCENE MAP</h2></div><span className="mission6-map-legend"><i className="player-dot"/> YOU <i className="suspect-dot"/> VISITOR <i className="clue-dot"/> CLUE</span></div>
        <div className="mission6-map" aria-label="Top down hotel map. Use arrow keys or WASD to move between the lobby, business lounge, and service hall.">
          <div className="map-room room-lobby"><b>MAIN LOBBY</b><span>RECEPTION · LOUNGE</span></div><div className="map-room room-lounge"><b>BUSINESS LOUNGE</b><span>GUEST SERVICES</span></div><div className="map-room room-service"><b>SERVICE HALL</b><span>STAFF ACCESS</span></div><div className="map-corridor"/><div className="map-plant plant-one">♣</div><div className="map-plant plant-two">♣</div><div className="map-desk">RECEPTION</div><div className="map-desk desk-two">WORKSTATION</div>
          <div className="map-route" aria-hidden="true">{route.slice(0, suspectStep + 1).map((point, i) => <i key={i} style={{ left: `${point.x}%`, top: `${point.y}%` }} />)}</div>
          {evidence.map((item) => <div key={item.id} className={`map-clue ${found.includes(item.id) ? "clue-found" : ""}`} style={{ left: `${item.x}%`, top: `${item.y}%` }} aria-label={`${found.includes(item.id) ? "Collected" : "Uncollected clue"}: ${item.name}`} title={item.name}>{found.includes(item.id) ? "✓" : "!"}</div>)}
          <div className="map-character player-character" style={playerStyle} aria-label="Your investigator">YOU</div><div className="map-character visitor-character" style={{ left: `${suspect.x}%`, top: `${suspect.y}%` }} aria-label="Suspicious visitor"><span>?</span>VISITOR</div>
        </div>
        <div className="mission6-controls"><div className="mission6-dpad" aria-label="Movement controls"><button onClick={() => setPlayer((p) => ({ ...p, y: Math.max(12, p.y - 7) }))}>↑</button><div><button onClick={() => setPlayer((p) => ({ ...p, x: Math.max(5, p.x - 7) }))}>←</button><button onClick={() => setPlayer((p) => ({ ...p, y: Math.min(88, p.y + 7) }))}>↓</button><button onClick={() => setPlayer((p) => ({ ...p, x: Math.min(95, p.x + 7) }))}>→</button></div></div><button className="primary-button" onClick={interact} disabled={!currentTarget || Math.hypot(currentTarget.x - player.x, currentTarget.y - player.y) >= 11}>INSPECT NEARBY <span> E ↗</span></button><span className="mission6-control-hint">Touch controls work on tablets and phones.</span></div>
      </div>
      <aside className="mission6-sidebar"><section className="evidence-panel"><div className="panel-kicker">CASE NOTES</div><h2>COLLECTED EVIDENCE</h2>{found.length === 0 ? <p className="mission6-empty">No evidence collected yet. Follow the visitor and inspect marked objects when you get close.</p> : <ul className="mission6-evidence-list">{evidence.filter((item) => found.includes(item.id)).map((item) => <li key={item.id}><span>{item.icon}</span><div><strong>{item.name}</strong><small>{item.location}</small></div><button onClick={() => setSelected(item)} aria-label={`Read ${item.name}`}>↗</button></li>)}</ul>}
          {selected && <div className="mission6-evidence-detail"><span className="runtime-kicker">{selected.location} / EVIDENCE</span><p>{selected.detail}</p><small>WHY IT MATTERS</small><p>{selected.lesson}</p></div>}
        </section><section className="mission6-objective"><span className="runtime-kicker">CURRENT OBJECTIVE</span><strong>{found.length < evidence.length ? "Inspect the marked evidence" : "Choose a safe response"}</strong><p>{found.length < evidence.length ? `Move toward ${currentTarget?.name.toLowerCase() ?? "the scene"} and press E when you are close. Compare the visitor's actions with independent records.` : "You have enough evidence to report the attempted account takeover."}</p></section></aside>
    </section>

    <section className="mission6-decision"><div className="panel-kicker">MAKE THE CALL / INCIDENT RESPONSE</div><h2>WHAT SHOULD MINA DO?</h2><p>The visitor has left the staff area. The reset request is still open, and the visitor's identity is not confirmed. Collect all four evidence items before submitting your decision.</p><div className="mission6-choice-grid"><button disabled={found.length < evidence.length} className={decision === "wrong" ? "choice-selected" : ""} onClick={() => finish("wrong")}>Ask the visitor to verify their identity using the phone number in the reset email.</button><button disabled={found.length < evidence.length} className={decision === "wrong" ? "choice-selected" : ""} onClick={() => finish("wrong")}>Reset the account now so the visitor can leave quickly.</button><button disabled={found.length < evidence.length} className={decision === "correct" ? "choice-selected" : ""} onClick={() => finish("correct")}>Pause the reset, preserve access records, and contact IT through a known number.</button></div>{found.length < evidence.length && <p className="mission6-locked-note">Evidence review required: {found.length} of {evidence.length} items found.</p>}{decision && <div className={`mission6-feedback ${decision === "correct" ? "feedback-good" : "feedback-try"}`}><strong>{decision === "correct" ? "GOOD CALL — INCIDENT CONTAINED" : "THINK ABOUT INDEPENDENT VERIFICATION"}</strong><p>{decision === "correct" ? "Pausing the reset prevents a possible takeover. Preserving the access log supports the investigation, and a known IT contact avoids trusting attacker-supplied details." : "The reset request and visitor identity are unverified. Use a trusted channel and protect the records before the account is changed."}</p></div>}{completed && <div className="mission6-reward"><strong>+250 XP</strong><span>MISSION COMPLETE · CAMPAIGN TOTAL {storedXp} XP</span><span>REWARD SAVED ON THIS DEVICE</span></div>}</section>
    <footer className="game-footer"><span>BREACH<span className="accent">.</span> <span className="footer-muted">CYBERSECURITY ESCAPE ROOM</span></span><span>FICTIONAL TRAINING ENVIRONMENT · NO LIVE SYSTEMS</span></footer>
  </main>;
}

