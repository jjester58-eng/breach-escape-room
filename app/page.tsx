import Link from "next/link";

const missions = [
  { number: "01", name: "The Infiltration", topic: "Phishing · Social Engineering · Malware", status: "PLAYABLE", href: "/mission-1" },
  { number: "02", name: "The Impostor", topic: "Digital Certificates · PKI · Trust", status: "PLAYABLE", href: "/mission-2" },
  { number: "03", name: "Hidden Evidence", topic: "File Integrity · Steganography · Cryptography", status: "PLAYABLE", href: "/mission-3" },
  { number: "04", name: "Network Under Attack", topic: "Packets · Network Defense · Lateral Movement", status: "LOCKED" },
  { number: "05", name: "Incident Response", topic: "Risk · Containment · Recovery", status: "LOCKED" },
];

export default function Home() {
  return (
    <main className="site-shell">
      <nav className="topbar">
        <Link className="brand" href="/" aria-label="BREACH home"><span className="brand-mark">B</span><span>BREACH<span className="brand-period">.</span></span></Link>
        <span className="topbar-label">CYBERSECURITY TRAINING SIMULATION</span>
        <span className="topbar-status"><i /> SYSTEM ONLINE</span>
      </nav>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span /> INCIDENT 2026-0417 <span className="eyebrow-divider">/</span> CLASSIFIED</div>
          <h1>THE SYSTEM<br /><em>HAS BEEN</em><br />BREACHED<span className="accent">.</span></h1>
          <p className="hero-description">A security incident is unfolding. Evidence is scattered. Someone got inside. Your job is to investigate the attack, uncover what happened, and stop it before the damage spreads.</p>
          <div className="hero-actions">
            <a className="primary-button" href="#missions">EXPLORE THE MISSIONS <span>↘</span></a>
            <span className="briefing-note">5 MISSIONS <b>·</b> 3 DIFFICULTY PATHS <b>·</b> 1 INCIDENT</span>
          </div>
        </div>
        <div className="hero-visual" aria-label="Abstract network security visualization">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" /><div className="visual-grid" />
          <div className="core"><div className="core-ring">!</div><span>SECURITY<br />BREACH</span></div>
          <span className="node node-a">AUTH SERVER</span><span className="node node-b">USER-07</span><span className="node node-c">DATABASE</span><span className="node node-d">UNKNOWN HOST</span>
          <span className="visual-tag">LIVE INCIDENT MAP <b>●</b></span>
        </div>
      </section>
      <section className="alert-strip"><span className="alert-icon">!</span><p><strong>INCIDENT ALERT</strong> — Unauthorized access detected. Internal systems may be compromised. All evidence in this simulation is fictional.</p><span className="alert-code">THREAT LEVEL: ELEVATED</span></section>
      <section className="mission-section" id="missions">
        <div className="section-heading"><div><div className="eyebrow">YOUR ASSIGNMENT <span className="eyebrow-divider">/</span> CASE FILE 0417</div><h2>THE INVESTIGATION<span className="accent">.</span></h2></div><p>Each mission unlocks another piece of the incident. Follow the evidence. Think like an analyst.</p></div>
        <div className="mission-grid">
          {missions.map((mission) => {
            const card = (
              <>
                <div className="mission-card-top"><span className="mission-number">{mission.number}</span><span className={`mission-status ${mission.status === "PLAYABLE" ? "status-active" : ""}`}>{mission.status}</span></div>
                <h3>{mission.name}</h3><p>{mission.topic}</p>
                <div className="mission-card-bottom">
                  {mission.href ? <span className="mission-launch">OPEN INVESTIGATION <span>↗</span></span> : <span>AWAITING CLEARANCE</span>}
                  {!mission.href && <span className="mission-arrow">⌑</span>}
                </div>
              </>
            );
            return mission.href ? (
              <Link href={mission.href} className="mission-card mission-active mission-card-link" key={mission.number} aria-label={`Open ${mission.name} mission`}>{card}</Link>
            ) : (
              <article className="mission-card" key={mission.number}>{card}</article>
            );
          })}
        </div>
      </section>
      <footer className="footer"><span>BREACH<span className="accent">.</span> <span className="footer-muted">CYBERSECURITY ESCAPE ROOM</span></span><span>FICTIONAL TRAINING ENVIRONMENT <b>·</b> NO LIVE SYSTEMS</span></footer>
    </main>
  );
}
