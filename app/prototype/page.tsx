"use client";

import Link from "next/link";
import { useState } from "react";

type Mode = "overworld" | "explore" | "chase" | "firstperson";

const missions = [
  { id: "01", title: "The Infiltration", short: "INITIAL ACCESS", topic: "Phishing · Malware · Social engineering", href: "/mission-1", icon: "✉", color: "coral", room: "ENTRY GATE" },
  { id: "02", title: "The Impostor", short: "DIGITAL TRUST", topic: "Certificates · PKI · HTTPS", href: "/mission-2", icon: "◇", color: "blue", room: "IDENTITY VAULT" },
  { id: "03", title: "Hidden Evidence", short: "DIGITAL FORENSICS", topic: "File hashes · Hidden messages · Secret codes", href: "/mission-3", icon: "▧", color: "purple", room: "ARCHIVE ROOM" },
  { id: "04", title: "Network Under Attack", short: "NETWORK DEFENSE", topic: "Traffic · Connections · Lateral movement", href: "/mission-4", icon: "⌁", color: "green", room: "NETWORK CORE" },
  { id: "05", title: "Incident Response", short: "SAVE THE SYSTEM", topic: "Containment · Recovery · Risk management", href: "/mission-5", icon: "⚑", color: "gold", room: "COMMAND CENTER" },
];

const modes: { id: Mode; label: string; sub: string; icon: string }[] = [
  { id: "overworld", label: "OVERWORLD", sub: "Platform adventure", icon: "🕹️" },
  { id: "explore", label: "EXPLORATION", sub: "Top-down investigation", icon: "🗺️" },
  { id: "chase", label: "IMPOSTER HUNT", sub: "Chase & threat detection", icon: "🕵️" },
  { id: "firstperson", label: "FIRST PERSON", sub: "Hands-on cyber lab", icon: "🖥️" },
];

export default function GameWorldPrototype() {
  const [mode, setMode] = useState<Mode>("overworld");
  const [selected, setSelected] = useState(0);
  const [showBrief, setShowBrief] = useState(false);
  const mission = missions[selected];

  return (
    <main className="world-page">
      <header className="world-topbar">
        <Link href="/" className="world-brand"><span className="world-brand-mark">B</span> BREACH<span className="world-brand-dot">.</span></Link>
        <div className="world-save"><span className="save-dot" /> PROTOTYPE BUILD <span className="world-divider">/</span> INCIDENT 0417</div>
        <Link href="/" className="world-exit">EXIT TO MAIN SITE ↗</Link>
      </header>

      <section className="world-intro">
        <div>
          <div className="world-kicker">THE WORLD IS YOURS TO INVESTIGATE</div>
          <h1>ENTER THE<br /><span>BREACH.</span></h1>
          <p>Five missions. One connected incident. Choose how you want to explore the investigation.</p>
        </div>
        <div className="world-stats"><div><strong>05</strong><span>MISSIONS</span></div><div><strong>03</strong><span>DIFFICULTY PATHS</span></div><div><strong>01</strong><span>CONNECTED STORY</span></div></div>
      </section>

      <section className="mode-picker">
        <div className="mode-heading"><div><span className="world-kicker">CHOOSE YOUR GAME WORLD</span><h2>HOW DO YOU WANT TO PLAY?</h2></div><span className="mode-hint">SWITCH WORLDS ANYTIME</span></div>
        <div className="mode-tabs">
          {modes.map((item) => <button key={item.id} onClick={() => { setMode(item.id); setShowBrief(false); }} className={mode === item.id ? "mode-tab active" : "mode-tab"}><span className="mode-icon">{item.icon}</span><span><strong>{item.label}</strong><small>{item.sub}</small></span><i>{mode === item.id ? "●" : "○"}</i></button>)}
        </div>
      </section>

      <section className="world-stage">
        <div className="stage-topline"><span><i className="stage-live" /> SIMULATED ENVIRONMENT</span><span>{modes.find((m) => m.id === mode)?.label} MODE <b>/</b> CASE 0417</span></div>

        {mode === "overworld" && <div className="overworld-scene">
          <div className="pixel-sky"><span className="pixel-cloud cloud-a" /><span className="pixel-cloud cloud-b" /><span className="pixel-sun" /><span className="sky-label">THE DISTRICT NETWORK</span></div>
          <div className="pixel-world">
            <div className="world-path path-one" /><div className="world-path path-two" /><div className="world-path path-three" />
            <div className="pixel-player"><span>▲</span><small>YOU</small></div>
            {missions.map((m, i) => <button key={m.id} className={`world-level level-${i + 1} ${selected === i ? "level-selected" : ""} ${m.color}`} onClick={() => { setSelected(i); setShowBrief(true); }}><span className="level-symbol">{m.icon}</span><strong>{m.id}</strong><small>{m.short}</small></button>)}
            <div className="pixel-sign sign-a">START HERE →</div><div className="pixel-sign sign-b">FINAL BOSS ZONE</div>
            <div className="pixel-bush bush-a" /><div className="pixel-bush bush-b" /><div className="pixel-bush bush-c" />
          </div>
          <div className="scene-caption"><span>✦ EXPLORE THE MAP</span><span>SELECT A LEVEL TO VIEW ITS MISSION</span></div>
        </div>}

        {mode === "explore" && <div className="explore-scene">
          <div className="explore-sidebar"><span className="mini-label">FACILITY MAP</span><strong>WEATHERFORD<br />DISTRICT HQ</strong><p>Something has entered the network. Search each room for clues.</p><div className="map-legend"><span>▣ AVAILABLE AREA</span><span>◆ EVIDENCE LOCATION</span><span>✦ OBJECTIVE</span></div></div>
          <div className="room-map">
            <div className="map-room room-lobby"><span>🚪</span><small>LOBBY</small></div>
            <div className="map-room room-mail"><button onClick={() => setSelected(0)}>✉</button><small>MAIL ROOM</small></div>
            <div className="map-room room-id"><button onClick={() => setSelected(1)}>◇</button><small>IDENTITY OFFICE</small></div>
            <div className="map-room room-archive"><button onClick={() => setSelected(2)}>▧</button><small>FILE ARCHIVE</small></div>
            <div className="map-room room-network"><button onClick={() => setSelected(3)}>⌁</button><small>SERVER ROOM</small></div>
            <div className="map-room room-command"><button onClick={() => setSelected(4)}>⚑</button><small>COMMAND</small></div>
            <div className="map-corridor corridor-a" /><div className="map-corridor corridor-b" /><div className="map-corridor corridor-c" />
            <div className="map-you">YOU ARE HERE</div>
          </div>
          <div className="explore-bottom"><span>🧭 MOVE THROUGH THE FACILITY</span><span>CLICK A ROOM TO INSPECT ITS CASE FILE</span></div>
        </div>}

        {mode === "chase" && <div className="chase-scene">
          <div className="chase-banner"><div><span className="mini-label">THREAT DETECTION / ACTIVE CASE</span><h3>WHO IS INSIDE THE NETWORK?</h3><p>Suspicious activity has been detected. Follow the clues to identify what happened.</p></div><div className="threat-meter"><span>THREAT LEVEL</span><strong>HIGH</strong><i><b /></i></div></div>
          <div className="suspect-grid">
            <button className={selected === 0 ? "suspect-card suspect-active" : "suspect-card"} onClick={() => setSelected(0)}><span className="suspect-avatar">✉</span><small>LEAD 01</small><strong>THE PHISHING EMAIL</strong><p>A message that should not have arrived.</p><em>TRACE THE ENTRY POINT ↗</em></button>
            <button className={selected === 1 ? "suspect-card suspect-active" : "suspect-card"} onClick={() => setSelected(1)}><span className="suspect-avatar">◈</span><small>LEAD 02</small><strong>THE FAKE IDENTITY</strong><p>A trusted connection may be a trick.</p><em>CHECK THE IDENTITY ↗</em></button>
            <button className={selected === 2 ? "suspect-card suspect-active" : "suspect-card"} onClick={() => setSelected(2)}><span className="suspect-avatar">▧</span><small>LEAD 03</small><strong>THE HIDDEN CLUE</strong><p>Evidence is hiding in plain sight.</p><em>SEARCH THE EVIDENCE ↗</em></button>
            <button className={selected === 3 ? "suspect-card suspect-active" : "suspect-card"} onClick={() => setSelected(3)}><span className="suspect-avatar">⌁</span><small>LEAD 04</small><strong>THE NETWORK TRAIL</strong><p>Something is moving between systems.</p><em>FOLLOW THE TRAFFIC ↗</em></button>
            <button className={selected === 4 ? "suspect-card suspect-active" : "suspect-card"} onClick={() => setSelected(4)}><span className="suspect-avatar">⚑</span><small>LEAD 05</small><strong>THE RESPONSE</strong><p>Stop the attack before it spreads.</p><em>TAKE COMMAND ↗</em></button>
          </div>
          <div className="chase-footer"><span>⚠ THE SUSPECT IS STILL ACTIVE</span><span>COLLECT EVIDENCE. CONNECT THE CLUES. MAKE YOUR MOVE.</span></div>
        </div>}

        {mode === "firstperson" && <div className="fps-scene">
          <div className="fps-view">
            <div className="fps-ceiling" /><div className="fps-wall wall-left" /><div className="fps-wall wall-right" /><div className="fps-floor" />
            <div className="fps-door"><span>SECURE FACILITY</span><b>▣</b></div>
            <div className="fps-console console-left"><span>NETWORK STATUS</span><strong>⚠ ALERT</strong><small>UNUSUAL TRAFFIC</small></div>
            <div className="fps-console console-right"><span>ACCESS CONTROL</span><strong>3 WARNINGS</strong><small>IDENTITY CHECK</small></div>
            <div className="fps-crosshair">+</div>
            <div className="fps-hud"><span>LOCATION: SERVER WING</span><span>OBJECTIVE: INVESTIGATE THE ALERT</span></div>
          </div>
          <div className="fps-controls"><div><span className="mini-label">INTERACTIVE WORKSTATIONS</span><strong>CHOOSE A CONSOLE TO BEGIN</strong><p>Explore a simulated computer lab. Each workstation opens a hands-on investigation.</p></div><div className="console-buttons">{missions.map((m, i) => <button key={m.id} className={selected === i ? "console-choice chosen" : "console-choice"} onClick={() => setSelected(i)}><span>{m.icon}</span>{m.room}<b>↗</b></button>)}</div></div>
        </div>}
      </section>

      <section className="mission-launch-panel">
        <div className="launch-info"><span className="world-kicker">SELECTED MISSION / {mission.id}</span><h2>{mission.title}<span>.</span></h2><p>{mission.topic}</p><div className="launch-tags"><span>CONNECTED STORYLINE</span><span>3 DIFFICULTY LEVELS</span><span>PROGRESS SAVES ON THIS DEVICE</span></div></div>
        <div className="launch-action"><div className="launch-preview-icon">{mission.icon}</div><div><span className="mini-label">READY TO INVESTIGATE?</span><strong>{mission.room}</strong></div><button onClick={() => setShowBrief(!showBrief)} className="brief-button">{showBrief ? "HIDE BRIEFING" : "MISSION BRIEFING"}</button><Link href={mission.href} className="launch-button">ENTER MISSION <span>↗</span></Link></div>
        {showBrief && <div className="mission-brief"><strong>YOUR OBJECTIVE</strong><p>{selected === 0 ? "Investigate the suspicious payroll message. Look for clues that reveal how an attacker may have gained an initial foothold." : selected === 1 ? "Investigate digital identities and certificates. Decide which connections can be trusted and which may be impersonating a legitimate service." : selected === 2 ? "Search digital artifacts for hidden information. Use file evidence, hashes, and codes to reconstruct what happened." : selected === 3 ? "Follow the network activity. Identify suspicious connections and determine how the attacker may have moved through the system." : "Take responsibility for the incident. Decide how to contain the threat, protect evidence, and recover safely."}</p></div>}
      </section>

      <footer className="world-footer"><span>BREACH<span>.</span> CYBERSECURITY ESCAPE ROOM</span><span>FICTIONAL TRAINING ENVIRONMENT · NO LIVE SYSTEMS</span></footer>
    </main>
  );
}
