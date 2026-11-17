"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { InvestigationHeatmap, type HeatNode } from "@/components/breach/MissionRuntime";
import { MISSION_RUNTIME_CONFIG } from "@/lib/breach/mission-runtime";

type Choice = { label: string; correct: boolean; feedback: string };
type Stage = {
  title: string; subtitle: string; briefing: string; evidence: { label: string; value: string }[];
  question: string; context: string; choices: Choice[]; explanation: string; hint: string;
};
type Scenario = {
  id: "rookie" | "analyst" | "commander"; role: string; title: string; time: string;
  description: string; technical: string; intro: string; stages: Stage[];
};
type Save = { scenario: Scenario["id"]; stage: number; answers: Record<number, number>; report: string; hintOpen: boolean };

const scenarios: Scenario[] = [
  {
    id: "rookie", role: "ROOKIE INVESTIGATOR", title: "The Fake Front Door", time: "20–30 MIN",
    description: "A customer reports being redirected to a suspicious RooBank login page. Follow the clues and decide which website is really the bank.",
    technical: "URLs · domains · HTTPS · certificate basics",
    intro: "RooBank customers are receiving messages about a required account review. One customer says the login page looked exactly like the real bank. Your first job is to identify the suspicious destination before anyone enters credentials.",
    stages: [
      { title: "The Suspicious Link", subtitle: "Start with the message", briefing: "A RooBank customer forwards this fictional message to the security team. The message claims the customer's account will be paused unless they sign in today.", evidence: [
        {label:"FROM",value:"RooBank Account Team <alerts@roobank-notices.example>"},
        {label:"SUBJECT",value:"Action required: confirm your account"},
        {label:"BUTTON DESTINATION",value:"https://roobank-secure-login.example/verify"},
        {label:"KNOWN BANK ADDRESS",value:"https://www.roobank.example"}
      ], question:"What is the strongest reason to pause before opening the link?", context:"The display name and branding can be copied. Focus on the actual destination.", choices:[
        {label:"The message uses a button instead of a plain-text link",correct:false,feedback:"Buttons are common in legitimate messages too. The destination matters more than how the link is displayed."},
        {label:"The destination domain is different from RooBank's known domain",correct:true,feedback:"Correct. The link leads to roobank-secure-login.example, not roobank.example. Similar wording does not make it the same domain."},
        {label:"The message says the account needs attention",correct:false,feedback:"Urgency is a warning sign, but the domain mismatch is the strongest technical clue here."}
      ], explanation:"Look at the website address carefully. A fake site can use words that look familiar, but that does not make it the bank's real website.", hint:"Compare the two complete hostnames. Which registered domain is different?" },
      { title:"Two Websites, One Bank", subtitle:"Compare the identities", briefing:"The help desk captured the addresses shown in two browser sessions. Both pages use RooBank colors and logos. Branding is not proof of identity.", evidence:[
        {label:"PAGE A",value:"https://www.roobank.example/login"},
        {label:"PAGE B",value:"https://www.roobank-login.example/login"},
        {label:"PAGE A HOST",value:"www.roobank.example"},
        {label:"PAGE B HOST",value:"www.roobank-login.example"}
      ], question:"Which page uses RooBank's known domain?", context:"A subdomain is the part before the main website name. For this check, compare the main website name.", choices:[
        {label:"Page A — roobank.example",correct:true,feedback:"Correct. The host www.roobank.example is under the known roobank.example domain."},
        {label:"Page B — roobank-login.example",correct:false,feedback:"This is a separate registered domain. Adding '-login' does not make it part of roobank.example."},
        {label:"Both pages, because both contain the word RooBank",correct:false,feedback:"Words in a hostname do not establish ownership. Compare the registered domains."}
      ], explanation:"In www.roobank.example, the registered domain is roobank.example. In www.roobank-login.example, the registered domain is roobank-login.example. Those are different domains.", hint:"Find the main website name just before .example. Compare the full name on both pages." },
      { title:"The Digital ID", subtitle:"Read a simplified certificate", briefing:"The browser displays a certificate summary for the suspicious page. A digital certificate helps prove that a website controls a certain web address. It does not prove that the business is honest or safe.", evidence:[
        {label:"CERTIFICATE SUBJECT",value:"roobank-login.example"},
        {label:"SUBJECT ALT NAME (SAN)",value:"DNS:roobank-login.example"},
        {label:"ISSUER",value:"Example Public CA"},
        {label:"VALIDITY",value:"2026-01-01 through 2027-01-01"},
        {label:"BROWSER RESULT",value:"Certificate name matches the site"}
      ], question:"The certificate matches roobank-login.example and is within its validity dates. What does that establish?", context:"For this activity, assume the browser has checked the certificate signatures and the full certificate chain.", choices:[
        {label:"The site is definitely operated by RooBank",correct:false,feedback:"A certificate for a look-alike domain does not prove that the site belongs to the real bank."},
        {label:"The connection can authenticate that domain, but not prove the business is legitimate",correct:true,feedback:"Correct. The certificate helps show that the site controls that web address. It does not prove that the site belongs to the real RooBank."},
        {label:"The website is safe because it uses encryption",correct:false,feedback:"Encryption protects data in transit to that site. It does not make a malicious destination trustworthy."}
      ], explanation:"HTTPS and a valid certificate help protect information sent to a website. But a scammer can also get a valid certificate for a fake website they own.", hint:"Separate two questions: is the connection encrypted, and is this actually the bank's domain?" },
      { title:"Can We Trust It?", subtitle:"Understand HTTPS", briefing:"A customer says, 'The padlock was there, so I thought it was safe.' The security team needs a clear explanation.", evidence:[
        {label:"CONNECTION",value:"HTTPS enabled"},
        {label:"CERTIFICATE",value:"Valid for roobank-login.example"},
        {label:"EXPECTED DOMAIN",value:"roobank.example"},
        {label:"BROWSER WARNING",value:"No certificate warning displayed"}
      ], question:"Which statement best explains the padlock / HTTPS indicator?", context:"The site is a look-alike domain with a valid certificate for that look-alike domain.", choices:[
        {label:"HTTPS means the website has been approved by the bank",correct:false,feedback:"Certificate authorities do not approve a site's business practices or affiliation with a brand."},
        {label:"HTTPS encrypts the connection to the named site; users must still verify the domain",correct:true,feedback:"Correct. Encryption and hostname authentication do not replace checking that you reached the intended organization."},
        {label:"HTTPS prevents phishing websites from collecting information",correct:false,feedback:"A phishing site can use HTTPS. Attackers can obtain certificates for domains they control."}
      ], explanation:"Teach students not to treat the padlock as a safety rating. Check the exact domain and use a trusted bookmark or known official address.", hint:"What does TLS protect: the connection, or the honesty of the organization at the other end?" },
      { title:"The Verdict", subtitle:"Make the first response decision", briefing:"You have enough evidence to advise the help desk. The customer has not yet confirmed whether credentials were entered.", evidence:[
        {label:"SUSPICIOUS DOMAIN",value:"roobank-secure-login.example"},
        {label:"KNOWN DOMAIN",value:"roobank.example"},
        {label:"CERTIFICATE",value:"Valid for the suspicious domain"},
        {label:"CUSTOMER STATUS",value:"Credential entry not yet confirmed"}
      ], question:"What is the best immediate recommendation?", context:"Choose a response that protects the customer and preserves useful information.", choices:[
        {label:"Tell the customer to use the suspicious page because its certificate is valid",correct:false,feedback:"A valid certificate for the wrong domain does not make the destination legitimate."},
        {label:"Do not use the link; navigate using a saved official bookmark and report the message",correct:true,feedback:"Correct. Use a known trusted route, report the message, and determine whether credentials were submitted."},
        {label:"Reply to the sender and ask whether the page is real",correct:false,feedback:"The sender may be controlled by the attacker. Verify through a separate trusted channel."}
      ], explanation:"The safe path is independent verification, reporting, and checking whether credentials were entered. If credentials were submitted, the response should include account-protection steps through the bank's official channel.", hint:"Do not let the suspicious message supply the only way to verify itself." }
    ]
  },
  {
    id: "analyst", role: "SECURITY ANALYST", title: "The Stolen Identity", time: "35–50 MIN",
    description: "A suspicious server presents a certificate that appears legitimate. Inspect the certificate fields and reconstruct the chain of trust.",
    technical: "X.509 · SAN · issuers · root and intermediate CAs · signatures · revocation",
    intro: "RooBank's IT team has found a second login endpoint. Its certificate looks professional and was issued by a familiar certificate authority. Your job is to determine what the certificate actually proves and whether the chain can be trusted.",
    stages: [
      {title:"The Unexpected Certificate",subtitle:"Inspect the certificate record",briefing:"The help desk exports a certificate summary from the suspicious endpoint. Do not rely on the display name; inspect the fields.",evidence:[
        {label:"COMMON NAME (CN)",value:"login.roobank.example"},
        {label:"SUBJECT ALT NAME",value:"DNS:login.roobank.example"},
        {label:"ISSUER",value:"Northstar Intermediate CA 02"},
        {label:"SERIAL",value:"4A:91:0C:77"},
        {label:"VALIDITY",value:"2026-09-01 to 2027-09-01"}
      ],question:"Which field should be checked to determine whether the certificate covers the hostname being visited?",context:"Modern TLS hostname verification relies on Subject Alternative Name (SAN), not just the legacy Common Name.",choices:[
        {label:"The certificate serial number",correct:false,feedback:"The serial number is an ID for the certificate. It does not tell you which website names the certificate covers."},
        {label:"The Subject Alternative Name (SAN)",correct:true,feedback:"Correct. SAN lists the DNS names or other identities for which the certificate is valid."},
        {label:"The issuer's display name",correct:false,feedback:"The issuer tells you which Certificate Authority (CA) signed the certificate. It does not tell you which website names are covered."}
      ],explanation:"When a browser checks a website certificate, it looks at the Subject Alternative Name (SAN) to see which website names are covered. Do not rely only on the older Common Name (CN) field.",hint:"Which certificate extension lists the DNS names the certificate covers?"},
      {title:"Who Issued It?",subtitle:"Identify the issuer and its role",briefing:"The certificate was signed by Northstar Intermediate CA 02. The team has supplied a simplified issuer record.",evidence:[
        {label:"SERVER CERTIFICATE",value:"login.roobank.example"},
        {label:"ISSUER",value:"Northstar Intermediate CA 02"},
        {label:"INTERMEDIATE ISSUER",value:"Northstar Root CA"},
        {label:"ROOT STORE",value:"Northstar Root CA is trusted by the test workstation"}
      ],question:"What role does the intermediate CA play?",context:"The server certificate is not normally signed directly by a root CA in a typical public PKI hierarchy.",choices:[
        {label:"It encrypts all customer passwords before they reach the server",correct:false,feedback:"The CA's role is certificate issuance and signing, not application-level password encryption."},
        {label:"It issues or signs end-entity certificates and chains trust toward a trusted root",correct:true,feedback:"Correct. The intermediate CA links the server certificate to a root CA trusted by the client."},
        {label:"It guarantees that RooBank owns the domain and operates ethically",correct:false,feedback:"A CA validates domain control or identity according to its certificate policy. It does not guarantee ethical business conduct."}
      ],explanation:"A certificate chain usually goes from the website's certificate, to an intermediate Certificate Authority, and then to a trusted root Certificate Authority. The browser checks the signatures, website name, and dates along the way.",hint:"Think of the intermediate as the link between the server certificate and the trusted root."},
      {title:"Follow the Trust Chain",subtitle:"Build the chain in the right order",briefing:"The certificate viewer lists three certificates. The analyst needs to verify the relationship, not just recognize a familiar name.",evidence:[
        {label:"LEAF / SERVER",value:"login.roobank.example"},
        {label:"INTERMEDIATE",value:"Northstar Intermediate CA 02"},
        {label:"ROOT",value:"Northstar Root CA"},
        {label:"CLIENT TRUST STORE",value:"Northstar Root CA present"}
      ],question:"Which sequence correctly follows the certificate path from the website toward the trust anchor?",context:"The browser checks the website's certificate first, follows the issuing certificates, and ends at a root certificate it already trusts.",choices:[
        {label:"Root → Intermediate → Server",correct:false,feedback:"That is the opposite direction from the server certificate toward its trust anchor."},
        {label:"Server / Leaf → Intermediate → Root",correct:true,feedback:"Correct. The leaf certificate is signed by the intermediate, which chains to the root trust anchor."},
        {label:"Server → Root → Intermediate",correct:false,feedback:"The intermediate certificate sits between the server certificate and the root."}
      ],explanation:"The trusted root certificate is the starting point for trust. The browser must also check the signatures, dates, allowed uses, and website name.",hint:"Start with the certificate presented by the website. Follow its issuer upward."},
      {title:"The Technical Inspection",subtitle:"Check the details that can invalidate trust",briefing:"A second export contains validation findings. One certificate in the chain has a problem that a familiar issuer name cannot fix.",evidence:[
        {label:"LEAF SAN",value:"DNS:login.roobank.example"},
        {label:"LEAF VALIDITY",value:"Current"},
        {label:"CHAIN SIGNATURES",value:"Valid"},
        {label:"INTERMEDIATE STATUS",value:"Revoked — serial 88:2C:10:AB listed by issuer"},
        {label:"CLIENT RESULT",value:"Revocation status confirmed"}
      ],question:"What should the analyst conclude when the issuing intermediate is confirmed revoked?",context:"For this controlled exercise, assume the client successfully obtains authoritative revocation information and policy requires rejecting this chain.",choices:[
        {label:"Accept it because the hostname and dates match",correct:false,feedback:"Hostname and validity checks do not override a confirmed revocation under the stated policy."},
        {label:"Reject the chain and escalate the certificate / CA issue",correct:true,feedback:"Correct. A revoked certificate in the chain is a trust failure in this scenario."},
        {label:"Ignore revocation because the root CA is in the trust store",correct:false,feedback:"A trusted root does not make every certificate issued beneath it trustworthy forever."}
      ],explanation:"A browser checks several things before trusting a certificate: the website name, dates, signatures, allowed uses, and whether the certificate has been revoked. For this activity, the revocation check has already confirmed a problem.",hint:"A valid signature proves who signed a certificate; it does not prove the certificate has not been revoked."},
      {title:"The Verdict",subtitle:"Write the technical determination",briefing:"The incident lead needs a concise determination before the suspicious endpoint is removed from service.",evidence:[
        {label:"HOSTNAME",value:"SAN matches login.roobank.example"},
        {label:"ISSUER",value:"Northstar Intermediate CA 02"},
        {label:"CHAIN",value:"Server → Intermediate → Root"},
        {label:"REVOCATION",value:"Intermediate confirmed revoked"}
      ],question:"What is the defensible trust decision?",context:"Use all the evidence, not just the hostname or issuer name.",choices:[
        {label:"Trust the endpoint because the certificate name matches",correct:false,feedback:"The website name matching is not enough. One of the certificates in the chain has been revoked, so the browser should not trust this connection."},
        {label:"Do not trust the chain; preserve the records and escalate to PKI / incident response",correct:true,feedback:"Correct. Record what failed, save the certificate details, and report the problem to the team responsible for certificates and security."},
        {label:"Trust it because the root CA is installed",correct:false,feedback:"The root is a trust anchor, but revocation and other path checks still apply."}
      ],explanation:"Your report should distinguish the field that matched (SAN) from the validation failure (revoked intermediate). Accurate analysis explains both.",hint:"State the positive checks and the failed check. One does not cancel the other."}
    ]
  },
  {
    id: "commander",role:"INCIDENT COMMANDER",title:"The Broken Chain",time:"50–70 MIN",
    description:"Customers are reaching an attacker-controlled service through a connection that appears valid. Correlate DNS, TLS, CA, and incident records, then make response decisions.",
    technical:"DNS · TLS identity · CA compromise / misissuance · revocation · incident response",
    intro:"RooBank's monitoring team has identified a suspected impersonation incident. The attacker-controlled endpoint presents a certificate that passes routine browser checks. You must separate what is known from what is assumed, determine the trust failure, and prioritize the response.",
    stages:[
      {title:"The Trusted Connection",subtitle:"Question a successful TLS session",briefing:"A customer used a saved RooBank bookmark. The browser showed HTTPS and no certificate warning. The customer still reached an unexpected page.",evidence:[
        {label:"BOOKMARK URL",value:"https://secure.roobank.example"},
        {label:"DNS ANSWER",value:"203.0.113.77"},
        {label:"EXPECTED SERVICE IP",value:"203.0.113.20"},
        {label:"TLS",value:"TLS 1.3 negotiated; certificate hostname matched"},
        {label:"CUSTOMER REPORT",value:"Unexpected account recovery page"}
      ],question:"What is the strongest conclusion at this point?",context:"The address resolved to an unexpected IP, but the TLS handshake and hostname check succeeded. More evidence is needed to identify why.",choices:[
        {label:"The site is safe because TLS succeeded",correct:false,feedback:"TLS success means the connection passed the checks performed by the client. It does not prove the DNS answer or service is benign."},
        {label:"The DNS result is anomalous and needs investigation; TLS success alone does not resolve the concern",correct:true,feedback:"Correct. Preserve the DNS and TLS observations and investigate the unexpected address and certificate issuance."},
        {label:"The certificate must be fake because the IP is unexpected",correct:false,feedback:"An unexpected IP does not by itself prove a certificate is fake. Hosting, CDN, routing, or DNS changes can affect addresses; correlate evidence."}
      ],explanation:"Avoid jumping from one indicator to a conclusion. A valid TLS session authenticates the hostname according to the certificate path the client accepted; it does not validate every aspect of DNS routing or application behavior.",hint:"Separate DNS resolution from TLS certificate validation. What did each system actually tell you?"},
      {title:"Conflicting Evidence",subtitle:"Correlate DNS and certificate records",briefing:"The network team provides a change record and a certificate transparency observation. No approved migration is listed.",evidence:[
        {label:"DNS CHANGE LOG",value:"secure.roobank.example → 203.0.113.77 at 09:14"},
        {label:"CHANGE TICKET",value:"No approved DNS change found"},
        {label:"CERTIFICATE TRANSPARENCY",value:"New certificate logged for secure.roobank.example at 09:02"},
        {label:"EXPECTED IP",value:"203.0.113.20"},
        {label:"NEW IP OWNER",value:"Unrecognized hosting provider"}
      ],question:"Which combination most strongly supports an active impersonation investigation?",context:"No single record proves the entire attack. Evaluate the correlation and the missing authorization.",choices:[
        {label:"The DNS change, newly observed certificate, and absence of an approved change together",correct:true,feedback:"Correct. The correlated timing and lack of an approved change justify urgent investigation while the team verifies ownership and issuance."},
        {label:"The new IP address by itself",correct:false,feedback:"IP changes can be legitimate. The absence of authorization and correlated certificate event make this more concerning."},
        {label:"The certificate transparency entry by itself",correct:false,feedback:"Certificate transparency logs public certificate issuance; a logged certificate is not inherently malicious."}
      ],explanation:"Certificate Transparency helps detect unexpected issuance, but it is not a certificate approval mechanism. Correlate issuance, DNS, change management, hosting, and service ownership.",hint:"Look for multiple independent records that align in time, plus the missing authorized change."},
      {title:"The Compromised Trust",subtitle:"Investigate a misissued certificate",briefing:"The CA incident desk confirms that an intermediate issuing system was compromised. A certificate for secure.roobank.example was issued without RooBank's authorization.",evidence:[
        {label:"CA INCIDENT",value:"Northstar Intermediate CA 02 signing key suspected compromised"},
        {label:"ISSUED CERTIFICATE",value:"secure.roobank.example — serial 77:20:19"},
        {label:"ROOBANK AUTHORIZATION",value:"No domain validation request approved by RooBank"},
        {label:"CA RESPONSE",value:"Certificate revoked; intermediate disabled pending investigation"},
        {label:"CLIENT POLICY",value:"Revocation status available and enforced in managed environment"}
      ],question:"What does the unauthorized certificate issuance indicate?",context:"The certificate was genuinely signed by a CA key, but the CA's issuance process was compromised.",choices:[
        {label:"The certificate is trustworthy because its signature is mathematically valid",correct:false,feedback:"A valid signature shows it was signed by the corresponding CA key. It does not prove the CA issued it appropriately or that the key was not compromised."},
        {label:"The CA's signing authority was abused, so the certificate must be treated as untrusted and investigated",correct:true,feedback:"Correct. A compromised or misused CA can issue a technically well-formed certificate that undermines trust."},
        {label:"The root trust store automatically detects every unauthorized certificate",correct:false,feedback:"Trust stores do not independently know whether every issuance was authorized. Detection and response require CA controls, transparency, revocation, and monitoring."}
      ],explanation:"PKI depends on both cryptography and trustworthy issuance operations. If an authorized signing key is compromised, attackers may obtain certificates that appear cryptographically valid until the issue is detected and mitigated.",hint:"A signature can be mathematically valid even when the issuance was unauthorized. What was compromised: the math or the authority?"},
      {title:"Reconstruct the Attack",subtitle:"Build a defensible sequence",briefing:"You must present a timeline to the response team. The evidence is incomplete, so distinguish confirmed events from the likely attacker path.",evidence:[
        {label:"09:02",value:"Unauthorized certificate appears in CT log"},
        {label:"09:14",value:"DNS answer changes to unrecognized host"},
        {label:"09:18",value:"First customer report of unexpected recovery page"},
        {label:"10:05",value:"CA confirms intermediate signing-key compromise"},
        {label:"10:22",value:"Certificate revoked; intermediate disabled"}
      ],question:"Which sequence best fits the confirmed evidence?",context:"The evidence supports a likely chain, but do not claim that a log timestamp proves the exact moment an attacker gained access.",choices:[
        {label:"Unauthorized certificate issued / logged → DNS redirected → customer reached unexpected service → CA compromise confirmed and certificate revoked",correct:true,feedback:"Correct. This sequence aligns with the records while keeping the exact initial compromise time appropriately uncertain."},
        {label:"Customer report → DNS change → certificate issued → CA compromise",correct:false,feedback:"The timestamps show the certificate transparency entry and DNS change occurred before the first customer report."},
        {label:"CA compromise confirmed → customer report → certificate issued → DNS change",correct:false,feedback:"The CA confirmation came later as an investigation finding, not necessarily at the time the compromise began."}
      ],explanation:"Incident timelines should separate event time from discovery time. A later confirmation may describe an earlier compromise. Preserve timestamps and note uncertainty.",hint:"Use the event timestamps. The time a team discovers a compromise is not necessarily when it began."},
      {title:"Command Decision",subtitle:"Contain, restore trust, communicate",briefing:"The executive team asks for immediate priorities. Customers may have submitted credentials to the attacker-controlled service.",evidence:[
        {label:"CONFIRMED",value:"Unauthorized certificate issued; CA intermediate compromised"},
        {label:"POTENTIAL IMPACT",value:"Customers may have entered credentials"},
        {label:"CONTAINMENT",value:"Malicious DNS response and certificate path require remediation"},
        {label:"RECOVERY",value:"CA and RooBank must coordinate trusted reissuance and validation"},
        {label:"EVIDENCE",value:"DNS, TLS, certificate, CA, and customer reports must be preserved"}
      ],question:"Which response plan is the strongest?",context:"Choose a coordinated plan that addresses the technical trust failure and possible customer impact.",choices:[
        {label:"Delete the suspicious server and announce that the issue is fixed",correct:false,feedback:"That is incomplete. It omits CA remediation, DNS validation, evidence preservation, and possible credential exposure."},
        {label:"Coordinate containment with DNS and CA teams, preserve evidence, invalidate affected trust, restore through verified infrastructure, and assess customer credentials",correct:true,feedback:"Correct. This plan addresses the trust chain, infrastructure, evidence, and potential customer impact. Communications should be accurate and coordinated."},
        {label:"Ask customers to ignore the warning and continue using the service while the team investigates",correct:false,feedback:"Customers should not be directed to continue using a suspected compromised endpoint."}
      ],explanation:"A commander coordinates technical containment, CA remediation, DNS integrity, evidence preservation, customer impact assessment, trusted recovery, and communications. Avoid claiming every customer's credentials were stolen unless evidence supports it.",hint:"Your response needs more than server removal: include the CA, DNS, evidence, customers, and verified recovery."}
    ]
  }
];

export default function MissionTwoClient() {
  const [scenarioId,setScenarioId]=useState<Scenario["id"]|null>(null);
  const [stage,setStage]=useState(0);
  const [answers,setAnswers]=useState<Record<number,number>>({});
  const [report,setReport]=useState("");
  const [hintOpen,setHintOpen]=useState(false);
  const [restored,setRestored]=useState(false);
  const [loaded,setLoaded]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [studentName,setStudentName]=useState("");
  const [certificate,setCertificate]=useState(false);
  const [selectedHeatNode,setSelectedHeatNode]=useState("hostname");

  useEffect(()=>{try{const raw=localStorage.getItem("breach:mission-2:v1");if(raw){const saved=JSON.parse(raw) as Save & {submitted?:boolean;studentName?:string;certificate?:boolean};if(scenarios.some(s=>s.id===saved.scenario)){setScenarioId(saved.scenario);setStage(Math.max(0,Math.min(4,saved.stage||0)));setAnswers(saved.answers||{});setReport(saved.report||"");setHintOpen(false);setRestored(true);setSubmitted(saved.submitted===true);setStudentName(saved.studentName||"");setCertificate(saved.certificate===true);}}}catch{}finally{setLoaded(true);}},[]);
  useEffect(()=>{if(!loaded)return;try{if(!scenarioId){localStorage.removeItem("breach:mission-2:v1");return;}localStorage.setItem("breach:mission-2:v1",JSON.stringify({scenario:scenarioId,stage,answers,report,hintOpen:false,submitted,studentName,certificate}));}catch{}},[loaded,scenarioId,stage,answers,report,submitted,studentName,certificate]);

  const scenario=scenarios.find(s=>s.id===scenarioId);
  const current=scenario?.stages[stage];
  const selected=answers[stage];
  const score=useMemo(()=>scenario?Object.entries(answers).filter(([key,value])=>scenario.stages[Number(key)]?.choices[value]?.correct).length:0,[scenario,answers]);
  const completed=Object.keys(answers).filter(key=>scenario?.stages[Number(key)]).length;
  const heatNodes: HeatNode[] = MISSION_RUNTIME_CONFIG["mission-2"].targets.map((target,index) => {
    const relatedStages = [[0],[1],[2],[3,4]][index];
    const correct = relatedStages.filter((stageIndex) => scenario?.stages[stageIndex]?.choices[answers[stageIndex]]?.correct).length;
    const incorrect = relatedStages.filter((stageIndex) => answers[stageIndex] !== undefined && !scenario?.stages[stageIndex]?.choices[answers[stageIndex]]?.correct).length;
    return { ...target, proximity: Math.max(0, Math.min(100, 12 + correct * 43 - incorrect * 8)) };
  });
  const allComplete=completed===5;
  const minimum= scenarioId==="rookie"?35:scenarioId==="analyst"?65:100;

  function start(id:Scenario["id"]){setScenarioId(id);setStage(0);setAnswers({});setReport("");setHintOpen(false);setSubmitted(false);setRestored(false);setStudentName("");setCertificate(false);}
  function reset(){if(confirm("Start this Mission 2 investigation over? Your saved answers and report on this browser will be erased.")){localStorage.removeItem("breach:mission-2:v1");setScenarioId(null);setStage(0);setAnswers({});setReport("");setSubmitted(false);setRestored(false);setStudentName("");setCertificate(false);}}
  function answer(index:number){if(selected===undefined)setAnswers(old=>({...old,[stage]:index}));}
  function submitReport(){if(report.trim().length>=minimum)setSubmitted(true);}

  if(!loaded)return <main className="game-shell"><div className="eyebrow">LOADING INVESTIGATION…</div></main>;

  if(!scenarioId||!scenario){
    return <main className="game-shell">
      <nav className="game-nav"><Link className="brand" href="/"><span className="brand-mark">B</span><span>BREACH<span className="brand-period">.</span></span></Link><span className="topbar-status"><i/> TRAINING ENVIRONMENT</span></nav>
      <div className="game-heading"><Link href="/" className="back-link">← BACK TO CASE FILES</Link><div className="eyebrow">MISSION 02 / DIGITAL IDENTITY &amp; TRUST</div><h1 className="game-title">THE <em>IMPOSTOR</em><span className="accent">.</span></h1><p className="game-lead">A connection can be encrypted and still lead to the wrong place. Investigate digital identities, certificates, and the systems that establish trust.</p></div>
      <section className="scenario-panel"><div className="panel-kicker">INCIDENT BRIEF / 0417-B</div><h2>OPERATION ROOBANK</h2><p>After the initial infiltration, the investigation turns to RooBank. Customers report suspicious login pages, certificates appear in unexpected places, and the security team must determine which identities and connections can be trusted.</p><div className="scenario-meta"><span>FICTIONAL ROOBANK ENVIRONMENT</span><span>15 TOTAL STAGES</span><span>SELECT YOUR INVESTIGATION</span></div></section>
      <div className="level-heading"><div><div className="eyebrow">THREE DISTINCT CASE FILES</div><h2>SELECT YOUR SCENARIO<span className="accent">.</span></h2></div><p>Each scenario has five stages. The evidence and technical reasoning become more complex as you move from identifying an impostor to commanding a PKI incident response.</p></div>
      <div className="mission2-scenario-grid">{scenarios.map((item,index)=><button key={item.id} className="mission2-scenario-card" onClick={()=>start(item.id)}><div className="level-top"><span>SCENARIO 0{index+1}</span><span className={index===0?"m2-rookie":index===1?"m2-analyst":"m2-commander"}>{item.role}</span></div><h3>{item.title}</h3><p>{item.description}</p><div className="m2-technical"><strong>TECHNICAL FOCUS</strong>{item.technical}</div><div className="level-footer"><span>5 STAGES · {item.time}</span><b>↗</b></div></button>)}</div>
      <p className="game-footnote">Choose one scenario. You do not need to complete the previous scenario first. Your progress is saved in this browser.</p>
      <footer className="game-footer"><span>BREACH / FICTIONAL TRAINING ENVIRONMENT</span><span>NO LIVE CERTIFICATES · NO EXTERNAL SYSTEMS</span></footer>
    </main>;
  }

  if(submitted){
    return <main className="game-shell completion-shell">
      <nav className="game-nav no-print"><Link className="brand" href="/"><span className="brand-mark">B</span><span>BREACH<span className="brand-period">.</span></span></Link><span className="topbar-status"><i/> CASE REVIEW</span></nav>
      <section className="completion-panel no-print"><div className="completion-mark">✓</div><div className="eyebrow">MISSION 02 / REPORT RECEIVED</div><h1 className="game-title">IDENTITY <em>INVESTIGATED</em><span className="accent">.</span></h1><p className="game-lead">You completed {scenario.title}. Your findings are saved on this browser.</p><div className="autosave-strip"><span>✓ COMPLETION SAVED ON THIS DEVICE</span></div><div className="completion-stats"><div><strong>{score}/5</strong><span>ACCURATE DECISIONS</span></div><div><strong>5/5</strong><span>STAGES COMPLETED</span></div><div><strong>{scenario.role.split(" ")[0]}</strong><span>INVESTIGATION PATH</span></div></div><div className="report-review"><div className="panel-kicker">YOUR INCIDENT DETERMINATION</div><p>{report}</p></div>
      {!certificate?<section className="certificate-entry"><div className="panel-kicker">FINAL STEP / COMPLETION CERTIFICATE</div><h2>WHO COMPLETED THIS MISSION?</h2><p>Enter your name to generate a printable completion certificate.</p><label htmlFor="m2-student-name">STUDENT NAME</label><input id="m2-student-name" value={studentName} onChange={e=>setStudentName(e.target.value)} maxLength={70} placeholder="Enter first and last name"/><button className="primary-button" disabled={!studentName.trim()} onClick={()=>setCertificate(true)}>GENERATE CERTIFICATE ↗</button></section>:<div className="certificate-actions"><p><strong>Certificate ready.</strong> Print or save it as a PDF.</p><button className="primary-button" onClick={()=>window.print()}>PRINT / SAVE AS PDF ↗</button><button className="secondary-button" onClick={()=>setCertificate(false)}>EDIT STUDENT NAME</button></div>}
      <div className="completion-actions"><button className="secondary-button" onClick={()=>start(scenario.id)}>REPLAY SCENARIO ↻</button><button className="secondary-button" onClick={()=>{setScenarioId(null);setSubmitted(false);}}>CHOOSE ANOTHER SCENARIO</button><Link className="secondary-button" href="/">RETURN TO CASE FILES</Link></div></section>
      {certificate&&<section className="certificate-sheet" aria-label="BREACH certificate of completion"><div className="certificate-frame"><div className="certificate-brand">BREACH<span>.</span></div><div className="certificate-subtitle">CYBERSECURITY ESCAPE ROOM</div><div className="certificate-rule"/><div className="certificate-kicker">CERTIFICATE OF COMPLETION</div><p className="certificate-intro">This certifies that</p><h2 className="certificate-student">{studentName.trim()}</h2><p className="certificate-intro">has successfully completed</p><h3 className="certificate-mission">MISSION 02 — THE IMPOSTOR</h3><div className="certificate-status">MISSION COMPLETE</div><div className="certificate-details"><div><span>SCENARIO</span><strong>{scenario.title}</strong></div><div><span>ACCURATE DECISIONS</span><strong>{score}/5</strong></div><div><span>STAGES</span><strong>5 / 5</strong></div></div><div className="certificate-date">COMPLETION DATE: {new Date().toLocaleDateString()}</div><div className="certificate-footer">BREACH CYBERSECURITY TRAINING <span>·</span> FICTIONAL TRAINING ENVIRONMENT</div></div></section>}
    </main>;
  }

  return <main className="game-shell">
    <nav className="game-nav"><Link className="brand" href="/"><span className="brand-mark">B</span><span>BREACH<span className="brand-period">.</span></span></Link><div className="mission-nav-label">MISSION 02 <span>/</span> THE IMPOSTOR</div><span className="topbar-status"><i/> {scenario.role}</span></nav>
    <div className="play-header"><div><Link href="/mission-2" className="back-link">← CHANGE SCENARIO</Link><div className="eyebrow">OPERATION ROOBANK / CASE 0417-B</div><h1 className="play-title">{scenario.title.toUpperCase()} <em>DESK</em></h1></div><div className="play-meta"><strong>{scenario.time}</strong><span>ESTIMATED COMPLETION</span></div></div>
    {restored&&<div className="restore-notice">SAVED INVESTIGATION RESTORED — Your answers and report were recovered from this browser.</div>}
    <div className="autosave-strip"><span>✓ AUTO-SAVE ON THIS DEVICE</span><button onClick={reset}>START OVER ↻</button></div>
    <div className="progress-wrap"><div className="progress-label"><span>INVESTIGATION PROGRESS</span><strong>{completed} / 5 STAGES</strong></div><div className="progress-track"><div className="progress-fill" style={{width:(completed/5*100)+"%"}}/></div></div>
    <InvestigationHeatmap nodes={heatNodes} selectedId={selectedHeatNode} onSelect={setSelectedHeatNode} />
    <section className="scenario-panel"><div className="panel-kicker">CASE BRIEF / {scenario.role}</div><h2>{scenario.title}</h2><p>{scenario.intro}</p><div className="scenario-meta"><span>{scenario.technical.toUpperCase()}</span><span>STAGE {stage+1} OF 5</span><span>SIMULATED EVIDENCE</span></div></section>
    <div className="mission2-workspace">
      <aside className="branch-sidebar"><div className="panel-kicker">INVESTIGATION STAGES</div><p className="sidebar-intro">Complete each stage to build your final determination. You can revisit completed stages.</p>{scenario.stages.map((item,index)=><button key={item.title} className={"branch-button "+(stage===index?"branch-selected":"")+(answers[index]!==undefined?" branch-done":"")} onClick={()=>{setStage(index);setHintOpen(false);}}><span className="branch-icon">{String(index+1).padStart(2,"0")}</span><span className="branch-button-copy"><strong>{item.title}</strong><small>{item.subtitle}</small></span><span className="branch-check">{answers[index]!==undefined?"✓":"↗"}</span></button>)}<div className="hint-box"><button className="hint-toggle" onClick={()=>setHintOpen(v=>!v)}>{hintOpen?"HIDE":"SHOW"} INVESTIGATOR HINT</button>{hintOpen&&<p>{current?.hint}</p>}</div></aside>
      <section className="evidence-panel"><div className="evidence-heading"><div><div className="panel-kicker">EVIDENCE REVIEW / STAGE 0{stage+1}</div><h2>{current?.title}</h2><p>{current?.subtitle}</p></div><span className="evidence-count">{current?.evidence.length} RECORDS</span></div><div className="mission2-briefing">{current?.briefing}</div><div className="mission2-evidence">{current?.evidence.map((item)=><div className="mission2-evidence-row" key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
      <div className="challenge-card"><div className="challenge-number">DECISION {stage+1} / 5</div><h3>{current?.question}</h3><p className="challenge-context">{current?.context}</p><div className="choice-list">{current?.choices.map((choice,index)=><button key={choice.label} disabled={selected!==undefined} className={"choice-button "+(selected===index?(choice.correct?"choice-correct":"choice-wrong"):"")+(selected!==undefined&&choice.correct?" choice-reveal":"")} onClick={()=>answer(index)}><span className="choice-letter">{String.fromCharCode(65+index)}</span><span>{choice.label}</span>{selected===index&&<b>{choice.correct?"✓":"×"}</b>}</button>)}</div>{selected!==undefined&&<div className={"feedback-box "+(current?.choices[selected].correct?"":"feedback-review")}><strong>{current?.choices[selected].correct?"ANALYST NOTE — CORRECT":"ANALYST NOTE — REVIEW"}</strong><p>{current?.choices[selected].feedback}</p><small>{current?.explanation}</small></div>}</div>
      <div className="mission2-stage-controls"><button className="secondary-button" disabled={stage===0} onClick={()=>{setStage(s=>Math.max(0,s-1));setHintOpen(false);}}>← PREVIOUS STAGE</button>{stage<4?<button className="primary-button" disabled={selected===undefined} onClick={()=>{setStage(s=>Math.min(4,s+1));setHintOpen(false);}}>NEXT STAGE ↗</button>:<span className="mission2-last-note">{allComplete?"ALL STAGES COMPLETE":"Complete this final decision to unlock your report."}</span>}</div></section>
    </div>
    {allComplete?<section className="report-panel"><div className="panel-kicker">FINAL TASK / INCIDENT DETERMINATION</div><h2>WHAT DID THE EVIDENCE PROVE?</h2><p>{scenarioId==="rookie"?"Explain which site was the impostor, why the padlock did not prove it was the bank, and what the customer should do next.":scenarioId==="analyst"?"Explain the certificate path, identify the validation failure, and justify whether the server should be trusted.": "Reconstruct the likely attack, distinguish confirmed facts from assumptions, and prioritize containment, trust restoration, evidence preservation, and customer protection."}</p><textarea value={report} onChange={e=>setReport(e.target.value)} rows={6} placeholder={scenarioId==="commander"?"Incident determination: Confirmed evidence shows... The likely sequence was... Immediate response priorities are...":"My determination: The evidence shows... The certificate / domain issue is... I recommend..."}/><button className="primary-button" disabled={report.trim().length<minimum} onClick={submitReport}>SUBMIT INCIDENT DETERMINATION ↗</button><small>At least {minimum} characters required. Use specific evidence from your investigation.</small></section>:<div className="locked-report"><span>▣</span><div><strong>FINAL DETERMINATION LOCKED</strong><small>Complete all five stage decisions to unlock your report.</small></div></div>}
    <footer className="game-footer"><span>BREACH / FICTIONAL TRAINING ENVIRONMENT</span><span>NO LIVE CERTIFICATES · NO EXTERNAL SYSTEMS · NO REAL CREDENTIALS</span></footer>
  </main>;
}
