"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./game-world.css";

const missions = [
  { number:"01", name:"The Infiltration", place:"WEST WING", type:"EMAIL FORENSICS", topic:"Find the first foothold in a suspicious message.", href:"/mission-1", icon:"✉", x:13, y:65 },
  { number:"02", name:"The Impostor", place:"CITY CENTER", type:"IDENTITY & TRUST", topic:"Decide which identities and connections can be trusted.", href:"/mission-2", icon:"◈", x:35, y:31 },
  { number:"03", name:"Hidden Evidence", place:"ARCHIVE DISTRICT", type:"DIGITAL FORENSICS", topic:"Recover clues hidden inside digital evidence.", href:"/mission-3", icon:"▤", x:57, y:70 },
  { number:"04", name:"Network Under Attack", place:"DATA CENTER", type:"NETWORK DEFENSE", topic:"Trace suspicious traffic and attacker movement.", href:"/mission-4", icon:"⌘", x:77, y:34 },
  { number:"05", name:"Incident Response", place:"COMMAND HQ", type:"INCIDENT COMMAND", topic:"Contain the threat and bring the organization back online.", href:"/mission-5", icon:"⬡", x:90, y:75 },
];
const modes = [
  ["⌖","CAMPAIGN MAP","Explore the city. Enter each mission.","PLAYABLE NOW"],
  ["↗","IMPOSTER PURSUIT","Track a threat through a crowded location.","NEXT GAME MODE"],
  ["◇","FIELD EXPLORATION","Top-down exploration, clues, and puzzles.","IN DEVELOPMENT"],
  ["⊞","FIRST-PERSON LAB","Walk up to systems and solve hands-on tasks.","IN DEVELOPMENT"],
];

export default function Home() {
  const router = useRouter();
  const [selected,setSelected] = useState(0);
  const [briefing,setBriefing] = useState(false);
  const current = missions[selected];
  const move = useCallback((direction:number) => setSelected(v => (v + direction + missions.length) % missions.length),[]);
  const enter = useCallback(() => router.push(current.href),[current.href,router]);
  useEffect(() => {
    function keys(e:KeyboardEvent) {
      const key=e.key.toLowerCase();
      if(["arrowright","d","arrowdown","s"].includes(key)){e.preventDefault();move(1);}
      if(["arrowleft","a","arrowup","w"].includes(key)){e.preventDefault();move(-1);}
      if(key==="enter"){e.preventDefault();enter();}
      if(key==="escape")setBriefing(false);
    }
    window.addEventListener("keydown",keys);
    return () => window.removeEventListener("keydown",keys);
  },[move,enter]);
  return <main className="world-shell">
    <header className="world-topbar">
      <Link className="world-brand" href="/"><span className="world-brand-mark">B</span><span>BREACH<span className="world-period">.</span></span></Link>
      <div className="world-season"><i className="live-dot"/> CAMPAIGN 01 <b/> INCIDENT 2026-0417</div>
      <div className="world-player"><span className="player-avatar">J</span><span><strong>ROOKIE INVESTIGATOR</strong><small>LEVEL 01 · FIELD AGENT</small></span></div>
    </header>
    <section className="world-intro">
      <div><div className="world-kicker">THE CITY IS YOURS TO INVESTIGATE <span>/</span> 5 LOCATIONS</div><h1>ONE CITY.<br/><em>ONE BREACH.</em></h1><p>A connected incident has spread across the city. Move between locations, investigate what happened, and stop the attack before it reaches command headquarters.</p></div>
      <div className="world-stats"><div><strong>05</strong><small>MISSIONS</small></div><div><strong>01</strong><small>ACTIVE CASE</small></div><div><strong>∞</strong><small>WAYS TO THINK</small></div></div>
    </section>
    <section className="world-layout">
      <div className="city-map-panel">
        <div className="map-topline"><span><i className="map-pulse"/> LIVE CITY MAP</span><span>SECTOR 04 / WEATHERFORD METRO</span></div>
        <div className="city-map">
          <div className="map-grid"/><div className="map-river"/><div className="map-road road-one"/><div className="map-road road-two"/><div className="map-road road-three"/>
          <svg className="map-routes" viewBox="0 0 1000 650" preserveAspectRatio="none" aria-hidden="true"><path className="route-shadow" d="M130 420 L350 200 L570 455 L770 220 L900 490"/><path className="route-line" d="M130 420 L350 200 L570 455 L770 220 L900 490"/></svg>
          <div className="map-district district-a">INDUSTRIAL<br/>QUARTER</div><div className="map-district district-b">CENTRAL<br/>BUSINESS DISTRICT</div><div className="map-district district-c">ARCHIVE<br/>DISTRICT</div><div className="map-district district-d">SECURE<br/>CAMPUS</div>
          {missions.map((m,i)=><button key={m.number} className={"map-location "+(selected===i?"map-location-selected":"")} style={{left:m.x+"%",top:m.y+"%"}} onClick={()=>setSelected(i)} aria-pressed={selected===i}><i className="location-ping"/><span className="location-icon">{m.icon}</span><span className="location-number">{m.number}</span><span className="location-name">{m.place}</span></button>)}
          <div className="map-player" style={{left:current.x+"%",top:current.y+"%"}}><span className="player-figure">⌁</span><small>YOU ARE HERE</small></div>
          <div className="map-compass">N<br/><strong>↑</strong></div><div className="map-legend"><span><i/> YOUR AGENT</span><span><b/> MISSION SITE</span></div>
        </div>
        <div className="map-controls"><div className="map-dpad"><button onClick={()=>move(-1)} aria-label="Previous location">←</button><button onClick={()=>move(1)} aria-label="Next location">→</button></div><span><b>MOVE</b> WASD / ARROW KEYS <i/> <b>ENTER</b> OPEN LOCATION</span><small>CLICK A LOCATION TO SELECT</small></div>
      </div>
      <aside className="mission-dossier">
        <div className="dossier-top"><span>LOCATION DOSSIER</span><b><i/> AVAILABLE</b></div><div className="dossier-number">MISSION {current.number}</div><div className="dossier-icon">{current.icon}</div><div className="dossier-place">{current.place}</div><h2>{current.name}<em>.</em></h2><div className="dossier-type">{current.type}</div><p>{current.topic}</p>
        <div className="dossier-divider"/><div className="dossier-meta"><span>CASE FILE</span><b>0417-{current.number}</b></div><div className="dossier-meta"><span>ENVIRONMENT</span><b>SIMULATED</b></div>
        <button className="enter-location" onClick={enter}>ENTER LOCATION <span>↗</span></button><small className="dossier-footnote">PRESS ENTER TO DEPLOY</small>
      </aside>
    </section>
    <section className="game-mode-section"><div className="mode-heading"><div><div className="world-kicker">CHOOSE HOW YOU PLAY <span>/</span> GAME MODES</div><h2>THE WORLD IS<br/><em>JUST THE BEGINNING.</em></h2></div><p>One connected campaign. Different ways to experience the work of a cybersecurity investigator.</p></div>
      <div className="mode-grid">{modes.map((m,i)=><article className={"mode-card "+(i===0?"mode-card-active":"")} key={m[1]}><span className="mode-symbol">{m[0]}</span><small>{m[3]}</small><h3>{m[1]}</h3><p>{m[2]}</p><div className="mode-bottom">{i===0?"CURRENT MODE":"COMING TO THE CAMPAIGN"} <b>{i===0?"●":"◌"}</b></div></article>)}</div>
    </section>
    <section className="world-alert"><b className="alert-icon">!</b><div><strong>INCIDENT ALERT</strong><p>Unauthorized access detected. Evidence across the city may be compromised. All people, systems, and events in BREACH are fictional training simulations.</p></div><small>THREAT LEVEL: ELEVATED</small></section>
    <footer className="world-footer"><span>BREACH<span className="world-period">.</span> <small>CYBERSECURITY CAMPAIGN</small></span><span>FICTIONAL TRAINING ENVIRONMENT · NO LIVE SYSTEMS</span></footer>
    <button className="briefing-help" onClick={()=>setBriefing(true)} aria-label="Campaign controls">?</button>
    {briefing&&<div className="briefing-overlay" role="dialog" aria-modal="true"><div className="briefing-card"><button className="briefing-close" onClick={()=>setBriefing(false)}>×</button><div className="world-kicker">MISSION CONTROL / BRIEFING</div><h2>YOUR NEXT MOVE.</h2><p>Select a location on the map. Use WASD or the arrow keys to travel between mission sites. Press Enter to enter the selected location. Each mission reveals another piece of the same incident.</p><button className="enter-location" onClick={()=>setBriefing(false)}>UNDERSTOOD <span>→</span></button></div></div>}
  </main>;
}
