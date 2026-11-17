"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Choice = { label: string; correct: boolean; feedback: string };
type Stage = {
  title: string; subtitle: string; kind: "decision" | "hash" | "stego" | "cipher";
  briefing: string; evidence: { label: string; value: string }[];
  question: string; context: string; choices?: Choice[]; explanation: string; hint: string;
};
type Scenario = {
  id: "rookie" | "analyst" | "commander"; role: string; title: string; time: string;
  description: string; technical: string; intro: string; stages: Stage[];
  cipherText: string; cipherShift: number; cipherAnswer: string; hiddenMessage: string;
  reportPrompt: string; minimum: number;
};
type Saved = {
  scenario: Scenario["id"]; stage: number; answers: Record<number, number>; report: string;
  cipherGuess: string; hashName: string; hashDigest: string; hashMatch: boolean | null;
  stegoMessage: string; submitted: boolean; studentName: string; certificate: boolean;
};

const originalAttachment = "ROOBANK PAYROLL NOTICE\nCase: 0417\nDocument: Payroll_Update.pdf.exe\nSource: email attachment\nEndpoint alert: unknown executable launched from Downloads\n";
const recoveredAttachment = originalAttachment.replace("PAYROLL NOTICE", "PAYROLL NOT1CE");
const cipherAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const scenarios: Scenario[] = [
  {
    id: "rookie", role: "ROOKIE INVESTIGATOR", title: "The Altered Attachment", time: "25–35 MIN",
    description: "Follow guided clues from the original phishing attachment to a hidden message and a short encrypted note.",
    technical: "Evidence inventory · SHA-256 · image steganography · Caesar cipher",
    intro: "You are continuing the Case 0417 investigation. In Mission 1, an employee opened a suspicious payroll attachment. The endpoint alert showed an unknown executable launched from Downloads. The response team has recovered a copy of that attachment and several files from the workstation. Your job is to check what changed and find what was concealed.",
    cipherText: "PHQHWLQJ DW 6:30",
    cipherShift: 3,
    cipherAnswer: "MEETING AT 6:30",
    hiddenMessage: "CHECK THE ARCHIVE COPY",
    minimum: 45,
    reportPrompt: "Explain what the hash comparison showed, what was hidden in the image, how you decoded the note, and what you can responsibly conclude.",
    stages: [
      {title:"The Evidence Locker",subtitle:"Connect the recovered files to Mission 1",kind:"decision",briefing:"The response team imaged the employee workstation after the Mission 1 phishing report. The filenames connect this evidence to the suspicious payroll attachment. A filename alone does not prove a file is safe or malicious.",evidence:[
        {label:"CASE",value:"0417 — Initial payroll phishing incident"},
        {label:"MISSION 1 ALERT",value:"Payroll_Update.pdf.exe launched from Downloads"},
        {label:"ENDPOINT ALERT",value:"Unknown executable; outbound connection attempt"},
        {label:"RECOVERED ITEMS",value:"Payroll_Update_RECOVERED.txt · lobby_photo.png · note.enc"}
      ],question:"What should an investigator do before analyzing the recovered files?",context:"The goal is to preserve evidence and create a record that another analyst can verify.",choices:[
        {label:"Open every file and edit anything that looks suspicious",correct:false,feedback:"Editing evidence can change it and make later analysis harder."},
        {label:"Record the evidence, preserve originals, and work from copies",correct:true,feedback:"Correct. Document what was collected, preserve the original evidence, and perform analysis on working copies."},
        {label:"Delete files that appear unrelated to the phishing email",correct:false,feedback:"A file that looks unrelated may contain important context. Do not discard evidence prematurely."}
      ],explanation:"Digital forensics depends on preservation, documentation, and repeatable analysis. A hash can help verify that a file has not changed since a known baseline was recorded.",hint:"Think about how you would prove later that your analysis did not alter the original evidence."},
      {title:"The Fingerprint Test",subtitle:"Calculate a real SHA-256 hash",kind:"hash",briefing:"The email archive retained the original attachment record. The workstation copy may have changed after delivery. Download both provided text artifacts, then upload each one to calculate its SHA-256 digest in your browser.",evidence:[
        {label:"ARCHIVE BASELINE",value:"Payroll_Update.pdf.exe (preserved reference copy)"},
        {label:"WORKSTATION COPY",value:"Payroll_Update_RECOVERED.txt"},
        {label:"METHOD",value:"SHA-256 using the browser's Web Crypto API"},
        {label:"IMPORTANT",value:"A mismatch proves the bytes differ; it does not identify who changed them or why"}
      ],question:"Compare the two files. Does the recovered workstation copy match the archive baseline?",context:"Use the download buttons and upload the files one at a time. The app calculates the digest from the actual file bytes.",explanation:"SHA-256 produces a fixed-length digest. Even a small content change should produce a different digest. A mismatch is evidence of a change, not proof of malicious intent.",hint:"The archive copy is the baseline. Upload the recovered workstation copy and confirm that its SHA-256 digest does not match."},
      {title:"The Photograph",subtitle:"Recover a hidden message",kind:"stego",briefing:"A photo named lobby_photo.png was stored beside the recovered attachment. It looks ordinary, but the incident team suspects it carries a concealed note. Download the evidence image and use the extraction tool to inspect its pixel data.",evidence:[
        {label:"FILE",value:"lobby_photo.png"},
        {label:"VISIBLE CONTENT",value:"A routine office-lobby image"},
        {label:"ANALYST NOTE",value:"The image may contain data in the least-significant bits of its color channels"},
        {label:"TECHNIQUE",value:"LSB steganography"}
      ],question:"What does the hidden message tell you to inspect next?",context:"The image is generated as a real PNG evidence artifact. Download it, upload it to the extractor, and recover the embedded text.",explanation:"Steganography hides the existence of a message inside another file. This differs from encryption, which makes a message unreadable without a key.",hint:"Download the PNG evidence, then upload that same file to the extraction tool. Look for the recovered instruction."},
      {title:"The Encrypted Note",subtitle:"Decode the recovered communication",kind:"cipher",briefing:"A short note was recovered from the same folder. It is not a hash: the characters have been shifted using a simple Caesar cipher. The note gives a meeting time.",evidence:[
        {label:"FILE",value:"note.enc"},
        {label:"CIPHERTEXT",value:"PHQHWLQJ DW 6:30"},
        {label:"KNOWN METHOD",value:"Caesar shift"},
        {label:"CLUE",value:"Try shifting letters backward by three positions"}
      ],question:"Decode the message and enter the plaintext.",context:"Use the shift control or enter your own decoded text. Numbers and spaces remain unchanged.",explanation:"A Caesar cipher substitutes each letter with another letter a fixed number of positions away. It is useful for learning substitution, but it is not secure modern encryption.",hint:"Move each letter three positions backward in the alphabet."},
      {title:"Reconstruct the Evidence",subtitle:"Make a defensible finding",kind:"decision",briefing:"You have compared file fingerprints, recovered a hidden image message, and decoded the note. The incident lead needs a careful summary before the team moves to network investigation.",evidence:[
        {label:"HASH RESULT",value:"The recovered attachment differs from the archive baseline"},
        {label:"IMAGE MESSAGE",value:"CHECK THE ARCHIVE COPY"},
        {label:"DECODED NOTE",value:"MEETING AT 6:30"},
        {label:"LIMITATION",value:"These artifacts do not identify who made the change"}
      ],question:"Which conclusion is best supported by the evidence?",context:"Separate what the evidence demonstrates from what still needs investigation.",choices:[
        {label:"The hash mismatch proves the employee intentionally modified the attachment",correct:false,feedback:"A mismatch proves the files differ. It does not identify who changed the file or establish intent."},
        {label:"The recovered file differs from the archived copy; the hidden note and cipher provide leads for the next investigation",correct:true,feedback:"Correct. This conclusion stays within the evidence and preserves the leads for Mission 4."},
        {label:"The hidden message proves that all files on the workstation are malicious",correct:false,feedback:"One hidden message does not establish that every file is malicious."}
      ],explanation:"A defensible forensic conclusion distinguishes verified observations from hypotheses. Preserve the files and pass the leads to the network investigation.",hint:"Choose the statement that says exactly what the artifacts show without guessing who is responsible."}
    ]
  },
  {
    id: "analyst", role: "SECURITY ANALYST", title: "The Evidence Doesn't Match", time: "40–55 MIN",
    description: "Correlate evidence from the phishing event, compare file integrity, extract concealed data, and decode a communication independently.",
    technical: "SHA-256 verification · metadata reasoning · LSB steganography · Caesar analysis",
    intro: "Mission 1 identified a payroll-themed lure and an executable launched from Downloads. Mission 2 established that RooBank's identity and trust infrastructure were also targeted. Now the forensic team has recovered multiple versions of the attachment and a photo from the compromised workstation. You must determine which artifacts changed and what the attacker may have concealed.",
    cipherText: "WKH VHUYHU ORJ LV WKH QH[W FOXH",
    cipherShift: 3,
    cipherAnswer: "THE SERVER LOG IS THE NEXT CLUE",
    hiddenMessage: "COMPARE TIMESTAMPS WITH DNS LOGS",
    minimum: 85,
    reportPrompt: "Document the hash comparison, explain the limits of a hash mismatch, recover and interpret the image payload, decode the note, and identify the next evidence source you would request.",
    stages: [
      {title:"Build the Evidence Inventory",subtitle:"Correlate artifacts across the incident",kind:"decision",briefing:"The evidence set contains files from the employee workstation, an email archive, and the identity investigation. Build a timeline without assuming that files with similar names are identical.",evidence:[
        {label:"EMAIL ARCHIVE",value:"Payroll_Update.pdf.exe — received 09:12"},
        {label:"WORKSTATION",value:"Payroll_Update_RECOVERED.txt — modified 09:19"},
        {label:"MISSION 1 ALERT",value:"Unknown executable launched 09:21"},
        {label:"MISSION 2 FINDING",value:"Unexpected certificate / identity activity under investigation"},
        {label:"IMAGE",value:"lobby_photo.png — copied to workstation 09:23"}
      ],question:"Which statement is the strongest starting hypothesis?",context:"The timestamps provide a sequence, but they do not prove causation by themselves.",choices:[
        {label:"The attachment was definitely altered by the attacker before it arrived",correct:false,feedback:"The current records do not establish when the file changed or who changed it."},
        {label:"The recovered artifacts should be compared against preserved baselines and correlated with independent logs",correct:true,feedback:"Correct. Compare integrity first, then correlate timestamps and event records before drawing conclusions."},
        {label:"The photo must be harmless because it is an image",correct:false,feedback:"Images can contain metadata or hidden payloads. File type alone does not establish trust."}
      ],explanation:"A timeline helps direct the investigation, but timestamps can be affected by copying, system clocks, and file operations. Use independent records.",hint:"Avoid treating timestamps as proof. What can you verify first, and what independent evidence could corroborate it?"},
      {title:"The Fingerprint Test",subtitle:"Compare archive and endpoint hashes",kind:"hash",briefing:"The archive team supplied a preserved reference file. The endpoint team supplied the recovered copy. Download both artifacts and calculate their SHA-256 hashes. Then explain the result.",evidence:[
        {label:"REFERENCE",value:"Archive copy captured at message receipt"},
        {label:"RECOVERED",value:"Endpoint copy captured during forensic imaging"},
        {label:"INTEGRITY QUESTION",value:"Do the files contain exactly the same bytes?"},
        {label:"CAUTION",value:"A hash is an integrity fingerprint, not a malware verdict"}
      ],question:"Do the endpoint and archive files have matching SHA-256 digests?",context:"Use the browser hashing lab. Hash the original and recovered files, then compare the full values.",explanation:"A cryptographic hash is deterministic: identical bytes produce the same digest. A mismatch means the byte sequences differ. It does not explain the cause.",hint:"Calculate both hashes from the supplied files. Compare all 64 hexadecimal characters."},
      {title:"Inspect the Image",subtitle:"Extract concealed information",kind:"stego",briefing:"The photo was copied to the workstation shortly after the suspicious attachment was opened. Investigators suspect a least-significant-bit payload. Recover the message and decide how it should influence the next collection step.",evidence:[
        {label:"IMAGE",value:"lobby_photo.png"},
        {label:"FILE SIZE",value:"Small PNG image; dimensions are not proof of safety"},
        {label:"HYPOTHESIS",value:"Text may be encoded in pixel color values"},
        {label:"FORENSIC NOTE",value:"Preserve the original image and analyze a working copy"}
      ],question:"What evidence source does the hidden message direct you toward?",context:"Download the PNG and upload it to the extractor. The message is embedded in the pixel data, not displayed as a visible caption.",explanation:"LSB steganography changes the least significant bit of selected pixel channels. The visual impact can be negligible while data is encoded in the image.",hint:"Extract the payload from the downloaded PNG. Read the recovered instruction exactly."},
      {title:"Decode the Communication",subtitle:"Analyze a substitution cipher",kind:"cipher",briefing:"A note recovered beside the image contains a Caesar-shift ciphertext. The attacker may be directing an accomplice toward another evidence source. Decode it and record the exact plaintext.",evidence:[
        {label:"CIPHERTEXT",value:"WKH VHUYHU ORJ LV WKH QH[W FODY"},
        {label:"CIPHER FAMILY",value:"Caesar substitution"},
        {label:"POSSIBLE SHIFT",value:"Unknown; test likely shifts"},
        {label:"ANALYST TASK",value:"Recover the message and explain why this is not modern encryption"}
      ],question:"What does the decrypted note say?",context:"Use the Caesar decoder. You can test shifts from 1 to 25 or enter your plaintext directly.",explanation:"Caesar substitution has only 25 nontrivial shifts and is easily brute-forced. Modern encryption uses much larger key spaces and vetted algorithms.",hint:"Try shifting backward three letters. Preserve the spaces between words."},
      {title:"Forensic Assessment",subtitle:"Decide what the team should collect next",kind:"decision",briefing:"The hash comparison establishes a difference between two copies. The image and cipher point toward server and DNS records. The incident commander wants your next evidence request.",evidence:[
        {label:"INTEGRITY",value:"Endpoint file differs from archive reference"},
        {label:"HIDDEN PAYLOAD",value:"COMPARE TIMESTAMPS WITH DNS LOGS"},
        {label:"DECODED NOTE",value:"THE SERVER LOG IS THE NEXT CLUE"},
        {label:"NEXT MISSION",value:"Network Under Attack"}
      ],question:"Which next step best advances the investigation?",context:"Select the action that corroborates the artifact clues using independent evidence.",choices:[
        {label:"Conclude that the attacker exfiltrated data and close the case",correct:false,feedback:"The current artifacts do not prove exfiltration. That requires network and server evidence."},
        {label:"Preserve and correlate DNS, server, and endpoint logs around the relevant timestamps",correct:true,feedback:"Correct. Independent logs can help establish what systems communicated and when."},
        {label:"Delete the recovered files because the hashes do not match",correct:false,feedback:"Do not destroy evidence. Preserve both versions and document the mismatch."}
      ],explanation:"The next stage should correlate host, DNS, and server telemetry. This is the bridge into Mission 4.",hint:"Which independent records can confirm or challenge what the files appear to suggest?"}
    ]
  },
  {
    id: "commander", role: "INCIDENT COMMANDER", title: "The Evidence Trail", time: "55–75 MIN",
    description: "Resolve conflicting forensic indicators, assess integrity, recover a covert message, and prioritize evidence collection under uncertainty.",
    technical: "Evidence provenance · SHA-256 · steganography · cryptanalysis · forensic reporting",
    intro: "The RooBank incident has expanded beyond a single phishing message. Mission 1 identified the initial payroll lure and endpoint execution. Mission 2 exposed a digital identity and certificate trust problem. The forensic team now has conflicting copies, a suspicious image, and an encrypted note. You must establish what is known, identify uncertainty, and direct the next collection effort.",
    cipherText: "AOL KUZ APTLSPUL PZ UVA AOL LUK",
    cipherShift: 7,
    cipherAnswer: "THE DNS TIMELINE IS NOT THE END",
    hiddenMessage: "PRESERVE THE DNS AND AUTHENTICATION LOGS",
    minimum: 120,
    reportPrompt: "Write an incident-command forensic assessment: evidence provenance, hash findings and limitations, hidden payload significance, cipher result, competing explanations, preservation priorities, and the next collection order.",
    stages: [
      {title:"Conflicting Evidence",subtitle:"Establish provenance before interpretation",kind:"decision",briefing:"Three teams submitted files that appear to represent the same payroll attachment. Their labels and timestamps conflict. The incident commander must decide how to handle the evidence before drawing conclusions.",evidence:[
        {label:"EMAIL GATEWAY",value:"Attachment retained at 09:12; archive export completed 10:04"},
        {label:"ENDPOINT IMAGE",value:"Recovered file timestamp 09:19; copied during imaging at 11:40"},
        {label:"USER SUBMISSION",value:"A similarly named file uploaded at 13:06"},
        {label:"CHAIN OF CUSTODY",value:"User submission has no documented source or handling history"}
      ],question:"Which evidence-handling decision is most defensible?",context:"A file's name and timestamp are not sufficient to establish its provenance. Consider preservation, working copies, and chain of custody.",choices:[
        {label:"Treat all three files as identical because their names are similar",correct:false,feedback:"Similar names do not establish identical contents or provenance."},
        {label:"Preserve each item separately, document source and handling, and compare hashes before interpretation",correct:true,feedback:"Correct. Maintain separate evidence records and establish integrity before combining conclusions."},
        {label:"Discard the user submission because its chain of custody is incomplete",correct:false,feedback:"An incomplete chain reduces confidence, but the item may still be useful as a lead. Preserve and label its limitations."}
      ],explanation:"Chain of custody records who handled evidence, when, and how. Weak provenance does not automatically make an item useless, but conclusions must account for that weakness.",hint:"Do not merge evidence records. Preserve each source and document what is known and unknown about its handling."},
      {title:"The Fingerprint Test",subtitle:"Verify three evidence copies",kind:"hash",briefing:"The archive baseline and recovered endpoint copy are available as downloadable artifacts. A third user-submitted copy is intentionally not trusted until its provenance is documented. Calculate SHA-256 for the first two and compare them.",evidence:[
        {label:"BASELINE",value:"Gateway archive copy captured at receipt"},
        {label:"RECOVERED",value:"Endpoint forensic image copy"},
        {label:"THIRD COPY",value:"User submission; provenance incomplete"},
        {label:"COMMAND DECISION",value:"Do not infer actor or intent from a mismatch alone"}
      ],question:"What does the hash comparison establish, and what does it not establish?",context:"Use the browser hashing lab to calculate the archive and endpoint digests. Then select the most accurate interpretation.",choices:[
        {label:"It proves who modified the file and when",correct:false,feedback:"A hash does not identify an actor or provide a modification timestamp."},
        {label:"It establishes whether the compared byte sequences match, but not who changed them or why",correct:true,feedback:"Correct. SHA-256 supports integrity verification against a known baseline, not attribution or intent."},
        {label:"It proves the file is malware if the hashes differ",correct:false,feedback:"A mismatch is not a malware classification. It only means the compared bytes differ."}
      ],explanation:"Hash values are useful for evidence integrity and known-file comparison. Attribution requires additional corroborating evidence.",hint:"State the narrow claim supported by SHA-256. Avoid claiming attribution, motive, or malware classification."},
      {title:"Covert Channel",subtitle:"Recover the image payload",kind:"stego",briefing:"The image was present in the same directory as the recovered executable. The analyst suspects a covert message encoded in pixel values. Recover the payload, then decide what it means for evidence collection.",evidence:[
        {label:"ARTIFACT",value:"lobby_photo.png"},
        {label:"TECHNIQUE",value:"Least-significant-bit steganography"},
        {label:"RISK",value:"Visible appearance may not reveal embedded content"},
        {label:"REQUIREMENT",value:"Preserve the original and record the extraction method"}
      ],question:"Which collection priority is indicated by the hidden message?",context:"Download and upload the evidence image to recover the embedded text. Do not treat a hidden instruction as proof by itself.",explanation:"Steganography can conceal communication inside ordinary-looking media. The extracted text is a lead that must be corroborated with system logs.",hint:"Extract the payload and read the instruction. Then identify which logs could independently verify it."},
      {title:"Cryptanalysis",subtitle:"Decode the final note",kind:"cipher",briefing:"A second encrypted note was recovered from a temporary folder. The team knows it uses a Caesar-style shift but has not confirmed the key. Recover the plaintext and explain the limits of this cipher.",evidence:[
        {label:"CIPHERTEXT",value:"GSV WKH GVMWLMV RH MLG GSV VMW"},
        {label:"KNOWN FAMILY",value:"Caesar / rotation substitution"},
        {label:"KEY STATUS",value:"Not provided"},
        {label:"ANALYST REQUIREMENT",value:"Test shifts and document the plaintext"}
      ],question:"What does the decrypted message say?",context:"Try all 25 nonzero Caesar shifts. This advanced path uses a different rotation from the earlier scenarios.",explanation:"A Caesar cipher is vulnerable to exhaustive key search because the key space is tiny. It should never be used to protect sensitive modern communications.",hint:"Test the rotation values systematically. The plaintext is a warning about treating a timeline as a complete account."},
      {title:"Command Assessment",subtitle:"Issue the next evidence directive",kind:"decision",briefing:"You have an integrity discrepancy, a concealed instruction, and a decoded warning. The incident commander must direct the next team without overstating what the forensic artifacts prove.",evidence:[
        {label:"VERIFIED",value:"Two compared files do not have identical hashes"},
        {label:"UNRESOLVED",value:"Who changed the file, when, and for what purpose"},
        {label:"IMAGE LEAD",value:"Preserve DNS and authentication logs"},
        {label:"CIPHER LEAD",value:"A timeline alone is not the full explanation"}
      ],question:"Which directive best balances urgency, evidence quality, and investigative value?",context:"The next mission investigates network movement. Choose a directive that preserves evidence and tests the leads.",choices:[
        {label:"Attribute the incident to the employee and immediately wipe the workstation",correct:false,feedback:"The evidence does not establish attribution. Wiping the workstation could destroy valuable artifacts."},
        {label:"Preserve forensic images and logs, document uncertainty, and correlate DNS, authentication, and server events before attribution",correct:true,feedback:"Correct. Preserve first, correlate independent evidence, and keep attribution provisional until supported."},
        {label:"Ignore the hidden message because steganography is only theoretical",correct:false,feedback:"The message is a real artifact in this simulation. It is a lead that should be tested, not ignored or accepted blindly."}
      ],explanation:"Incident command requires defensible decisions under uncertainty. The next mission should test the forensic leads against network telemetry.",hint:"Your directive should preserve evidence, avoid premature attribution, and name the independent records needed next."}
    ]
  }
];

function caesar(text: string, shift: number) {
  return text.replace(/[A-Z]/g, (char) => cipherAlphabet[(cipherAlphabet.indexOf(char) - shift + 26) % 26]);
}

function makeEvidencePng(canvas: HTMLCanvasElement, message: string): string {
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const width = 360, height = 220;
  canvas.width = width; canvas.height = height;
  const data = ctx.createImageData(width, height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    const wave = Math.sin(x * 0.055) * 14 + Math.cos(y * 0.07) * 12;
    data.data[i] = 48 + ((x * 3 + y + wave) % 90);
    data.data[i + 1] = 75 + ((y * 2 + x / 3 + wave) % 100);
    data.data[i + 2] = 92 + ((x + y * 2) % 105);
    data.data[i + 3] = 255;
  }
  const payload = new TextEncoder().encode(message + "\0");
  const bits: number[] = [];
  for (const byte of payload) for (let bit = 7; bit >= 0; bit--) bits.push((byte >> bit) & 1);
  if (bits.length > width * height) return "";
  bits.forEach((bit, index) => { const pixel = Math.floor(index / 3); const channel = index % 3; const offset = pixel * 4 + channel; data.data[offset] = (data.data[offset] & 254) | bit; });
  ctx.putImageData(data, 0, 0);
  return canvas.toDataURL("image/png");
}

async function extractImageMessage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error("Could not read this image.")); });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is unavailable.");
    ctx.drawImage(img, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const bytes: number[] = [];
    let current = 0, count = 0;
    for (let index = 0; index < Math.min(pixels.length, 360 * 220 * 4); index++) {
      if (index % 4 === 3) continue;
      current = (current << 1) | (pixels[index] & 1);
      count++;
      if (count === 8) {
        if (current === 0) break;
        bytes.push(current); current = 0; count = 0;
      }
    }
    return new TextDecoder().decode(new Uint8Array(bytes));
  } finally { URL.revokeObjectURL(url); }
}

async function sha256(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function MissionThreeClient() {
  const [scenarioId, setScenarioId] = useState<Scenario["id"] | null>(null);
  const [stage, setStage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [report, setReport] = useState("");
  const [hintOpen, setHintOpen] = useState(false);
  const [restored, setRestored] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [certificate, setCertificate] = useState(false);
  const [hashName, setHashName] = useState("");
  const [hashDigest, setHashDigest] = useState("");
  const [baselineDigest, setBaselineDigest] = useState("");
  const [hashMatch, setHashMatch] = useState<boolean | null>(null);
  const [hashBusy, setHashBusy] = useState(false);
  const [stegoMessage, setStegoMessage] = useState("");
  const [stegoUrl, setStegoUrl] = useState("");
  const [stegoError, setStegoError] = useState("");
  const [cipherGuess, setCipherGuess] = useState("");
  const [cipherShift, setCipherShift] = useState(3);
  const imageCanvas = useRef<HTMLCanvasElement>(null);
  const scenario = scenarios.find((item) => item.id === scenarioId);
  const current = scenario?.stages[stage];

  useEffect(() => { sha256(new File([originalAttachment], "archive-reference.txt", { type: "text/plain" })).then(setBaselineDigest).catch(() => setBaselineDigest("Web Crypto unavailable")); }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("breach:mission-3:v1");
      if (raw) {
        const saved = JSON.parse(raw) as Saved;
        if (scenarios.some((item) => item.id === saved.scenario)) {
          setScenarioId(saved.scenario); setStage(Math.max(0, Math.min(4, saved.stage || 0)));
          setAnswers(saved.answers || {}); setReport(saved.report || ""); setCipherGuess(saved.cipherGuess || "");
          setHashName(saved.hashName || ""); setHashDigest(saved.hashDigest || ""); setHashMatch(saved.hashMatch ?? null);
          setStegoMessage(saved.stegoMessage || ""); setSubmitted(saved.submitted === true);
          setStudentName(saved.studentName || ""); setCertificate(saved.certificate === true); setRestored(true);
        }
      }
    } catch { /* Ignore malformed local progress. */ }
    finally { setLoaded(true); }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      if (!scenarioId) { localStorage.removeItem("breach:mission-3:v1"); return; }
      const saved: Saved = { scenario: scenarioId, stage, answers, report, cipherGuess, hashName, hashDigest, hashMatch, stegoMessage, submitted, studentName, certificate };
      localStorage.setItem("breach:mission-3:v1", JSON.stringify(saved));
    } catch { /* Progress remains playable if storage is unavailable. */ }
  }, [loaded, scenarioId, stage, answers, report, cipherGuess, hashName, hashDigest, hashMatch, stegoMessage, submitted, studentName, certificate]);

  useEffect(() => {
    if (current?.kind === "stego" && imageCanvas.current && scenario) setStegoUrl(makeEvidencePng(imageCanvas.current, scenario.hiddenMessage));
  }, [current?.kind, scenario]);

  useEffect(() => { if (scenario) setCipherShift(scenario.cipherShift); }, [scenario]);

  const score = useMemo(() => scenario ? Object.entries(answers).filter(([key, value]) => scenario.stages[Number(key)]?.choices?.[value]?.correct).length : 0, [scenario, answers]);
  const completed = scenario ? scenario.stages.filter((item, index) => item.kind === "hash" ? hashMatch === false : item.kind === "stego" ? stegoMessage === scenario?.hiddenMessage : item.kind === "cipher" ? cipherGuess.trim() === scenario?.cipherAnswer : answers[index] !== undefined).length : 0;
  const allComplete = scenario ? scenario.stages.every((item, index) => item.kind === "hash" ? hashMatch === false : item.kind === "stego" ? stegoMessage === scenario?.hiddenMessage : item.kind === "cipher" ? cipherGuess.trim() === scenario?.cipherAnswer : answers[index] !== undefined) : false;

  function start(id: Scenario["id"]) {
    setScenarioId(id); setStage(0); setAnswers({}); setReport(""); setHintOpen(false); setSubmitted(false); setRestored(false);
    setStudentName(""); setCertificate(false); setHashName(""); setHashDigest(""); setHashMatch(null); setStegoMessage(""); setStegoUrl(""); setStegoError(""); setCipherGuess("");
    setCipherShift(id === "commander" ? 7 : 3);
  }
  function reset() {
    if (confirm("Start this Mission 3 investigation over? Your saved answers and report on this browser will be erased.")) {
      localStorage.removeItem("breach:mission-3:v1"); setScenarioId(null); setStage(0); setAnswers({}); setReport("");
      setSubmitted(false); setRestored(false); setHashName(""); setHashDigest(""); setHashMatch(null); setStegoMessage(""); setCipherGuess(""); setStudentName(""); setCertificate(false);
    }
  }
  function choose(index: number) { if (answers[stage] === undefined) setAnswers((old) => ({ ...old, [stage]: index })); }
  async function hashFile(file?: File) {
    if (!file) return;
    setHashBusy(true);
    try {
      const digest = await sha256(file);
      setHashName(file.name); setHashDigest(digest);
      const expected = await sha256(new File([originalAttachment], "archive-reference.txt", { type: "text/plain" }));
      setHashMatch(digest === expected);
    } catch { setHashDigest("Hash calculation failed. Use a supported browser and try again."); setHashMatch(null); }
    finally { setHashBusy(false); }
  }
  async function extractFile(file?: File) {
    if (!file) return;
    setStegoError(""); setStegoMessage("");
    try { setStegoMessage(await extractImageMessage(file)); }
    catch (error) { setStegoError(error instanceof Error ? error.message : "Image extraction failed."); }
  }
  function submitReport() { if (scenario && report.trim().length >= scenario.minimum) setSubmitted(true); }

  if (!loaded) return <main className="game-shell"><div className="eyebrow">LOADING FORENSIC WORKSPACE…</div></main>;

  if (!scenarioId || !scenario) return (
    <main className="game-shell">
      <nav className="game-nav"><Link className="brand" href="/"><span className="brand-mark">B</span><span>BREACH<span className="brand-period">.</span></span></Link><span className="topbar-status"><i/> TRAINING ENVIRONMENT</span></nav>
      <div className="game-heading"><Link href="/" className="back-link">← BACK TO CASE FILES</Link><div className="eyebrow">MISSION 03 / DIGITAL FORENSICS &amp; HIDDEN DATA</div><h1 className="game-title">HIDDEN <em>EVIDENCE</em><span className="accent">.</span></h1><p className="game-lead">The phishing attack was only the beginning. Verify the evidence, uncover concealed information, and reconstruct what happened.</p></div>
      <section className="scenario-panel"><div className="panel-kicker">CASE BRIEF / 0417-C</div><h2>THE ROOBANK INCIDENT CONTINUES</h2><p>Mission 1 identified the payroll-themed phishing lure and the suspicious executable launched from an employee workstation. Mission 2 exposed a digital identity and certificate trust problem. Now the forensic team has recovered files, images, and encrypted notes. Your task is to determine what changed, what was hidden, and what the evidence can actually prove.</p><div className="scenario-meta"><span>CONNECTED INCIDENT / CASE 0417</span><span>15 TOTAL STAGES</span><span>SELECT YOUR INVESTIGATION</span></div></section>
      <div className="level-heading"><div><div className="eyebrow">THREE DISTINCT INVESTIGATION PATHS</div><h2>SELECT YOUR ROLE<span className="accent">.</span></h2></div><p>All paths investigate the same incident, but the evidence, ambiguity, and independence expected from you increase with each role.</p></div>
      <div className="mission2-scenario-grid">{scenarios.map((item, index) => <button key={item.id} className="mission2-scenario-card" onClick={() => start(item.id)}><div className="level-top"><span>PATH 0{index + 1}</span><span className={index === 0 ? "m2-rookie" : index === 1 ? "m2-analyst" : "m2-commander"}>{item.role}</span></div><h3>{item.title}</h3><p>{item.description}</p><div className="m2-technical"><strong>TECHNICAL FOCUS</strong>{item.technical}</div><div className="level-footer"><span>5 STAGES · {item.time}</span><b>↗</b></div></button>)}</div>
      <p className="game-footnote">Choose one investigation path. Progress is automatically saved in this browser. All files and messages are fictional training artifacts.</p>
      <footer className="game-footer"><span>BREACH / FICTIONAL TRAINING ENVIRONMENT</span><span>NO LIVE SYSTEMS · NO REAL MALWARE</span></footer>
    </main>
  );

  if (submitted) return (
    <main className="game-shell completion-shell">
      <nav className="game-nav no-print"><Link className="brand" href="/"><span className="brand-mark">B</span><span>BREACH<span className="brand-period">.</span></span></Link><span className="topbar-status"><i/> CASE REVIEW</span></nav>
      <section className="completion-panel no-print"><div className="completion-mark">✓</div><div className="eyebrow">MISSION 03 / REPORT RECEIVED</div><h1 className="game-title">EVIDENCE <em>RECOVERED</em><span className="accent">.</span></h1><p className="game-lead">You completed {scenario.title}. Your findings are saved on this browser.</p><div className="autosave-strip"><span>✓ COMPLETION SAVED ON THIS DEVICE</span></div><div className="completion-stats"><div><strong>{score}/2</strong><span>ACCURATE DECISIONS</span></div><div><strong>5/5</strong><span>STAGES COMPLETED</span></div><div><strong>{scenario.role.split(" ")[0]}</strong><span>INVESTIGATION PATH</span></div></div><div className="report-review"><div className="panel-kicker">YOUR FORENSIC ASSESSMENT</div><p>{report}</p></div>
      {!certificate ? <section className="certificate-entry"><div className="panel-kicker">FINAL STEP / COMPLETION CERTIFICATE</div><h2>WHO COMPLETED THIS MISSION?</h2><p>Enter your name to generate a printable completion certificate.</p><label htmlFor="m3-student-name">STUDENT NAME</label><input id="m3-student-name" value={studentName} onChange={(e) => setStudentName(e.target.value)} maxLength={70} placeholder="Enter first and last name"/><button className="primary-button" disabled={!studentName.trim()} onClick={() => setCertificate(true)}>GENERATE CERTIFICATE ↗</button></section> : <div className="certificate-actions"><p><strong>Certificate ready.</strong> Print or save it as a PDF.</p><button className="primary-button" onClick={() => window.print()}>PRINT / SAVE AS PDF ↗</button><button className="secondary-button" onClick={() => setCertificate(false)}>EDIT STUDENT NAME</button></div>}
      <div className="completion-actions"><button className="secondary-button" onClick={() => start(scenario.id)}>REPLAY INVESTIGATION ↻</button><button className="secondary-button" onClick={() => { setScenarioId(null); setSubmitted(false); }}>CHOOSE ANOTHER PATH</button><Link className="secondary-button" href="/">RETURN TO CASE FILES</Link></div></section>
      {certificate && <section className="certificate-sheet" aria-label="BREACH certificate of completion"><div className="certificate-frame"><div className="certificate-brand">BREACH<span>.</span></div><div className="certificate-subtitle">CYBERSECURITY ESCAPE ROOM</div><div className="certificate-rule"/><div className="certificate-kicker">CERTIFICATE OF COMPLETION</div><p className="certificate-intro">This certifies that</p><h2 className="certificate-student">{studentName.trim()}</h2><p className="certificate-intro">has successfully completed</p><h3 className="certificate-mission">MISSION 03 — HIDDEN EVIDENCE</h3><div className="certificate-status">MISSION COMPLETE</div><div className="certificate-details"><div><span>INVESTIGATION PATH</span><strong>{scenario.title}</strong></div><div><span>ACCURATE DECISIONS</span><strong>{score}/2</strong></div><div><span>STAGES</span><strong>5 / 5</strong></div></div><div className="certificate-date">COMPLETION DATE: {new Date().toLocaleDateString()}</div><div className="certificate-footer">BREACH CYBERSECURITY TRAINING <span>·</span> FICTIONAL TRAINING ENVIRONMENT</div></div></section>}
    </main>
  );

  return (
    <main className="game-shell">
      <nav className="game-nav"><Link className="brand" href="/"><span className="brand-mark">B</span><span>BREACH<span className="brand-period">.</span></span></Link><div className="mission-nav-label">MISSION 03 <span>/</span> HIDDEN EVIDENCE</div><span className="topbar-status"><i/> {scenario.role}</span></nav>
      <div className="play-header"><div><Link href="/mission-3" className="back-link">← CHANGE INVESTIGATION</Link><div className="eyebrow">OPERATION ROOBANK / CASE 0417-C</div><h1 className="play-title">{scenario.title.toUpperCase()}</h1></div><div className="play-meta"><strong>{scenario.time}</strong><span>ESTIMATED COMPLETION</span></div></div>
      {restored && <div className="restore-notice">SAVED INVESTIGATION RESTORED — Your answers and report were recovered from this browser.</div>}
      <div className="autosave-strip"><span>✓ AUTO-SAVE ON THIS DEVICE</span><button onClick={reset}>START OVER ↻</button></div>
      <div className="progress-wrap"><div className="progress-label"><span>FORENSIC INVESTIGATION PROGRESS</span><strong>{completed} / 5 STAGES</strong></div><div className="progress-track"><div className="progress-fill" style={{width:(completed / 5 * 100) + "%"}}/></div></div>
      <section className="scenario-panel"><div className="panel-kicker">CASE BRIEF / {scenario.role}</div><h2>{scenario.title}</h2><p>{scenario.intro}</p><div className="scenario-meta"><span>{scenario.technical.toUpperCase()}</span><span>STAGE {stage + 1} OF 5</span><span>SIMULATED EVIDENCE</span></div></section>
      <div className="mission2-workspace">
        <aside className="branch-sidebar"><div className="panel-kicker">INVESTIGATION STAGES</div><p className="sidebar-intro">Complete each stage to build your final determination. You can revisit completed stages.</p>{scenario.stages.map((item,index)=><button key={item.title} className={"branch-button " + (stage === index ? "branch-selected" : "") + ((item.kind === "hash" ? hashMatch === false : item.kind === "stego" ? stegoMessage === scenario.hiddenMessage : item.kind === "cipher" ? cipherGuess.trim() === scenario.cipherAnswer : answers[index] !== undefined) ? " branch-done" : "")} onClick={() => {setStage(index);setHintOpen(false);}}><span className="branch-icon">{String(index + 1).padStart(2,"0")}</span><span className="branch-button-copy"><strong>{item.title}</strong><small>{item.subtitle}</small></span><span className="branch-check">{(item.kind === "hash" ? hashMatch === false : item.kind === "stego" ? stegoMessage === scenario.hiddenMessage : item.kind === "cipher" ? cipherGuess.trim() === scenario.cipherAnswer : answers[index] !== undefined) ? "✓" : "↗"}</span></button>)}<div className="hint-box"><button className="hint-toggle" onClick={() => setHintOpen((v) => !v)}>{hintOpen ? "HIDE" : "SHOW"} INVESTIGATOR HINT</button>{hintOpen && <p>{current?.hint}</p>}</div></aside>
        <section className="evidence-panel">
          <div className="evidence-heading"><div><div className="panel-kicker">EVIDENCE REVIEW / STAGE 0{stage + 1}</div><h2>{current?.title}</h2><p>{current?.subtitle}</p></div><span className="evidence-count">{current?.evidence.length} RECORDS</span></div>
          <div className="mission2-briefing">{current?.briefing}</div>
          <div className="mission2-evidence">{current?.evidence.map((item) => <div className="mission2-evidence-row" key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
          {current?.kind === "hash" && <div className="challenge-card"><div className="challenge-number">HANDS-ON LAB / SHA-256</div><h3>{current.question}</h3><p className="challenge-context">{current.context}</p><div className="hash-lab">
            <div className="hash-downloads"><a className="secondary-button" href={"data:text/plain;charset=utf-8," + encodeURIComponent(originalAttachment)} download="Payroll_Update_ARCHIVE.txt">DOWNLOAD ARCHIVE COPY ↓</a><a className="secondary-button" href={"data:text/plain;charset=utf-8," + encodeURIComponent(recoveredAttachment)} download="Payroll_Update_RECOVERED.txt">DOWNLOAD RECOVERED COPY ↓</a></div>
            <label htmlFor="m3-hash-upload">SELECT A FILE TO HASH</label><input id="m3-hash-upload" type="file" accept=".txt,.exe,.bin,*/*" onChange={(e) => hashFile(e.target.files?.[0])}/>
            {hashBusy && <p>Calculating SHA-256…</p>}
            {hashDigest && <div className="feedback-box"><strong>{hashName} — SHA-256</strong><p className="hash-value">{hashDigest}</p>{hashMatch !== null && <small>{hashMatch ? "MATCH: this file matches the archive baseline." : "MISMATCH: this file differs from the archive baseline."}</small>}</div>}
            {hashMatch !== null && <div className="feedback-box"><strong>INTERPRETATION</strong><p>{hashMatch ? "This file matches the preserved archive reference." : "This file does not match the archive reference. Compare the second download to verify the result."}</p></div>}
          </div></div>}
          {current?.kind === "stego" && <div className="challenge-card"><div className="challenge-number">HANDS-ON LAB / IMAGE STEGANOGRAPHY</div><h3>{current.question}</h3><p className="challenge-context">{current.context}</p><div className="stego-lab">
            <canvas ref={imageCanvas} className="stego-preview" aria-label="Generated fictional office image evidence"/>
            <a className="secondary-button" href={stegoUrl || "#"} download="lobby_photo.png">DOWNLOAD EVIDENCE IMAGE ↓</a>
            <label htmlFor="m3-stego-upload">UPLOAD THE PNG TO EXTRACT ITS HIDDEN MESSAGE</label><input id="m3-stego-upload" type="file" accept="image/png" onChange={(e) => extractFile(e.target.files?.[0])}/>
            {stegoError && <p className="feedback-review">{stegoError}</p>}
            {stegoMessage && <div className="feedback-box"><strong>RECOVERED PAYLOAD</strong><p>{stegoMessage}</p><small>{stegoMessage === scenario.hiddenMessage ? "Payload recovered successfully. Record it as a lead and corroborate it with other evidence." : "A payload was recovered, but it does not match the expected evidence note. Verify that you uploaded the supplied image."}</small></div>}
          </div></div>}
          {current?.kind === "cipher" && <div className="challenge-card"><div className="challenge-number">HANDS-ON LAB / CAESAR CIPHER</div><h3>{current.question}</h3><p className="challenge-context">{current.context}</p><div className="cipher-lab"><div className="cipher-text">{scenario.cipherText}</div><label htmlFor="m3-cipher-shift">SHIFT BACKWARD: {cipherShift}</label><input id="m3-cipher-shift" type="range" min="1" max="25" value={cipherShift} onChange={(e) => {setCipherShift(Number(e.target.value));setCipherGuess(caesar(scenario.cipherText,Number(e.target.value)));}}/><div className="cipher-output">{caesar(scenario.cipherText,cipherShift)}</div><label htmlFor="m3-cipher-answer">ENTER THE PLAINTEXT</label><input id="m3-cipher-answer" value={cipherGuess} onChange={(e) => setCipherGuess(e.target.value.toUpperCase())} placeholder="Type the decoded message"/><button className="primary-button" disabled={!cipherGuess.trim()} onClick={() => setCipherGuess(cipherGuess.trim().toUpperCase())}>SAVE DECODED MESSAGE</button>{cipherGuess.trim() && <div className={"feedback-box " + (cipherGuess.trim() === scenario.cipherAnswer ? "" : "feedback-review")}><strong>{cipherGuess.trim() === scenario.cipherAnswer ? "MESSAGE DECODED" : "KEEP ANALYZING"}</strong><p>{cipherGuess.trim() === scenario.cipherAnswer ? "Correct. You recovered the plaintext." : "Compare your entry with the shifted output and check the rotation."}</p></div>}</div></div>}
          {current?.kind === "decision" && <div className="challenge-card"><div className="challenge-number">DECISION {stage + 1} / 5</div><h3>{current.question}</h3><p className="challenge-context">{current.context}</p><div className="choice-list">{current.choices?.map((choice,index)=><button key={choice.label} disabled={answers[stage] !== undefined} className={"choice-button " + (answers[stage] === index ? (choice.correct ? "choice-correct" : "choice-wrong") : "") + (answers[stage] !== undefined && choice.correct ? " choice-reveal" : "")} onClick={() => choose(index)}><span className="choice-letter">{String.fromCharCode(65 + index)}</span><span>{choice.label}</span>{answers[stage] === index && <b>{choice.correct ? "✓" : "×"}</b>}</button>)}</div>{answers[stage] !== undefined && <div className={"feedback-box " + (current.choices?.[answers[stage]]?.correct ? "" : "feedback-review")}><strong>{current.choices?.[answers[stage]]?.correct ? "ANALYST NOTE — CORRECT" : "ANALYST NOTE — REVIEW"}</strong><p>{current.choices?.[answers[stage]]?.feedback}</p><small>{current.explanation}</small></div>}</div>}
          {current?.kind === "hash" && hashMatch !== null && <div className="feedback-box"><strong>FORENSIC INTERPRETATION</strong><p>{hashMatch ? "This upload matches the archive baseline. Now hash the other copy and compare." : "This upload differs from the archive baseline. Hash the other copy to determine which artifact matches the preserved reference."}</p><small>{current.explanation}</small></div>}
          {current?.kind === "stego" && stegoMessage && <div className="feedback-box"><strong>ANALYST NOTE</strong><p>{stegoMessage === scenario.hiddenMessage ? "The embedded message was recovered. Treat it as an investigative lead, not proof of the full attack." : "The extracted text differs from the expected payload. Recheck the evidence image."}</p><small>{current.explanation}</small></div>}
          {current?.kind === "cipher" && cipherGuess.trim() === scenario.cipherAnswer && <div className="feedback-box"><strong>ANALYST NOTE</strong><p>{current.explanation}</p></div>}
          <div className="mission2-stage-controls"><button className="secondary-button" disabled={stage === 0} onClick={() => {setStage((v) => Math.max(0,v - 1));setHintOpen(false);}}>← PREVIOUS STAGE</button><button className="primary-button" disabled={current?.kind === "decision" ? answers[stage] === undefined : current?.kind === "hash" ? hashMatch !== false : current?.kind === "stego" ? stegoMessage !== scenario.hiddenMessage : cipherGuess.trim() !== scenario.cipherAnswer} onClick={() => {setStage((v) => Math.min(4,v + 1));setHintOpen(false);}}>{stage < 4 ? "NEXT STAGE ↗" : "REVIEW INVESTIGATION ↗"}</button></div>
        </section>
      </div>
      {allComplete ? <section className="report-panel"><div className="panel-kicker">FINAL TASK / FORENSIC ASSESSMENT</div><h2>WHAT DOES THE EVIDENCE ESTABLISH?</h2><p>{scenario.reportPrompt}</p><textarea value={report} onChange={(e) => setReport(e.target.value)} rows={7} placeholder="Forensic assessment: The archive and endpoint hashes... The image contained... The decoded note... The evidence does / does not establish... My next evidence request is..."/><button className="primary-button" disabled={report.trim().length < scenario.minimum} onClick={submitReport}>SUBMIT FORENSIC ASSESSMENT ↗</button><small>At least {scenario.minimum} characters required. Reference specific artifacts and distinguish facts from hypotheses.</small></section> : <div className="locked-report"><span>▣</span><div><strong>FINAL ASSESSMENT LOCKED</strong><small>Complete all five investigation stages to unlock your report.</small></div></div>}
      <footer className="game-footer"><span>BREACH / FICTIONAL TRAINING ENVIRONMENT</span><span>NO LIVE SYSTEMS · NO REAL MALWARE · BROWSER-ONLY FORENSICS</span></footer>
    </main>
  );
}
