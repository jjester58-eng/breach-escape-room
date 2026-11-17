"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { InvestigationHeatmap, type HeatNode } from "@/components/breach/MissionRuntime";
import { MISSION_RUNTIME_CONFIG } from "@/lib/breach/mission-runtime";

type SavedProgress = { version: 1; level: number; activeBranch: string; answers: Record<string, number>; report: string; submitted: boolean; showHint: boolean; deepDive: boolean; studentName: string; certificateReady: boolean; savedAt: string };

type Choice = { label: string; correct: boolean; feedback: string };
type Challenge = { prompt: string; context: string; choices: Choice[]; explain: string };
type Branch = { id: string; title: string; subtitle: string; icon: string; evidence: string[]; challenges: Challenge[] };

const branches: Branch[] = [
  {
    id: "phishing", title: "Phishing Analysis", subtitle: "Inspect the message and sender", icon: "✉",
    evidence: ["Display name: District Payroll Services", "Actual sender: payroll-update@district-payroll.example", "Reply-to: payroll-helpdesk@external-mail.example", "Message creates urgency: verify by 3:00 PM", "Link destination is not the district's known payroll domain"],
    challenges: [
      { prompt: "Which clue makes you most suspicious that someone is pretending to be the district payroll office?", context: "The display name says “District Payroll Services,” but display names can be chosen by the sender.", choices: [
        { label: "The email uses a professional-looking logo", correct: false, feedback: "Logos can be copied. Visual branding alone does not prove who sent a message." },
        { label: "The real sender address and reply-to address do not match the district", correct: true, feedback: "Correct. Compare the real sender and reply-to addresses with trusted district contact information." },
        { label: "The message mentions a payroll deadline", correct: false, feedback: "Urgency is suspicious, but the sender details provide stronger evidence of impersonation." }
      ], explain: "The name shown at the top of an email can be faked. Check the full email address using a trusted district contact list." },
      { prompt: "What is the safest way to verify the payroll request?", context: "The email asks the employee to use its link before a deadline.", choices: [
        { label: "Reply and ask whether the request is legitimate", correct: false, feedback: "A reply goes back to the potentially controlled mailbox. It does not independently verify the request." },
        { label: "Use a known district phone number or saved payroll portal", correct: true, feedback: "Correct. Use a separate, trusted communication channel—not contact details supplied in the suspicious message." },
        { label: "Open the link in a private browser window", correct: false, feedback: "Private browsing does not make a malicious website safe." }
      ], explain: "This means checking through a different trusted method. Do not use the phone number, link, or reply address in a suspicious message to prove that same message is real." }
    ]
  },
  {
    id: "malware", title: "Malware Investigation", subtitle: "Examine the attachment and endpoint alert", icon: "⌘",
    evidence: ["Attachment: Payroll_Update.pdf.exe", "Reported file size: 184 KB", "Endpoint alert: Unknown executable launched from Downloads", "Parent process: explorer.exe", "Outbound connection attempt: 198.51.100.24:443"],
    challenges: [
      { prompt: "What is the most important warning sign in the attachment name?", context: "The employee expected a PDF, but the reported filename ends in .pdf.exe.", choices: [
        { label: "The file is smaller than a typical PDF", correct: false, feedback: "File size alone is not enough to identify malware." },
        { label: "The final extension is .exe, meaning it is an executable program", correct: true, feedback: "Correct. The final extension matters. A filename can be crafted to look like a document while actually being executable." },
        { label: "The filename contains an underscore", correct: false, feedback: "Underscores are ordinary filename characters and are not evidence of malware." }
      ], explain: "An executable disguised as a document is a common social-engineering technique. Students should inspect file type and source, not just the displayed name." },
      { prompt: "A computer alert shows that an unknown program ran and tried to connect outside the network. What should you do first?", context: "This is a simulated endpoint detection alert. No real file or network connection exists.", choices: [
        { label: "Run the file again to see whether the alert repeats", correct: false, feedback: "Do not execute a suspicious file again. That could increase the impact." },
        { label: "Preserve alert details and follow the organization's isolation procedure", correct: true, feedback: "Correct. Save the alert details and follow the school's or organization's steps for safely disconnecting the affected computer." },
        { label: "Delete every file in the Downloads folder", correct: false, feedback: "Broad deletion can destroy evidence and does not reliably contain an incident." }
      ], explain: "The alert, times, file hash, program details, and connection records can help explain what happened. Follow the response plan before taking action." }
    ]
  },
  {
    id: "credentials", title: "Credential Theft", subtitle: "Investigate the fake sign-in page", icon: "⌑",
    evidence: ["Page title: District Payroll Login", "URL: district-payroll-update.example/login", "Expected portal: payroll.weatherfordisd.example (fictional training domain)", "Login event: new browser, unfamiliar location", "MFA prompt: repeated approval requests"],
    challenges: [
      { prompt: "Which detail most strongly suggests the login page is not the expected payroll portal?", context: "The page looks convincing and uses familiar colors and wording.", choices: [
        { label: "The page has a district-style logo", correct: false, feedback: "Branding is easy to copy and does not establish domain ownership." },
        { label: "The domain does not match the known payroll portal", correct: true, feedback: "Correct. Check the actual registered domain, not just the words appearing in the URL." },
        { label: "The page asks for a username", correct: false, feedback: "Legitimate services also request usernames. The destination domain is the stronger clue." }
      ], explain: "A fake page can look real. Check the full website address and use a saved bookmark or the district's official website." },
      { prompt: "An employee reports repeated unexpected MFA approval prompts. What should they do?", context: "The employee did not initiate any sign-in attempt.", choices: [
        { label: "Approve one prompt to make the notifications stop", correct: false, feedback: "Never approve a sign-in you did not initiate. This may grant an attacker access." },
        { label: "Deny the prompts and report the activity through the approved channel", correct: true, feedback: "Correct. Unexpected MFA prompts may indicate that someone already has the password." },
        { label: "Turn off MFA permanently", correct: false, feedback: "Disabling MFA removes an important layer of protection." }
      ], explain: "Repeated MFA prompts can be an indicator of attempted account compromise. Deny unexpected requests and report them immediately." }
    ]
  },
  {
    id: "reporting", title: "Early Reporting", subtitle: "Make the first response decision", icon: "盾",
    evidence: ["Two employees received similar messages", "One employee clicked the link but did not enter information", "One employee opened the attachment", "Help desk ticket has no attachment or screenshots yet", "The email may still be in other inboxes"],
    challenges: [
      { prompt: "What is the best first action when an employee reports this suspicious email?", context: "You are the first analyst to receive the report. The incident scope is not yet known.", choices: [
        { label: "Tell the employee to forward it to coworkers for a second opinion", correct: false, feedback: "Forwarding can expose more people to the message and spread the threat." },
        { label: "Record the report, preserve the message details, and follow the escalation process", correct: true, feedback: "Correct. Capture who received it, what actions occurred, and the relevant message details. Escalate through the approved process." },
        { label: "Immediately wipe the employee's computer", correct: false, feedback: "Wiping is destructive, premature, and may eliminate important evidence." }
      ], explain: "A good response starts with reporting what happened and saving the evidence. Do not panic or delete things before the team can investigate." },
      { prompt: "Which employee needs the most urgent follow-up?", context: "Employee A received the email but did not interact. Employee B clicked the link but entered nothing. Employee C opened the executable attachment.", choices: [
        { label: "Employee A, because they received the email first", correct: false, feedback: "Receiving the message matters, but interaction with the attachment raises a more immediate endpoint concern." },
        { label: "Employee C, because an executable was opened", correct: true, feedback: "Correct. The device should be assessed promptly under the organization's endpoint incident procedure." },
        { label: "All three can be ignored if nobody reports a missing paycheck", correct: false, feedback: "Waiting for visible harm is not an incident response strategy." }
      ], explain: "Prioritize based on observed actions and risk. Clicking, entering credentials, and executing a file create different response needs." }
    ]
  }
];

const levels = [
  { id: 1, name: "LEVEL 1", title: "First Responder", time: "15–20 min", branches: 2, description: "A focused introduction. Follow guided clues, identify the obvious warning signs, and make two key decisions.", hint: "Guided clues · 2 investigations · Short incident summary" },
  { id: 2, name: "LEVEL 2", title: "Threat Analyst", time: "25–35 min", branches: 3, description: "Investigate more of the incident. Compare evidence across three paths and explain why your choices matter.", hint: "Some guidance · 3 investigations · Evidence-based summary" },
  { id: 3, name: "LEVEL 3", title: "Security Investigator", time: "40–55 min", branches: 4, description: "Work the complete case. Investigate every branch, connect the evidence, and make a defensible assessment.", hint: "Limited guidance · All 4 investigations · Full incident report" },
  { id: 4, name: "LEVEL 4", title: "Incident Commander", time: "60–75 min", branches: 4, description: "Complete the full investigation, then tackle additional analysis and a deeper response brief. Expect fewer hints and more independent reasoning.", hint: "Minimal guidance · All investigations · Advanced response brief" }
];

export default function MissionOneClient() {
  const [level, setLevel] = useState<number | null>(null);
  const [activeBranch, setActiveBranch] = useState("phishing");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [report, setReport] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [deepDive, setDeepDive] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [certificateReady, setCertificateReady] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [restoredProgress, setRestoredProgress] = useState(false);
  const [selectedHeatNode, setSelectedHeatNode] = useState("sender");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("breach:mission-1:v1");
      if (raw) {
        const saved = JSON.parse(raw) as Partial<SavedProgress>;
        if (saved.version === 1 && typeof saved.level === "number" && levels.some((item) => item.id === saved.level)) {
          setLevel(saved.level);
          setActiveBranch(saved.activeBranch && branches.some((item) => item.id === saved.activeBranch) ? saved.activeBranch : "phishing");
          setAnswers(saved.answers && typeof saved.answers === "object" ? saved.answers : {});
          setReport(typeof saved.report === "string" ? saved.report : "");
          setSubmitted(saved.submitted === true);
          setShowHint(saved.showHint === true);
          setDeepDive(saved.deepDive === true);
          setStudentName(typeof saved.studentName === "string" ? saved.studentName : "");
          setCertificateReady(saved.certificateReady === true);
          setRestoredProgress(true);
        }
      }
    } catch {
      // Ignore damaged or unavailable browser storage; the investigation can still be played.
    } finally {
      setProgressLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!progressLoaded) return;
    try {
      if (level === null) {
        window.localStorage.removeItem("breach:mission-1:v1");
        return;
      }
      const saved: SavedProgress = {
        version: 1, level, activeBranch, answers, report, submitted, showHint,
        deepDive, studentName, certificateReady, savedAt: new Date().toISOString()
      };
      window.localStorage.setItem("breach:mission-1:v1", JSON.stringify(saved));
    } catch {
      // Storage may be disabled or full. Do not interrupt the student's work.
    }
  }, [progressLoaded, level, activeBranch, answers, report, submitted, showHint, deepDive, studentName, certificateReady]);


  const selectedLevel = levels.find((item) => item.id === level);
  const requiredBranches = selectedLevel?.branches ?? 0;
  const questionsPerBranch = level === 1 ? 1 : 2;
  const completedBranches = branches.filter((branch) => branch.challenges.slice(0, questionsPerBranch).every((_, index) => answers[branch.id + "-" + index] !== undefined)).length;
  const active = branches.find((branch) => branch.id === activeBranch) ?? branches[0];
  const branchComplete = active.challenges.slice(0, questionsPerBranch).every((_, index) => answers[active.id + "-" + index] !== undefined);
  const progress = selectedLevel ? Math.min(100, Math.round((Math.min(completedBranches, requiredBranches) / requiredBranches) * 100)) : 0;
  const canReport = selectedLevel !== undefined && completedBranches >= requiredBranches && (level !== 4 || deepDive);
  const score = useMemo(() => Object.entries(answers).filter(([key, value]) => value >= 0 && branches.some((b) => key.startsWith(b.id + "-") && b.challenges[Number(key.split("-")[1])]?.choices[value]?.correct)).length, [answers]);
  const heatNodes: HeatNode[] = MISSION_RUNTIME_CONFIG["mission-1"].targets.map((target, index) => {
    const branch = branches.find((item) => item.id === ["phishing", "malware", "credentials", "reporting"][index]);
    const correct = branch?.challenges.filter((challenge, questionIndex) => answers[branch.id + "-" + questionIndex] !== undefined && challenge.choices[answers[branch.id + "-" + questionIndex]]?.correct).length ?? 0;
    const incorrect = branch?.challenges.filter((challenge, questionIndex) => answers[branch.id + "-" + questionIndex] !== undefined && !challenge.choices[answers[branch.id + "-" + questionIndex]]?.correct).length ?? 0;
    return { ...target, proximity: Math.max(0, Math.min(100, 10 + correct * 42 - incorrect * 8)) };
  });

  function chooseAnswer(branchId: string, index: number, choiceIndex: number) {
    const key = branchId + "-" + index;
    setAnswers((current) => ({ ...current, [key]: choiceIndex }));
  }

  function startLevel(id: number) {
    setRestoredProgress(false);
    setLevel(id); setAnswers({}); setReport(""); setSubmitted(false); setDeepDive(false); setShowHint(false); setActiveBranch("phishing"); setStudentName(""); setCertificateReady(false);
  }

  if (!progressLoaded) {
    return <main className="game-shell"><div className="eyebrow">LOADING SAVED INVESTIGATION…</div></main>;
  }

  if (level === null) {
    return (
      <main className="game-shell">
        <nav className="game-nav"><Link className="brand" href="/"><span className="brand-mark">B</span><span>BREACH<span className="brand-period">.</span></span></Link><span className="topbar-status"><i /> TRAINING ENVIRONMENT</span></nav>
        <div className="game-heading"><Link href="/" className="back-link">← BACK TO CASE FILES</Link><div className="eyebrow">MISSION 01 / INITIAL ACCESS</div><h1 className="game-title">THE <em>INFILTRATION</em><span className="accent">.</span></h1><p className="game-lead">A suspicious payroll email has reached district employees. Investigate how an attacker may be trying to get inside.</p></div>
        <section className="scenario-panel"><div className="panel-kicker">INCIDENT BRIEF / 0417-A</div><h2>OPERATION PAYROLL</h2><p>Two employees have reported a message claiming to be from District Payroll Services. One employee clicked the link. Another opened an attachment. The help desk needs an initial assessment.</p><div className="scenario-meta"><span>SIMULATED DISTRICT NETWORK</span><span>NO LIVE FILES OR SYSTEMS</span><span>CHOOSE YOUR DIFFICULTY</span></div></section>
        <div className="level-heading"><div><div className="eyebrow">SELECT YOUR CLEARANCE</div><h2>CHOOSE A LEVEL<span className="accent">.</span></h2></div><p>Higher levels add investigation steps, evidence, and independent analysis. Choose the level that fits your experience and available time.</p></div>
        <div className="level-grid">{levels.map((item) => <button className="level-card" key={item.id} onClick={() => startLevel(item.id)}><div className="level-top"><span>{item.name}</span><span className="level-time">{item.time}</span></div><h3>{item.title}</h3><p>{item.description}</p><div className="level-footer">{item.hint}<b>↗</b></div></button>)}</div>
        <p className="game-footnote">Time estimates are targets, not countdowns. You can pause, review evidence, and work at your own pace.</p>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="game-shell completion-shell">
        <nav className="game-nav no-print"><Link className="brand" href="/"><span className="brand-mark">B</span><span>BREACH<span className="brand-period">.</span></span></Link><span className="topbar-status"><i /> CASE REVIEW</span></nav>
        <section className="completion-panel no-print">
          <div className="completion-mark">✓</div>
          <div className="eyebrow">MISSION 01 / REPORT RECEIVED</div>
          <h1 className="game-title">INITIAL ACCESS<br/><em>INVESTIGATED</em><span className="accent">.</span></h1>
          <p className="game-lead">You completed {selectedLevel?.title}. Your findings and completion details are saved on this browser.</p><div className="autosave-strip"><span>✓ COMPLETION SAVED ON THIS DEVICE</span></div>
          <div className="completion-stats"><div><strong>{score}</strong><span>ACCURATE DECISIONS</span></div><div><strong>{completedBranches}</strong><span>BRANCHES COMPLETED</span></div><div><strong>LEVEL {level}</strong><span>DIFFICULTY</span></div></div>
          <div className="report-review"><div className="panel-kicker">YOUR INCIDENT SUMMARY</div><p>{report}</p></div>
          {!certificateReady ? (
            <section className="certificate-entry">
              <div className="panel-kicker">FINAL STEP / COMPLETION CERTIFICATE</div>
              <h2>WHO COMPLETED THIS MISSION?</h2>
              <p>Enter your name as you want it to appear on your certificate. You can then print it, save it as a PDF, or take a screenshot to submit for your completion grade.</p>
              <label htmlFor="student-certificate-name">STUDENT NAME</label>
              <input id="student-certificate-name" value={studentName} onChange={(event) => setStudentName(event.target.value)} maxLength={70} placeholder="Enter first and last name" />
              <button className="primary-button" disabled={!studentName.trim()} onClick={() => setCertificateReady(true)}>GENERATE CERTIFICATE ↗</button>
            </section>
          ) : (
            <div className="certificate-actions">
              <p><strong>Certificate ready.</strong> Use Print / Save as PDF, or take a screenshot of the certificate below.</p>
              <button className="primary-button" onClick={() => window.print()}>PRINT / SAVE AS PDF ↗</button>
              <button className="secondary-button" onClick={() => setCertificateReady(false)}>EDIT STUDENT NAME</button>
            </div>
          )}
          <div className="completion-actions"><button className="secondary-button" onClick={() => startLevel(level)}>REPLAY THIS LEVEL ↻</button><Link className="secondary-button" href="/">RETURN TO CASE FILES</Link></div>
        </section>
        {certificateReady && (
          <section className="certificate-sheet" aria-label="BREACH certificate of completion">
            <div className="certificate-frame">
              <div className="certificate-brand">BREACH<span>.</span></div>
              <div className="certificate-subtitle">CYBERSECURITY ESCAPE ROOM</div>
              <div className="certificate-rule" />
              <div className="certificate-kicker">CERTIFICATE OF COMPLETION</div>
              <p className="certificate-intro">This certifies that</p>
              <h2 className="certificate-student">{studentName.trim()}</h2>
              <p className="certificate-intro">has successfully completed</p>
              <h3 className="certificate-mission">MISSION 01 — THE INFILTRATION</h3>
              <div className="certificate-status">MISSION COMPLETE</div>
              <div className="certificate-details"><div><span>DIFFICULTY</span><strong>LEVEL {level}</strong></div><div><span>ACCURATE DECISIONS</span><strong>{score}</strong></div><div><span>INVESTIGATION PATHS</span><strong>{completedBranches}</strong></div></div>
              <div className="certificate-date">COMPLETION DATE: {new Date().toLocaleDateString()}</div>
              <div className="certificate-footer">BREACH CYBERSECURITY TRAINING <span>·</span> FICTIONAL TRAINING ENVIRONMENT</div>
            </div>
          </section>
        )}
      </main>
    );
  }

  return (
    <main className="game-shell">
      <nav className="game-nav"><Link className="brand" href="/"><span className="brand-mark">B</span><span>BREACH<span className="brand-period">.</span></span></Link><div className="mission-nav-label">MISSION 01 <span>/</span> THE INFILTRATION</div><span className="topbar-status"><i /> LEVEL {level} ACTIVE</span></nav>
      <div className="play-header"><div><Link href="/mission-1" className="back-link">← CHANGE LEVEL</Link><div className="eyebrow">OPERATION PAYROLL / CASE 0417-A</div><h1 className="play-title">INVESTIGATION <em>DESK</em></h1></div><div className="play-meta"><strong>{selectedLevel?.time}</strong><span>ESTIMATED COMPLETION</span></div></div>
      <div className="autosave-strip"><span>✓ AUTO-SAVE ON THIS DEVICE</span><button onClick={() => { if (window.confirm("Start this investigation over? Your saved answers and report on this browser will be erased.")) { window.localStorage.removeItem("breach:mission-1:v1"); startLevel(level); } }}>START OVER ↻</button></div>
      {restoredProgress && <div className="restore-notice">SAVED INVESTIGATION RESTORED — You can continue where you left off. Your work is saved automatically on this browser.</div>}
      <div className="autosave-strip"><span>✓ AUTO-SAVE ON THIS DEVICE</span><button onClick={() => { if (window.confirm("Start this investigation over? Your saved answers and report on this browser will be erased.")) { window.localStorage.removeItem("breach:mission-1:v1"); startLevel(level); } }}>START OVER ↻</button></div>
      {restoredProgress && <div className="restore-notice">SAVED INVESTIGATION RESTORED — You can continue where you left off. Your work is saved automatically on this browser.</div>}
      <div className="progress-wrap"><div className="progress-label"><span>INVESTIGATION PROGRESS</span><strong>{Math.min(completedBranches, requiredBranches)} / {requiredBranches} REQUIRED BRANCHES</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: progress + "%" }} /></div></div>
      <InvestigationHeatmap nodes={heatNodes} selectedId={selectedHeatNode} onSelect={setSelectedHeatNode} />
      <section className="email-panel"><div className="email-toolbar"><span>INCOMING MESSAGE / EMPLOYEE REPORT</span><span className="alert-pill">SUSPICIOUS</span></div><div className="email-body"><div className="email-line"><span>FROM</span><strong>District Payroll Services &lt;payroll-update@district-payroll.example&gt;</strong></div><div className="email-line"><span>SUBJECT</span><strong>Action Required — Payroll Information Update</strong></div><p>Please review the attached payroll update and verify your information by 3:00 PM today to prevent delays to your next paycheck.</p><div className="email-attachment">▤ &nbsp; Payroll_Update.pdf &nbsp; <small>ATTACHMENT</small></div><div className="email-link">↗ &nbsp; district-payroll-update.example</div></div></section>
      <div className="investigation-layout">
        <aside className="branch-sidebar"><div className="panel-kicker">INVESTIGATION PATHS</div><p className="sidebar-intro">Choose an evidence path. You can investigate in any order.</p>{branches.map((branch) => { const done = branch.challenges.slice(0, questionsPerBranch).every((_, i) => answers[branch.id + "-" + i] !== undefined); return <button key={branch.id} className={`branch-button ${activeBranch === branch.id ? "branch-selected" : ""} ${done ? "branch-done" : ""}`} onClick={() => setActiveBranch(branch.id)}><span className="branch-icon">{branch.icon}</span><span className="branch-button-copy"><strong>{branch.title}</strong><small>{branch.subtitle}</small></span><span className="branch-check">{done ? "✓" : "↗"}</span></button>; })}<div className="hint-box"><button onClick={() => setShowHint(!showHint)} className="hint-toggle"> {showHint ? "HIDE" : "SHOW"} FIELD GUIDANCE</button>{showHint && <p>{level === 1 ? "Start with the sender details. Look for mismatched domains, unexpected attachments, and urgent requests." : level === 2 ? "Compare the evidence. Ask what the attacker wants and what action could create the greatest risk." : level === 3 ? "Compare clues from the email, computer, and user account. Save the evidence before suggesting what to do next." : "Think about the whole incident: who is affected, what might be at risk, what evidence must be saved, how to limit the damage, and who needs to know."}</p>}</div></aside>
        <section className="evidence-panel"><div className="evidence-heading"><div><div className="panel-kicker">EVIDENCE REVIEW / {active.id.toUpperCase()}</div><h2>{active.title}</h2><p>{active.subtitle}</p></div><span className="evidence-count">{active.evidence.length} CLUES</span></div><div className="evidence-list">{active.evidence.slice(0, level === 1 ? 3 : level === 2 ? 4 : 5).map((item, index) => <div className="evidence-item" key={item}><span>{String(index + 1).padStart(2, "0")}</span>{item}</div>)}</div>
          {active.challenges.map((challenge, index) => { const key = active.id + "-" + index; const chosen = answers[key]; const expanded = level === 1 ? index === 0 : level === 2 ? index === 0 || index === 1 : true; if (!expanded) return null; return <div className="challenge-card" key={key}><div className="challenge-number">DECISION {index + 1} / {active.challenges.length}</div><h3>{challenge.prompt}</h3><p className="challenge-context">{challenge.context}</p><div className="choice-list">{challenge.choices.map((choice, choiceIndex) => <button key={choice.label} disabled={chosen !== undefined} className={`choice-button ${chosen === choiceIndex ? (choice.correct ? "choice-correct" : "choice-wrong") : ""} ${chosen !== undefined && choice.correct ? "choice-reveal" : ""}`} onClick={() => chooseAnswer(active.id, index, choiceIndex)}><span className="choice-letter">{String.fromCharCode(65 + choiceIndex)}</span><span>{choice.label}</span>{chosen === choiceIndex && <b>{choice.correct ? "✓" : "×"}</b>}</button>)}</div>{chosen !== undefined && <div className={`feedback-box ${active.challenges[index].choices[chosen].correct ? "feedback-good" : "feedback-review"}`}><strong>{active.challenges[index].choices[chosen].correct ? "ANALYST NOTE — CORRECT" : "ANALYST NOTE — REVIEW"}</strong><p>{active.challenges[index].choices[chosen].feedback}</p><small>{challenge.explain}</small></div>}</div>; })}
          {branchComplete && <div className="branch-complete"><strong>✓ INVESTIGATION PATH COMPLETE</strong><span>Evidence reviewed and decisions recorded. Select another path or prepare your incident report.</span></div>}
        </section>
      </div>
      {level === 4 && <section className="deep-dive-panel"><div className="panel-kicker">LEVEL 4 / COMMANDER&apos;S ADDITIONAL TASK</div><h3>Build the attack timeline</h3><p>Before submitting, review the evidence you collected and identify the most likely sequence: suspicious email received → employee interaction → possible account or endpoint compromise → suspicious activity reported.</p><label className="deep-dive-check"><input type="checkbox" checked={deepDive} onChange={(e) => setDeepDive(e.target.checked)} /> I have reviewed the sequence and can explain which evidence supports it.</label></section>}
      {canReport ? <section className="report-panel"><div className="panel-kicker">FINAL TASK / INCIDENT SUMMARY</div><h2>WHAT HAPPENED?</h2><p>{level === 1 ? "Identify one warning sign from the email and explain the safest next step." : level === 2 ? "Explain the likely attack method, cite at least one clue, and recommend a safe response." : level === 3 ? "Identify the likely attack method, connect at least two pieces of evidence, and recommend containment and reporting actions." : "Write a short incident report. Explain how the attack may have happened, include at least three clues, describe possible damage, and list the most important next steps."}</p><textarea value={report} onChange={(e) => setReport(e.target.value)} placeholder={level === 4 ? "Incident commander assessment: The likely attack chain is... Evidence indicates... Immediate priorities are..." : "My assessment: The incident appears to involve..."} rows={5} /><button className="primary-button" disabled={report.trim().length < (level === 1 ? 25 : level === 2 ? 60 : level === 3 ? 90 : 140)} onClick={() => setSubmitted(true)}>SUBMIT INCIDENT REPORT ↗</button><small>{level === 1 ? "At least 25 characters" : level === 2 ? "At least 60 characters" : level === 3 ? "At least 90 characters" : "At least 140 characters"} required. Be specific and use evidence.</small></section> : <div className="locked-report"><span>▣</span><div><strong>FINAL INCIDENT REPORT LOCKED</strong><small>Complete {Math.max(0, requiredBranches - completedBranches)} more investigation path(s){level === 4 && !deepDive ? " and the commander's timeline task" : ""} to unlock your report.</small></div></div>}
      <footer className="game-footer"><span>BREACH / FICTIONAL TRAINING ENVIRONMENT</span><span>NO REAL FILES · NO EXTERNAL SYSTEMS · NO LIVE CREDENTIALS</span></footer>
    </main>
  );
}
