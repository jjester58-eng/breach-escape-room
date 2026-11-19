"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";

type Challenge = {
  id: string;
  title: string;
  location: string;
  briefing: string;
  evidence: { label: string; value: string }[];
  question: string;
  choices: string[];
  correct: number;
  explanation: string;
  next: string;
};

const challenges: Challenge[] = [
  {
    id: "reception",
    title: "A Strange Guest",
    location: "FRONT DESK",
    briefing: "The receptionist remembers a visitor who asked several questions about the hotel's guest Wi-Fi and the staff network. The visitor also left a printed note.",
    evidence: [
      { label: "VISITOR NAME", value: "Alex Morgan" },
      { label: "VISIT TIME", value: "8:42 PM" },
      { label: "REQUEST", value: "Asked for the staff network password" },
    ],
    question: "What should the receptionist have done when asked for the staff network password?",
    choices: ["Share it because the visitor was polite", "Refuse and direct the visitor to an approved guest connection", "Write it down and give it to the visitor later"],
    correct: 1,
    explanation: "Staff network access should only be given to approved users. Visitors should use a separate guest network.",
    next: "You documented the social-engineering attempt. Look for a device that may show which network the visitor tried to use.",
  },
  {
    id: "terminal",
    title: "The Guest Terminal",
    location: "LOBBY KIOSK",
    briefing: "A guest used the lobby kiosk shortly before the network alert. The browser history shows a visit to a look-alike sign-in page.",
    evidence: [
      { label: "EXPECTED SITE", value: "portal.northstar.example" },
      { label: "VISITED SITE", value: "northstar-guest-login.example" },
      { label: "CONNECTION", value: "HTTPS enabled" },
    ],
    question: "Does HTTPS prove that the visited site belongs to the hotel?",
    choices: ["Yes. HTTPS means the business has been verified", "No. HTTPS protects the connection, but the domain still needs to be checked", "Yes, if the page has the hotel's logo"],
    correct: 1,
    explanation: "HTTPS encrypts the connection and helps authenticate the domain in the certificate. It does not prove that a look-alike domain belongs to the hotel.",
    next: "The page used a different domain. Check the security office records for the certificate details.",
  },
  {
    id: "access",
    title: "The Staff Door",
    location: "RESTRICTED HALL",
    briefing: "The staff-only door log shows a badge was used after the visitor left the lobby. The badge belongs to a maintenance account.",
    evidence: [
      { label: "BADGE ID", value: "M-014" },
      { label: "ACCOUNT", value: "maintenance.temp" },
      { label: "EVENT", value: "Access granted — 9:03 PM" },
    ],
    question: "What is the best next step when an access log shows unexpected use of a staff badge?",
    choices: ["Delete the log so it cannot be misused", "Preserve the record and verify the activity with the account owner", "Assume the badge owner was responsible"],
    correct: 1,
    explanation: "Preserve the evidence, verify the activity, and investigate before making conclusions. A log records an event; it does not always explain who was physically present.",
    next: "The access event is documented. The security office has a certificate record that may connect the visitor's device to the suspicious site.",
  },
  {
    id: "security",
    title: "Certificate Watch",
    location: "SECURITY OFFICE",
    briefing: "A saved browser report contains a certificate summary for the look-alike sign-in page.",
    evidence: [
      { label: "CERTIFICATE NAME", value: "northstar-guest-login.example" },
      { label: "ISSUER", value: "Example Public CA" },
      { label: "BROWSER RESULT", value: "Name matches the visited domain" },
    ],
    question: "What does this certificate information tell the investigation team?",
    choices: ["The site is an official hotel website", "The certificate matches the look-alike domain, not the hotel's known domain", "The certificate proves the visitor is a hotel employee"],
    correct: 1,
    explanation: "A valid certificate can be issued for a domain controlled by an attacker. Always compare the domain with the organization's known address.",
    next: "You found the key identity clue. Continue into the full Impostor investigation to inspect certificates and trust chains in more detail.",
  },
];

function addBox(parent: THREE.Group, x: number, y: number, z: number, w: number, h: number, d: number, color: number, name?: string) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.82 }));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (name) mesh.userData.interactionId = name;
  parent.add(mesh);
  return mesh;
}

function makeLabel(parent: THREE.Group, x: number, y: number, z: number, w: number, h: number, color: number, name: string) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.16 }));
  mesh.position.set(x, y, z);
  mesh.userData.interactionId = name;
  parent.add(mesh);
  return mesh;
}

export default function HotelWorld() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState<Challenge | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [completed, setCompleted] = useState<string[]>([]);
  const [xp, setXp] = useState(0);
  const [notice, setNotice] = useState("Use W A S D or the arrow keys to explore. Click a glowing object to investigate.");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    } catch {
      setNotice("3D graphics are unavailable in this browser. Try enabling hardware acceleration or use the investigation link below.");
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x080f18);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080f18);
    scene.fog = new THREE.Fog(0x080f18, 22, 48);

    const camera = new THREE.PerspectiveCamera(48, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(11, 14, 15);
    const player = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.05, 0.5), new THREE.MeshStandardMaterial({ color: 0x36c8d5, roughness: 0.6 }));
    body.position.y = 0.82;
    body.castShadow = true;
    player.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.52, 0.52), new THREE.MeshStandardMaterial({ color: 0xe2b98d }));
    head.position.y = 1.58;
    head.castShadow = true;
    player.add(head);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.04), new THREE.MeshStandardMaterial({ color: 0x142333, emissive: 0x0d6671, emissiveIntensity: 0.5 }));
    visor.position.set(0, 1.62, 0.27);
    player.add(visor);
    player.position.set(-7, 0, 5);
    scene.add(player);

    scene.add(new THREE.HemisphereLight(0x9ab9d0, 0x17202b, 2.0));
    const keyLight = new THREE.DirectionalLight(0xffd8a0, 2.6);
    keyLight.position.set(-7, 16, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);
    const cyanLight = new THREE.PointLight(0x1aa9c4, 18, 16);
    cyanLight.position.set(7, 4, -5);
    scene.add(cyanLight);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 20), new THREE.MeshStandardMaterial({ color: 0x25323b, roughness: 1 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const tile = new THREE.GridHelper(26, 26, 0x40515b, 0x35434c);
    tile.position.y = 0.015;
    scene.add(tile);

    const architecture = new THREE.Group();
    scene.add(architecture);
    addBox(architecture, 0, 2, -10, 26, 4, 0.45, 0x182631);
    addBox(architecture, -13, 2, 0, 0.45, 4, 20, 0x182631);
    addBox(architecture, 13, 2, 0, 0.45, 4, 20, 0x182631);
    addBox(architecture, 0, 2, 10, 26, 4, 0.45, 0x182631);
    addBox(architecture, 0, 4.1, 0, 26, 0.22, 20, 0x101923);
    addBox(architecture, -5, 0.12, -2, 7, 0.22, 4, 0x3b4a52);
    addBox(architecture, 4, 0.12, -5, 8, 0.22, 3, 0x34434d);

    const frontDesk = new THREE.Group();
    frontDesk.position.set(-7, 0, -5);
    architecture.add(frontDesk);
    addBox(frontDesk, 0, 0.72, 0, 5.2, 1.35, 1.5, 0x644c3d);
    addBox(frontDesk, 0, 1.42, 0, 5.35, 0.18, 1.62, 0xb18a5f);
    addBox(frontDesk, 0, 1.95, -0.2, 2.1, 0.85, 0x253743);
    makeLabel(frontDesk, 0, 2.0, 0.34, 1.6, 0.44, 0x20b8c9, "reception");

    const kiosk = new THREE.Group();
    kiosk.position.set(1, 0, -5);
    architecture.add(kiosk);
    addBox(kiosk, 0, 0.72, 0, 1.35, 1.4, 0.9, 0x374752);
    addBox(kiosk, 0, 1.72, 0.42, 1.05, 1.0, 0.12, 0x101b24);
    makeLabel(kiosk, 0, 1.74, 0.51, 0.83, 0.72, 0x168d9c, "terminal");
    addBox(kiosk, 0, 0.12, 0, 1.7, 0.16, 1.2, 0x1d2b34);

    const accessDoor = new THREE.Group();
    accessDoor.position.set(8, 0, 0);
    architecture.add(accessDoor);
    addBox(accessDoor, 0, 1.55, 0, 2.5, 3.1, 0.28, 0x273d49);
    makeLabel(accessDoor, -0.75, 1.65, 0.2, 0.35, 0.55, 0xe5a24d, "access");
    addBox(accessDoor, 1.55, 1.1, 0.1, 0.75, 1.2, 0x24343e);

    const security = new THREE.Group();
    security.position.set(7, 0, -6);
    architecture.add(security);
    addBox(security, 0, 0.62, 0, 3.8, 1.2, 1.2, 0x33444d);
    addBox(security, 0, 1.65, -0.3, 3.0, 1.3, 0x121f29);
    makeLabel(security, 0, 1.68, 0.38, 2.5, 0.92, 0x126d7c, "security");
    addBox(security, -1.2, 2.7, -0.25, 0.12, 0.9, 0.12, 0x64727a);
    addBox(security, 1.2, 2.7, -0.25, 0.12, 0.9, 0.12, 0x64727a);

    const npc = new THREE.Group();
    npc.position.set(-2.5, 0, -5.2);
    const npcBody = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.0, 0.48), new THREE.MeshStandardMaterial({ color: 0xc58d55 }));
    npcBody.position.y = 0.8;
    npc.add(npcBody);
    const npcHead = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: 0xd7a87d }));
    npcHead.position.y = 1.55;
    npc.add(npcHead);
    scene.add(npc);

    // Decorative hotel details keep the scene readable without heavy assets.
    for (let i = 0; i < 5; i++) {
      const planter = new THREE.Group();
      planter.position.set(-10 + i * 4.8, 0, 7.4);
      scene.add(planter);
      addBox(planter, 0, 0.35, 0, 1.1, 0.7, 1.1, 0x795b43);
      const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(0.72, 0), new THREE.MeshStandardMaterial({ color: 0x38765e, flatShading: true }));
      leaves.position.y = 1.15;
      leaves.castShadow = true;
      planter.add(leaves);
    }
    addBox(architecture, 0, 2.4, -9.65, 6.5, 1.1, 0.12, 0x18212b);
    makeLabel(architecture, 0, 2.45, -9.55, 5.4, 0.55, 0x1c7280, "security");

    const keys = new Set<string>();
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) event.preventDefault();
      keys.add(key);
      if (key === "e" || key === " ") {
        const ids = ["reception", "terminal", "access", "security"];
        let nearest: { id: string; distance: number } | null = null;
        const positions: Record<string, THREE.Vector3> = {
          reception: new THREE.Vector3(-7, 1.5, -5),
          terminal: new THREE.Vector3(1, 1.5, -5),
          access: new THREE.Vector3(8, 1.5, 0),
          security: new THREE.Vector3(7, 1.5, -6),
        };
        for (const id of ids) {
          const distance = player.position.distanceTo(positions[id]);
          if (distance < 4.2 && (!nearest || distance < nearest.distance)) nearest = { id, distance };
        }
        const nearestId = nearest?.id;
        if (nearestId) {
          const found = challenges.find((item) => item.id === nearestId);
          if (found) window.dispatchEvent(new CustomEvent("breach-hotel-open", { detail: found.id }));
        }
      }
    };
    const onKeyUp = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      for (const hit of hits) {
        let object: THREE.Object3D | null = hit.object;
        while (object && !object.userData.interactionId) object = object.parent;
        if (object?.userData.interactionId) {
          window.dispatchEvent(new CustomEvent("breach-hotel-open", { detail: object.userData.interactionId }));
          break;
        }
      }
    };
    canvas.addEventListener("click", onClick);

    const resize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const lookTarget = new THREE.Vector3();
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const direction = new THREE.Vector3(
        (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0),
        0,
        (keys.has("s") || keys.has("arrowdown") ? 1 : 0) - (keys.has("w") || keys.has("arrowup") ? 1 : 0),
      );
      if (direction.lengthSq() > 0) {
        direction.normalize().multiplyScalar(0.105);
        player.position.add(direction);
        player.position.x = THREE.MathUtils.clamp(player.position.x, -11.5, 11.5);
        player.position.z = THREE.MathUtils.clamp(player.position.z, -8.5, 8.5);
      }
      lookTarget.set(player.position.x + 1.2, 0, player.position.z);
      const desiredCamera = new THREE.Vector3(player.position.x + 11, 14, player.position.z + 14);
      camera.position.lerp(desiredCamera, 0.045);
      camera.lookAt(lookTarget);
      renderer.render(scene, camera);
    };
    animate();
    setIsReady(true);

    const openHandler = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      const found = challenges.find((item) => item.id === id);
      if (found) {
        setActive(found);
        setSelected(null);
        setFeedback("");
      }
    };
    window.addEventListener("breach-hotel-open", openHandler);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("breach-hotel-open", openHandler);
      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) material.forEach((item) => item.dispose());
          else material.dispose();
        }
      });
    };
  }, []);

  const submit = () => {
    if (!active || selected === null) return;
    if (selected === active.correct) {
      if (!completed.includes(active.id)) {
        setCompleted((items) => [...items, active.id]);
        setXp((value) => value + 100);
      }
      setFeedback(active.explanation + " " + active.next);
    } else {
      setFeedback("Not quite. Review the evidence and try again. Your selection has not been submitted as correct.");
    }
  };

  return (
    <main className="hotel-game">
      <header className="hotel-topbar">
        <Link href="/" className="hotel-brand"><span>BREACH</span><b>.</b><small>FIELD SIMULATION</small></Link>
        <div className="hotel-status"><i /> HOTEL NETWORK INCIDENT <span>CASE 0417</span></div>
        <Link href="/mission-2" className="hotel-exit">EXIT TO MISSION 02 ↗</Link>
      </header>

      <section className="hotel-intro">
        <div><span className="hotel-kicker">MISSION 02 // ENVIRONMENTAL INVESTIGATION</span><h1>THE <em>IMPOSTOR</em></h1><p>Something is wrong at the Northstar Hotel. Explore the lobby, talk to staff, and inspect the digital evidence. The full certificate investigation is still waiting when you&apos;re ready.</p></div>
        <div className="hotel-stats"><div><strong>{completed.length}/4</strong><small>CLUES VERIFIED</small></div><div><strong>{xp}</strong><small>XP EARNED</small></div></div>
      </section>

      <section className="hotel-play-area">
        <div className="hotel-world-frame">
          <div className="hotel-world-label"><span>◈ NORTHSTAR HOTEL // LOBBY</span><span>3D WORLD · SIMULATION</span></div>
          <canvas ref={canvasRef} className="hotel-canvas" aria-label="Interactive 3D hotel lobby. Use WASD or arrow keys to move and click objects to investigate." />
          <div className="hotel-map-legend"><span><i className="legend-player" /> YOU</span><span><i className="legend-target" /> INVESTIGATE</span><span>W A S D / ARROWS TO MOVE · E TO INTERACT</span></div>
          <div className="hotel-notice">{notice}</div>
          {!isReady && <div className="hotel-loading">{notice}</div>}
        </div>
        <aside className="hotel-side-panel">
          <div className="hotel-panel-title"><span>MISSION OBJECTIVES</span><b>01 / 04</b></div>
          <p>Explore each area and confirm what the evidence actually tells you. Finding an object does not automatically complete an investigation.</p>
          {challenges.map((item, index) => (
            <button type="button" key={item.id} className={`hotel-objective ${completed.includes(item.id) ? "is-done" : ""}`} onClick={() => { setActive(item); setSelected(null); setFeedback(""); }}>
              <span className="hotel-objective-number">{String(index + 1).padStart(2, "0")}</span><span><strong>{item.location}</strong><small>{item.title}</small></span><b>{completed.includes(item.id) ? "✓" : "↗"}</b>
            </button>
          ))}
          <div className="hotel-tip"><b>FIELD TIP</b><p>Look at the actual website address. A familiar logo or a padlock does not prove that a site belongs to the hotel.</p></div>
          <Link href="/mission-2" className="hotel-full-mission">OPEN FULL PKI INVESTIGATION <span>↗</span></Link>
        </aside>
      </section>

      <footer className="hotel-footer"><span>BREACH // TRAINING SIMULATION</span><span>FICTIONAL PEOPLE · FICTIONAL SYSTEMS · NO LIVE NETWORK ACCESS</span></footer>

      {active && <div className="hotel-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActive(null); }}>
        <section className="hotel-modal" role="dialog" aria-modal="true" aria-labelledby="hotel-modal-title">
          <div className="hotel-modal-head"><span>{active.location} · EVIDENCE FOUND</span><button type="button" onClick={() => setActive(null)} aria-label="Close investigation">×</button></div>
          <h2 id="hotel-modal-title">{active.title}</h2>
          <p className="hotel-briefing">{active.briefing}</p>
          <div className="hotel-evidence-grid">{active.evidence.map((item) => <div key={item.label}><small>{item.label}</small><strong>{item.value}</strong></div>)}</div>
          <div className="hotel-question"><span>INVESTIGATION CHECK</span><h3>{active.question}</h3></div>
          <div className="hotel-choices">{active.choices.map((choice, index) => <button type="button" key={choice} className={selected === index ? "is-selected" : ""} onClick={() => { setSelected(index); setFeedback(""); }}><b>{String.fromCharCode(65 + index)}</b>{choice}</button>)}</div>
          <div className="hotel-confirm-row"><span>{selected === null ? "Select an answer, then confirm your decision." : "Answer selected — it is not submitted yet."}</span><button type="button" onClick={submit} disabled={selected === null}>CONFIRM ANSWER</button></div>
          {feedback && <div className={`hotel-feedback ${selected === active.correct ? "feedback-correct" : "feedback-retry"}`}>{feedback}</div>}
          {completed.includes(active.id) && <div className="hotel-modal-next"><span>✓ EVIDENCE VERIFIED · +100 XP</span><button type="button" onClick={() => setActive(null)}>RETURN TO HOTEL</button></div>}
        </section>
      </div>}
    </main>
  );
}
