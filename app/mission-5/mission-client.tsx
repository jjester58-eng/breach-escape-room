"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { InvestigationHeatmap, MissionCountdown, MissionScoreboard, type HeatNode } from "@/components/breach/MissionRuntime";
import { DIFFICULTY_TIMES, MISSION_RUNTIME_CONFIG, type DifficultyId, formatTime } from "@/lib/breach/mission-runtime";

type Option = { label: string; correct: boolean; feedback: string; impact: number; evidence: number; cost?: number };
type Evidence = { label: string; value: string };
type Stage = {
  title: string; subtitle: string; briefing: string; evidence: Evidence[]; rookie: Evidence[]; analyst: Evidence[]; commander: Evidence[];
  question: string; context: string; rookieContext: string; commanderContext: string; options: Option[]; explanation: string; hint: string; targetId: string;
};

const stages: Stage[] = [
  {
    title:"Assess the Situation",subtitle:"Find out what is affected before choosing a response",
    briefing:"The security team has connected the clues from the earlier missions. You are taking over the incident. Decide what the evidence confirms and what still needs to be checked.",
    evidence:[{label:"MISSION 01",value:"A payroll email led an employee to open a suspicious attachment."},{label:"MISSION 02",value:"A look-alike website used an untrusted digital certificate."},{label:"MISSION 03",value:"Hidden information and changed file records point to PC-22."},{label:"MISSION 04",value:"PC-22 made an unusual outside connection, then contacted FILE-SRV-01."}],
    rookie:[{label:"CONFIRMED CLUE",value:"PC-22 is the first computer linked to the suspicious activity."},{label:"NEEDS CHECKING",value:"FILE-SRV-01 may have been accessed, but the logs do not prove it was fully compromised."}],
    analyst:[{label:"16:41:02",value:"PC-22 → 203.0.113.77:443 | outbound TLS session"},{label:"16:42:11",value:"PC-22 → FILE-SRV-01 | TCP 445 | new SMB session"},{label:"16:44:08",value:"svc-backup | interactive sign-in from PC-22 | success"},{label:"SCOPE LIMIT",value:"No supplied record confirms database access or data theft."}],
    commander:[{label:"OPERATIONS",value:"Payroll processing is due in 35 minutes."},{label:"PEOPLE",value:"One employee reports a suspicious sign-in prompt; two responders are available."},{label:"EVIDENCE GAP",value:"The file server has an unusual access attempt, but no confirmed data loss."}],
    question:"What should be the team's starting assessment?",
    context:"Incident scope means identifying which people, computers, and information may be affected.",
    rookieContext:"Start with the computer connected to the strongest clues. Do not label every computer as hacked just because it is on the same network.",
    commanderContext:"You have limited staff and a time-sensitive payroll process. Set a defensible scope before committing resources.",
    options:[
      {label:"Treat PC-22 as the likely affected device, investigate FILE-SRV-01, and keep unconfirmed systems under review.",correct:true,feedback:"Good assessment. PC-22 has several connected clues. FILE-SRV-01 needs checking, but the evidence does not prove it is compromised.",impact:2,evidence:3},
      {label:"Declare every computer and server compromised because one employee opened an attachment.",correct:false,feedback:"This assumes more than the evidence shows. Separate confirmed facts from systems that still need checking.",impact:-2,evidence:-1},
      {label:"Close the incident because the attacker has not been seen again.",correct:false,feedback:"No new alert does not prove the threat is gone. Suspicious account and network activity still need investigation.",impact:-2,evidence:-2}
    ],
    explanation:"A good assessment lists what is known, what may be affected, and what is still unknown. This helps the team respond without making unsupported claims.",
    hint:"Look for the computer that appears in the email, file, and network evidence. Keep the server in the needs-investigation group until its records are checked.",
    targetId:"scope"
  },
  {
    title:"Contain the Threat",subtitle:"Limit the attack without shutting down everything",
    briefing:"The team has enough evidence to act. Containment means limiting the attack while the investigation continues. It does not mean deleting files or turning off every system.",
    evidence:[{label:"LIKELY AFFECTED",value:"PC-22 — suspicious attachment activity and unusual network connections"},{label:"ACCOUNT",value:"svc-backup — unexpected interactive sign-in"},{label:"SERVER",value:"FILE-SRV-01 — needs validation; full compromise is not confirmed"},{label:"BUSINESS NEED",value:"Payroll and other normal services should continue when safe."}],
    rookie:[{label:"ISOLATE",value:"Disconnect a computer from the network so it cannot contact other devices."},{label:"DISABLE ACCOUNT",value:"Stop an account from being used while the team checks it."},{label:"PRESERVE",value:"Keep logs and files for the investigation. Do not delete them."}],
    analyst:[{label:"ENDPOINT ALERT",value:"PC-22 | suspicious process | outbound TLS | new SMB session"},{label:"IDENTITY ALERT",value:"svc-backup | interactive login | source PC-22"},{label:"NETWORK NOTE",value:"No evidence supports a full network shutdown at this time."}],
    commander:[{label:"RESOURCE LIMIT",value:"Two responders. One can isolate an endpoint; the other can handle identity controls."},{label:"TRADE-OFF",value:"A broad shutdown will interrupt payroll and classroom services."},{label:"COST",value:"Containment actions use response capacity. Preserve time for recovery."}],
    question:"Choose the best first containment action.",
    context:"Containment stops or limits the attack while the team investigates. Isolation disconnects a device from the network; it does not erase the device.",
    rookieContext:"Stop PC-22 from talking to other computers and stop the unusual account from being used. Keep the evidence.",
    commanderContext:"Choose a focused response. A broad shutdown has a real operational cost, and responders are limited.",
    options:[
      {label:"Isolate PC-22 using the approved process, disable active sessions for svc-backup, and preserve the logs.",correct:true,feedback:"Strong containment. This targets the likely foothold, blocks the unusual account activity, and keeps evidence for the next steps.",impact:3,evidence:2,cost:1},
      {label:"Disconnect the entire organization from the network immediately.",correct:false,feedback:"A full shutdown may interrupt important work and is not supported by the current scope. Start with systems tied to the evidence.",impact:-3,evidence:0,cost:2},
      {label:"Leave everything connected until the investigation is finished.",correct:false,feedback:"The attacker may still have access. Waiting creates more risk when the team already has a likely affected endpoint and suspicious account.",impact:-3,evidence:1},
      {label:"Delete suspicious files from PC-22 and restart it.",correct:false,feedback:"Deleting files can destroy evidence and may not remove access. Preserve evidence and use an approved isolation process.",impact:-2,evidence:-2,cost:1}
    ],
    explanation:"Contain the likely affected device and suspicious account. Record what was isolated, who approved it, and when it happened.",
    hint:"Choose a focused action that blocks the likely entry point and account while keeping logs for the investigation.",
    targetId:"contain"
  },
  {
    title:"Eradicate the Threat",subtitle:"Remove the cause before systems return to service",
    briefing:"The immediate spread has been limited. The team now needs to remove the attacker's access and check for anything left behind. Eradication is more than deleting one suspicious file.",
    evidence:[{label:"PC-22",value:"Suspicious attachment and unknown program identified for forensic review."},{label:"IDENTITY",value:"svc-backup credentials may have been exposed."},{label:"PERSISTENCE CHECK",value:"Review startup items, scheduled tasks, remote access, and unauthorized account changes."},{label:"EVIDENCE RULE",value:"Preserve a copy of relevant evidence before making changes."}],
    rookie:[{label:"REMOVE ACCESS",value:"Change exposed passwords and remove access the attacker added."},{label:"CLEAN DEVICE",value:"Use the approved process to rebuild or clean the affected computer."}],
    analyst:[{label:"ACCOUNT REVIEW",value:"Reset svc-backup credentials; review service permissions and recent authentication."},{label:"ENDPOINT REVIEW",value:"Check persistence locations, scheduled tasks, startup entries, and remote access settings."},{label:"VALIDATION",value:"Compare the rebuilt endpoint against the approved configuration."}],
    commander:[{label:"RESOURCE LIMIT",value:"Only one system can be rebuilt at a time with the available response team."},{label:"DECISION",value:"Quick file deletion is faster, but does not establish that access or persistence is gone."},{label:"EVIDENCE",value:"The forensic copy must remain available for the final review."}],
    question:"What is the safest way to remove the attacker's access?",
    context:"Eradication means removing the threat and fixing the weakness that allowed it. Keep evidence before changing the system.",
    rookieContext:"Do not just delete one file. The attacker may have added another way to get back in or used a stolen password.",
    commanderContext:"Balance a thorough cleanup against the time needed to restore service. A fast action is not useful if the attacker can return.",
    options:[
      {label:"Preserve a forensic copy, reset exposed credentials, remove unauthorized access, and rebuild or clean PC-22 using the approved image.",correct:true,feedback:"Correct. This addresses the suspicious device, exposed identity, and possible ways the attacker could return while preserving evidence.",impact:3,evidence:3,cost:2},
      {label:"Delete the attachment and assume the attacker is gone.",correct:false,feedback:"The attachment may be only one part of the incident. Stolen credentials or added access could remain.",impact:-3,evidence:-2},
      {label:"Restore PC-22 from the newest backup without checking it.",correct:false,feedback:"A backup may contain the same problem or may not be trustworthy. Verify the backup and remove the cause before restoring.",impact:-2,evidence:-1,cost:1},
      {label:"Keep the same passwords so normal work is not interrupted.",correct:false,feedback:"If credentials were exposed, leaving them unchanged may let the attacker return. Plan a reset and check account permissions.",impact:-3,evidence:0}
    ],
    explanation:"Remove the attacker's access, fix the weakness, and verify the system before it returns to service. Keep the evidence copy separate from the cleaned system.",
    hint:"Think about both the suspicious program and the account that may have been exposed. The attacker must not have an easy way back in.",
    targetId:"eradicate"
  },
  {
    title:"Recover Operations",subtitle:"Restore systems only after they are checked",
    briefing:"The threat has been removed from the known affected endpoint. The organization needs its systems back, but a rushed restore could bring the problem back too.",
    evidence:[{label:"BACKUP-01",value:"A protected backup from before the suspicious email is available."},{label:"PC-22",value:"Rebuild is complete; endpoint checks and account resets must be verified."},{label:"FILE-SRV-01",value:"Access records are under review. The server has not been approved for restoration changes."},{label:"MONITORING",value:"Security alerts must be watched closely after systems return."}],
    rookie:[{label:"TRUSTED BACKUP",value:"Use a backup from before the incident, after checking that it is safe."},{label:"TEST FIRST",value:"Check the computer and its security tools before connecting it again."}],
    analyst:[{label:"BACKUP CHECK",value:"Verify backup date, integrity, and malware scan results."},{label:"SECURITY CHECK",value:"Patch the system, confirm endpoint protection, and validate account access."},{label:"MONITOR",value:"Watch endpoint, identity, DNS, and server logs after reconnecting."}],
    commander:[{label:"BUSINESS PRIORITY",value:"Payroll must run today. The file server supports several departments."},{label:"RECOVERY GATE",value:"A system cannot return to the network until security checks are signed off."},{label:"TRADE-OFF",value:"Restore the most important clean service first; do not bypass checks."}],
    question:"How should the organization bring systems back online?",
    context:"Recovery means safely returning systems to normal use. A clean backup, security checks, and monitoring help prevent the attacker from returning.",
    rookieContext:"Use a backup from before the attack, check the computer, and reconnect it only when it is safe.",
    commanderContext:"Payroll is important, but a rushed restore can create a second incident. Prioritize services and use a clear approval gate.",
    options:[
      {label:"Verify the clean backup, check patches and security tools, restore priority services, then monitor closely.",correct:true,feedback:"Correct. The organization restores from a trusted point, checks protections, and watches for signs of another attack.",impact:3,evidence:2,cost:1},
      {label:"Reconnect every system immediately because the suspicious file was deleted.",correct:false,feedback:"Deleting one file does not prove the system is safe. Recovery needs validation and monitoring.",impact:-3,evidence:-1},
      {label:"Use the newest backup without checking its date or contents.",correct:false,feedback:"A newer backup could have been made after the attack began. Verify that the backup is clean and usable first.",impact:-2,evidence:-1},
      {label:"Keep every system offline until the end of the school year.",correct:false,feedback:"This avoids some risk but creates unnecessary disruption. Restore clean, verified services in a planned order.",impact:-2,evidence:1,cost:2}
    ],
    explanation:"Recover in stages. Verify the backup, check the system, reconnect only approved devices, and watch for new alerts.",
    hint:"The newest backup is not always the safest. Check that it is from before the attack and that the restored system passes security checks.",
    targetId:"restore"
  },
  {
    title:"Lessons Learned",subtitle:"Turn the incident into a stronger security plan",
    briefing:"The immediate response is complete. The organization must explain what happened and reduce the chance of another incident. Your recommendations should connect to the evidence.",
    evidence:[{label:"ENTRY POINT",value:"A payroll-themed phishing message led to a suspicious attachment."},{label:"TRUST FAILURE",value:"A look-alike website used an untrusted certificate."},{label:"HIDDEN CLUES",value:"File evidence connected the activity to PC-22."},{label:"NETWORK CLUES",value:"PC-22 made unusual outbound and internal connections."}],
    rookie:[{label:"PREVENT",value:"Teach staff how to spot suspicious messages and report them."},{label:"PROTECT",value:"Use multi-factor authentication and keep devices updated."},{label:"PRACTICE",value:"Test backups and practice the response plan."}],
    analyst:[{label:"CONTROL GAPS",value:"Review email filtering, endpoint controls, least privilege, and service-account restrictions."},{label:"DETECTION",value:"Alert on unusual service-account logins and new internal connections."},{label:"VALIDATION",value:"Test backup recovery and review certificate trust procedures."}],
    commander:[{label:"PRIORITY",value:"Assign owners and deadlines. Do not submit a list with no plan."},{label:"BUDGET",value:"Choose improvements that reduce the biggest risks first."},{label:"ACCOUNTABILITY",value:"Schedule a follow-up review to confirm controls are working."}],
    question:"Which improvement plan best addresses what happened?",
    context:"Lessons learned means using the incident to improve security. Recommendations should solve problems found during the investigation.",
    rookieContext:"Think about how the email got through, how the account was used, and how the team can notice suspicious activity sooner.",
    commanderContext:"Choose high-value improvements. Each one needs an owner, a deadline, and a way to check whether it worked.",
    options:[
      {label:"Improve phishing reporting and email filtering, require MFA, limit service-account access, alert on unusual logins, and test backups.",correct:true,feedback:"Strong plan. These improvements connect directly to the email, identity, network, and recovery evidence.",impact:3,evidence:3},
      {label:"Tell employees to be more careful and make no technical changes.",correct:false,feedback:"Awareness helps, but it does not fix weak account controls, missing alerts, or recovery gaps.",impact:-2,evidence:0},
      {label:"Buy new computers but keep the same accounts, settings, and backup process.",correct:false,feedback:"New hardware alone does not address the causes found in the incident.",impact:-2,evidence:0}
    ],
    explanation:"A useful improvement plan names the risk, the action, who owns it, and when the team will check the result.",
    hint:"Connect each improvement to a clue: phishing, exposed identity, unusual network activity, or safe recovery.",
    targetId:"lessons"
  }
];

const difficulties: {id:DifficultyId;name:string;role:string;description:string}[] = [
  {id:"rookie",name:"ROOKIE INVESTIGATOR",role:"GUIDED RESPONSE",description:"20 minutes · plain-language evidence · definitions and step-by-step guidance"},
  {id:"analyst",name:"SECURITY ANALYST",role:"INDEPENDENT REVIEW",description:"15 minutes · simulated logs · fewer prompts and independent decisions"},
  {id:"commander",name:"INCIDENT COMMANDER",role:"ADVANCED RESPONSE",description:"12 minutes · business trade-offs · limited response resources"}
];
const initialNodes: HeatNode[] = MISSION_RUNTIME_CONFIG["mission-5"].targets.map((target,index)=>({...target,proximity:[18,12,10,8,6][index]??8}));
const roleHints: Record<DifficultyId,number> = {rookie:5,analyst:3,commander:1};

export default function MissionFiveClient() {
  const [difficulty,setDifficulty] = useState<DifficultyId|null>(null);
  const [running,setRunning] = useState(false);
  const [deadline,setDeadline] = useState<number|null>(null);
  const [remaining,setRemaining] = useState(0);
  const [expired,setExpired] = useState(false);
  const [reducedMotion,setReducedMotion] = useState(false);
  const [stage,setStage] = useState(0);
  const [answers,setAnswers] = useState<Record<number,number>>({});
  const [pendingAnswers,setPendingAnswers] = useState<Record<number,number>>({});
  const [nodes,setNodes] = useState<HeatNode[]>(initialNodes);
  const [selectedNode,setSelectedNode] = useState("scope");
  const [hintOpen,setHintOpen] = useState(false);
  const [hintsUsed,setHintsUsed] = useState(0);
  const [resources,setResources] = useState(5);
  const [impact,setImpact] = useState(0);
  const [evidenceQuality,setEvidenceQuality] = useState(0);
  const [report,setReport] = useState("");
  const [submitted,setSubmitted] = useState(false);

  useEffect(()=>{
    if(!running||deadline===null||expired)return;
    const tick=()=>{
      const next=Math.max(0,Math.ceil((deadline-Date.now())/1000));
      setRemaining(next);
      if(next===0){setRunning(false);setExpired(true);}
    };
    tick();
    const interval=window.setInterval(tick,200);
    return ()=>window.clearInterval(interval);
  },[running,deadline,expired]);

  const correctCount = useMemo(()=>Object.entries(answers).filter(([key,value])=>stages[Number(key)]?.options[value]?.correct).length,[answers]);
  const completed = Object.keys(answers).length;
  const decisionPoints = Math.max(0,correctCount*14+impact*2+evidenceQuality-hintsUsed*3);
  const timeBonus = difficulty&&!expired?Math.min(10,Math.floor((remaining/DIFFICULTY_TIMES[difficulty])*10)):0;
  const canSubmit = completed===stages.length&&report.trim().length>=100;
  const current = stages[stage];
  const containmentFailed = answers[1] !== undefined && !stages[1].options[answers[1]].correct;
  const eradicationFailed = answers[2] !== undefined && !stages[2].options[answers[2]].correct;
  const finalScore = Math.min(100,decisionPoints+(submitted?15+timeBonus:0));
  const outcome = correctCount>=4&&impact>=6&&evidenceQuality>=6?"SUCCESSFUL RECOVERY":correctCount>=3&&impact>=1?"PARTIAL RECOVERY":impact<0?"CONTAINMENT FAILURE":"INCOMPLETE INVESTIGATION";

  function start(nextDifficulty:DifficultyId){
    const duration=DIFFICULTY_TIMES[nextDifficulty];
    setDifficulty(nextDifficulty);setRemaining(duration);setDeadline(Date.now()+duration*1000);setRunning(true);setExpired(false);
    setStage(0);setAnswers({});setPendingAnswers({});setNodes(initialNodes.map(node=>({...node})));setSelectedNode("scope");
    setHintsUsed(0);setResources(nextDifficulty==="commander"?4:5);setImpact(0);setEvidenceQuality(0);setHintOpen(false);setReport("");setSubmitted(false);
  }
  function pauseOrResume(){
    if(expired||submitted)return;
    if(running){setRunning(false);setDeadline(Date.now()+remaining*1000);}else setRunning(true);
  }
  function choose(index:number){
    if(answers[stage]!==undefined||expired||!running)return;
    setPendingAnswers(previous=>({...previous,[stage]:index}));setHintOpen(false);
  }
  function confirmChoice(){
    const selected=pendingAnswers[stage];
    if(selected===undefined||answers[stage]!==undefined||expired||!running)return;
    const answer=current.options[selected];const cost=answer.cost??0;
    if(difficulty==="commander"&&cost>resources)return;
    setAnswers(previous=>({...previous,[stage]:selected}));
    setPendingAnswers(previous=>{const next={...previous};delete next[stage];return next;});
    setImpact(value=>value+answer.impact);setEvidenceQuality(value=>value+answer.evidence);
    if(difficulty==="commander")setResources(value=>Math.max(0,value-cost));
    setNodes(previous=>previous.map(node=>node.id===current.targetId?{...node,proximity:Math.max(0,Math.min(100,node.proximity+(answer.correct?55:-18)))}:node));
    setSelectedNode(current.targetId);setHintOpen(false);
  }
  function useHint(){
    if(!hintOpen&&!expired&&running&&hintsUsed<roleHints[difficulty??"rookie"])setHintsUsed(value=>value+1);
    setHintOpen(value=>!value);
  }
  function generatedReport(){
    const decisions=stages.map((item,index)=>{
      const answer=item.options[answers[index]];
      return (index+1)+". "+item.title+": "+(answer?.label??"No decision recorded.")+" "+(answer?.correct?"[Evidence-based]":"[Needs review]");
    });
    return [
      "BREACH — FINAL INCIDENT REPORT","Incident: BR-2026-014 | Operation RooBank","Role: "+(difficulty?.toUpperCase()??"NOT SELECTED"),"Outcome: "+outcome,"",
      "INCIDENT SUMMARY","A payroll-themed phishing message led to suspicious activity on PC-22. The investigation linked an untrusted look-alike website, hidden file evidence, unusual outbound traffic, a new internal file-server connection, and unexpected use of the svc-backup account.","",
      "RESPONSE DECISIONS",...decisions,"","RESPONSE METRICS","Correct decisions: "+correctCount+"/5","Operational impact score: "+impact,"Evidence handling score: "+evidenceQuality,"Response resources remaining: "+resources,"Hints used: "+hintsUsed,"",
      "INCIDENT COMMANDER NOTES",report.trim(),"","TRAINING NOTE: All systems, people, addresses, and evidence in BREACH are fictional."
    ].join("\n");
  }
  const evidence = difficulty==="rookie"?[...current.evidence.slice(0,2),...current.rookie]:difficulty==="analyst"?[...current.evidence,...current.analyst]:[...current.evidence,...current.commander];
  const currentContext = difficulty==="rookie"?current.rookieContext:difficulty==="commander"?current.commanderContext:current.context;

  if(difficulty===null)return (
    <main className="game-shell">
      <nav className="game-nav"><Link className="brand" href="/"><span className="brand-mark">B</span><span>BREACH<span className="brand-period">.</span></span></Link><span className="topbar-status"><i/> TRAINING ENVIRONMENT</span></nav>
      <div className="game-heading"><Link href="/" className="back-link">← BACK TO CASE FILES</Link><div className="eyebrow">MISSION 05 / INCIDENT RESPONSE</div><h1 className="game-title">INCIDENT <em>RESPONSE</em><span className="accent">.</span></h1><p className="game-lead">The investigation has uncovered a coordinated attack. You are now responsible for stopping it, restoring operations, and explaining how the organization will prevent another incident.</p></div>
      <section className="scenario-panel"><div className="panel-kicker">ACTIVE INCIDENT / BR-2026-014</div><h2>THE ATTACK IS STILL HAPPENING</h2><p>A payroll phishing message led to suspicious activity on PC-22. Earlier missions uncovered an untrusted website certificate, hidden file evidence, unusual network traffic, and an account used in an unexpected way. The clues are now your response plan.</p><div className="scenario-meta"><span>ONE CONNECTED INCIDENT</span><span>5 RESPONSE STAGES</span><span>DECISIONS HAVE CONSEQUENCES</span></div></section>
      <div className="level-heading"><div><div className="eyebrow">YOU ARE THE RESPONSE LEAD</div><h2>CHOOSE YOUR ROLE<span className="accent">.</span></h2></div><p>Each role changes the evidence, guidance, time, and response resources available to you.</p></div>
      <div className="level-grid">{difficulties.map(item=><button key={item.id} className="level-card" onClick={()=>start(item.id)}><div className="level-top"><span>{item.role}</span><span className="level-time">{formatTime(DIFFICULTY_TIMES[item.id])}</span></div><h3>{item.name}</h3><p>{item.description}</p><div className="level-footer"><span>TAKE INCIDENT COMMAND</span><b>↗</b></div></button>)}</div>
      <p className="game-footnote">Your choices are not final until you confirm them. The countdown begins when you choose a role. All activity takes place in a fictional training environment.</p>
      <footer className="game-footer"><span>BREACH / FICTIONAL TRAINING ENVIRONMENT</span><span>NO LIVE NETWORKS · NO EXTERNAL TARGETS</span></footer>
    </main>
  );

  if(submitted||expired)return (
    <main className="game-shell completion-shell">
      <nav className="game-nav"><Link className="brand" href="/"><span className="brand-mark">B</span><span>BREACH<span className="brand-period">.</span></span></Link><span className="topbar-status"><i/> INCIDENT REVIEW</span></nav>
      <section className="completion-panel">
        <div className="completion-mark">{submitted?"✓":"!"}</div><div className="eyebrow">MISSION 05 / {submitted?"REPORT RECEIVED":"TIME EXPIRED"}</div>
        <h1 className="game-title">{submitted?<><em>{outcome}</em></>:<>INCIDENT <em>REMAINS OPEN</em></>}<span className="accent">.</span></h1>
        <p className="game-lead">{submitted?"Your decisions and final report have been recorded in this browser session.":"The incident clock expired. Review the decisions you made and the evidence that still needs attention."}</p>
        <div className="completion-stats"><div><strong>{finalScore}/100</strong><span>MISSION SCORE</span></div><div><strong>{correctCount}/5</strong><span>BEST-PRACTICE DECISIONS</span></div><div><strong>{hintsUsed}</strong><span>HINTS USED</span></div></div>
        <div className="ir-outcome"><div><span>OPERATIONAL IMPACT</span><strong>{impact}</strong></div><div><span>EVIDENCE QUALITY</span><strong>{evidenceQuality}</strong></div><div><span>RESOURCES LEFT</span><strong>{resources}</strong></div></div>
        <div className="report-review"><div className="panel-kicker">FINAL INCIDENT REPORT</div><pre>{generatedReport()}</pre></div>
        <div className="completion-actions no-print"><button className="secondary-button" onClick={()=>window.print()}>PRINT / SAVE REPORT ↗</button><button className="secondary-button" onClick={()=>{setDifficulty(null);setDeadline(null);setExpired(false);setSubmitted(false);}}>RETURN TO ROLE SELECTION</button><button className="secondary-button" onClick={()=>difficulty&&start(difficulty)}>RESTART INCIDENT ↻</button><Link className="secondary-button" href="/">RETURN TO CASE FILES</Link></div>
      </section>
    </main>
  );

  return (
    <main className="game-shell">
      <nav className="game-nav"><Link className="brand" href="/"><span className="brand-mark">B</span><span>BREACH<span className="brand-period">.</span></span></Link><div className="mission-nav-label">MISSION 05 <span>/</span> INCIDENT RESPONSE</div><span className="topbar-status"><i/> {difficulty.toUpperCase()} ACTIVE</span></nav>
      <div className="play-header"><div><Link href="/mission-5" className="back-link">← EXIT INCIDENT</Link><div className="eyebrow">OPERATION ROOBANK / BR-2026-014</div><h1 className="play-title">INCIDENT <em>COMMAND</em></h1></div><div className="play-meta"><strong>{formatTime(remaining)}</strong><span>TIME REMAINING</span></div></div>
      <MissionCountdown remainingSeconds={remaining} running={running} expired={expired} onToggle={pauseOrResume} reducedMotion={reducedMotion} onReducedMotionChange={setReducedMotion}/>
      <div className="runtime-progress"><div><span>RESPONSE PROGRESS</span><strong>{completed} / 5 STAGES</strong></div><i><span style={{width:(completed/5*100)+"%"}}/></i></div>
      <MissionScoreboard score={decisionPoints+(completed===5&&report.trim().length>=100?15+timeBonus:0)} hintsUsed={hintsUsed} completed={completed} total={5}/>
      <div className="ir-status-strip"><div><span>THREAT STATUS</span><strong className={impact<0?"ir-danger":"ir-warning"}>{completed<2?"ACTIVE":completed<4?"CONTAINMENT IN PROGRESS":"UNDER REVIEW"}</strong></div><div><span>RESPONSE RESOURCES</span><strong>{difficulty==="commander"?resources+" / 4":resources+" AVAILABLE"}</strong></div><div><span>INCIDENT</span><strong>BR-2026-014</strong></div></div>
      <div className="mission4-layout">
        <section className="evidence-panel">
          <div className="evidence-heading"><div><div className="panel-kicker">STAGE 0{stage+1} / RESPONSE PLAN</div><h2>{current.title}</h2><p>{current.subtitle}</p></div><span className="evidence-count">{evidence.length} RECORDS</span></div>
          <div className="mission2-briefing">{current.briefing}</div>
          {stage>=2&&containmentFailed&&<div className="ir-consequence ir-consequence-danger"><strong>FOLLOW-ON ALERT</strong><span>Containment was not effective. The attacker may still have access. Confirm that accounts and connected systems are safe before moving forward.</span></div>}
          {stage>=3&&eradicationFailed&&<div className="ir-consequence ir-consequence-danger"><strong>RECOVERY HOLD</strong><span>The cleanup step did not remove all known risks. Do not reconnect a system until access, persistence, and exposed credentials have been checked.</span></div>}
          {stage>=3&&evidenceQuality<0&&<div className="ir-consequence"><strong>EVIDENCE GAP</strong><span>Some response choices may have affected evidence. Record what is missing and avoid claiming facts that cannot be verified.</span></div>}
          {difficulty==="rookie"&&<div className="ir-learning-note"><strong>QUICK LEARN</strong><span>{currentContext}</span></div>}
          <div className="mission2-evidence">{evidence.map((item,index)=><div className="mission2-evidence-row" key={item.label+"-"+index}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
          {difficulty!=="rookie"&&<p className="challenge-context">{currentContext}</p>}
          <div className="challenge-card">
            <div className="challenge-number">RESPONSE DECISION {stage+1} / 5</div><h3>{current.question}</h3>
            <p className="challenge-context">{difficulty==="rookie"?"Read the clues, choose the action that best protects the organization, then confirm it.":"Choose the action you would authorize as the response lead. Use the evidence, not guesses."}</p>
            <div className="choice-list">{current.options.map((option,index)=>{
              const selected=pendingAnswers[stage]===index;const recorded=answers[stage]===index;const insufficient=difficulty==="commander"&&(option.cost??0)>resources;
              return <button type="button" key={option.label} disabled={answers[stage]!==undefined||!running||insufficient} className={"choice-button "+(recorded?(option.correct?"choice-correct":"choice-wrong"):selected?"choice-selected":"")+(answers[stage]!==undefined&&option.correct?" choice-reveal":"")} onClick={()=>choose(index)}><span className="choice-letter">{String.fromCharCode(65+index)}</span><span>{option.label}{difficulty==="commander"&&(option.cost??0)>0?<small className="ir-cost"> · {option.cost} RESOURCE</small>:null}</span>{recorded&&<b>{option.correct?"✓":"×"}</b>}{answers[stage]===undefined&&selected&&<b>SELECTED</b>}</button>;
            })}</div>
            {answers[stage]===undefined&&<div className="mission4-confirm-row"><span>{pendingAnswers[stage]===undefined?"Select a response, then confirm it.":"Review your choice. You can still change it before confirming."}</span><button type="button" className="primary-button" disabled={pendingAnswers[stage]===undefined||!running||(difficulty==="commander"&&(current.options[pendingAnswers[stage]]?.cost??0)>resources)} onClick={confirmChoice}>CONFIRM RESPONSE ↗</button></div>}
            {answers[stage]!==undefined&&<div className={"feedback-box "+(current.options[answers[stage]].correct?"":"feedback-review")}><strong>{current.options[answers[stage]].correct?"RESPONSE REVIEW — STRONG DECISION":"RESPONSE REVIEW — RISK IDENTIFIED"}</strong><p>{current.options[answers[stage]].feedback}</p><small>{current.explanation}</small></div>}
          </div>
          <div className="mission2-stage-controls"><button className="secondary-button" disabled={stage===0} onClick={()=>{setStage(value=>Math.max(0,value-1));setHintOpen(false);}}>← PREVIOUS STAGE</button><button className="primary-button" disabled={answers[stage]===undefined||stage===4||!running} onClick={()=>{setStage(value=>Math.min(4,value+1));setHintOpen(false);}}>NEXT RESPONSE STAGE ↗</button></div>
          <div className="hint-box"><button className="hint-toggle" disabled={!running||answers[stage]!==undefined||hintsUsed>=roleHints[difficulty]} onClick={useHint}>{hintOpen?"HIDE":"REQUEST"} RESPONSE LEAD HINT · COST 3 POINTS</button>{hintOpen&&<p>{current.hint}</p>}<small className="runtime-hint-limit">{roleHints[difficulty]} hints maximum for this role</small></div>
        </section>
        <aside className="mission4-sidebar">
          <InvestigationHeatmap nodes={nodes} selectedId={selectedNode} onSelect={setSelectedNode}/>
          <section className="runtime-response-note"><span className="runtime-kicker">INCIDENT COMMANDER REMINDER</span><p>Heatmap colors show which parts of the incident your decisions address. A hot clue is not proof by itself. Validate evidence before declaring a system safe.</p></section>
          <section className="ir-principles"><span className="runtime-kicker">RESPONSE CHECKLIST</span>{["Assess what is affected","Contain the threat","Remove attacker access","Restore safely","Record lessons learned"].map((item,index)=><div key={item} className={answers[index]!==undefined?"ir-check-done":""}><i>{answers[index]!==undefined?"✓":String(index+1).padStart(2,"0")}</i>{item}</div>)}</section>
        </aside>
      </div>
      {completed===5&&<section className="report-panel ir-report-panel"><div className="panel-kicker">FINAL TASK / INCIDENT REPORT</div><h2>BRIEF THE ORGANIZATION</h2><p>Write at least 100 characters. Explain what happened, which actions you took, what is still uncertain, and two improvements the organization should make. Your report is added to the decision record.</p><textarea value={report} onChange={event=>setReport(event.target.value)} rows={7} placeholder="Incident summary: The attack began when... We contained it by... The evidence confirms... We still need to verify... To reduce future risk, the organization should..."/><div className="ir-report-meta"><span>{report.trim().length} / 100 MINIMUM CHARACTERS</span><span>YOUR DECISIONS WILL APPEAR IN THE FINAL REPORT</span></div><button className="primary-button" disabled={!canSubmit||!running} onClick={()=>{setSubmitted(true);setRunning(false);}}>SUBMIT FINAL INCIDENT REPORT ↗</button><small>Submit before the clock expires. The final report includes your decisions, response metrics, and written assessment.</small></section>}
      <footer className="game-footer"><span>BREACH / FICTIONAL TRAINING ENVIRONMENT</span><span>NO LIVE NETWORKS · NO EXTERNAL TARGETS · SIMULATED EVIDENCE ONLY</span></footer>
    </main>
  );
}
