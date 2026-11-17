"use client";

import { formatTime, heatColor, heatLabel } from "@/lib/breach/mission-runtime";

export type HeatNode = {
  id: string;
  label: string;
  category: string;
  clue: string;
  proximity: number;
};

type TimerProps = {
  remainingSeconds: number;
  running: boolean;
  expired: boolean;
  onToggle: () => void;
  reducedMotion: boolean;
  onReducedMotionChange: (value: boolean) => void;
};

export function MissionCountdown({ remainingSeconds, running, expired, onToggle, reducedMotion, onReducedMotionChange }: TimerProps) {
  const warning = remainingSeconds <= 30 ? "critical" : remainingSeconds <= 60 ? "warning" : "normal";
  const flash = remainingSeconds <= 10 && remainingSeconds > 0 && !reducedMotion;
  const pulseClass = reducedMotion || remainingSeconds <= 10 ? "" : remainingSeconds <= 20 ? "timer-pulse-urgent" : remainingSeconds <= 30 ? "timer-pulse-fast" : remainingSeconds <= 45 ? "timer-pulse-medium" : remainingSeconds <= 60 ? "timer-pulse-slow" : "";
  const notice = remainingSeconds === 0 ? "TIME EXPIRED" :
    remainingSeconds <= 10 ? "FINAL SECONDS" :
    remainingSeconds <= 20 ? "FINAL COUNTDOWN" :
    remainingSeconds <= 30 ? "30-SECOND WARNING" :
    remainingSeconds <= 45 ? "45-SECOND WARNING" :
    remainingSeconds <= 60 ? "ONE-MINUTE WARNING" : "INCIDENT CLOCK";

  return (
    <section className={`runtime-timer timer-${warning} ${pulseClass} ${flash ? "timer-flash" : ""}`} aria-live={remainingSeconds <= 60 ? "assertive" : "off"}>
      <div className="runtime-timer-copy">
        <span className="runtime-kicker">{notice}</span>
        <strong className="runtime-time" aria-label={`${Math.floor(remainingSeconds / 60)} minutes ${remainingSeconds % 60} seconds remaining`}>{formatTime(remainingSeconds)}</strong>
        <span className="runtime-timer-status">{expired ? "INVESTIGATION LOCKED" : running ? "LIVE INCIDENT SIMULATION" : "CLOCK PAUSED"}</span>
      </div>
      <div className="runtime-timer-actions">
        <button type="button" className="runtime-pause" onClick={onToggle} disabled={expired}>{running ? "PAUSE CLOCK" : "RESUME CLOCK"}</button>
        <label className="runtime-accessibility"><input type="checkbox" checked={reducedMotion} onChange={(event) => onReducedMotionChange(event.target.checked)} /> REDUCE FLASHING</label>
      </div>
    </section>
  );
}

type HeatmapProps = {
  nodes: HeatNode[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function InvestigationHeatmap({ nodes, selectedId, onSelect }: HeatmapProps) {
  const selected = nodes.find((node) => node.id === selectedId) ?? nodes[0];

  return (
    <section className="runtime-heatmap">
      <div className="runtime-section-heading">
        <div><span className="runtime-kicker">INVESTIGATION HEATMAP</span><h2>FOLLOW THE EVIDENCE<span>.</span></h2></div>
        <span className="runtime-live-label">HOT / COLD TRACKING</span>
      </div>
      <p className="runtime-help">Colors show how close your current evidence trail is to the investigation target. A red lead is a strong match—not automatic proof that a system is compromised.</p>
      <div className="runtime-heat-legend" aria-label="Heatmap color scale">
        {[
          { label: "COLD", color: "#2670da" },
          { label: "COOL", color: "#27b1cd" },
          { label: "WARM", color: "#e0c746" },
          { label: "HOT", color: "#ef8431" },
          { label: "CRITICAL", color: "#da3939" },
        ].map((item) => <span key={item.label}><i style={{ background: item.color }} />{item.label}</span>)}
      </div>
      <div className="runtime-node-grid">
        {nodes.map((node) => {
          const color = heatColor(node.proximity);
          return (
            <button type="button" key={node.id} className={`runtime-node ${selectedId === node.id ? "runtime-node-selected" : ""}`} onClick={() => onSelect(node.id)} aria-pressed={selectedId === node.id}>
              <i style={{ background: color, boxShadow: `0 0 18px ${color}88` }} />
              <strong>{node.label}</strong>
              <small>{heatLabel(node.proximity)} · {node.category}</small>
            </button>
          );
        })}
      </div>
      {selected && <div className="runtime-selected-clue"><span className="runtime-kicker">SELECTED LEAD / {selected.label}</span><p>{selected.clue}</p><div className="runtime-heat-meter"><span style={{ width: selected.proximity + "%", background: heatColor(selected.proximity) }} /></div><small>{heatLabel(selected.proximity)} — {selected.proximity}% investigative proximity</small></div>}
    </section>
  );
}

type ScoreProps = { score: number; hintsUsed: number; completed: number; total: number };

export function MissionScoreboard({ score, hintsUsed, completed, total }: ScoreProps) {
  return (
    <div className="runtime-scoreboard">
      <div><strong>{score}</strong><span>POINTS EARNED</span></div>
      <div><strong>{completed}/{total}</strong><span>STAGES CLEARED</span></div>
      <div><strong>{hintsUsed}</strong><span>HINTS USED</span></div>
    </div>
  );
}
