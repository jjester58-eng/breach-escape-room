export type MissionId = "mission-1" | "mission-2" | "mission-3" | "mission-4" | "mission-5";

export type HeatTargetConfig = {
  id: string;
  label: string;
  category: string;
  clue: string;
};

export type MissionRuntimeConfig = {
  id: MissionId;
  title: string;
  targets: HeatTargetConfig[];
};

export const MISSION_RUNTIME_CONFIG: Record<MissionId, MissionRuntimeConfig> = {
  "mission-1": {
    id: "mission-1",
    title: "The Infiltration",
    targets: [
      { id: "sender", label: "EMAIL SENDER", category: "Identity", clue: "Compare the actual sender and reply-to addresses with a trusted district contact." },
      { id: "attachment", label: "ATTACHMENT", category: "Endpoint", clue: "Inspect the complete filename and actual file type, not just its displayed icon." },
      { id: "credential", label: "LOGIN PAGE", category: "Identity", clue: "The registered domain matters more than familiar words, logos, or page styling." },
      { id: "endpoint", label: "EMPLOYEE DEVICE", category: "Endpoint", clue: "An unknown executable and outbound connection attempt require evidence preservation and approved containment." },
    ],
  },
  "mission-2": {
    id: "mission-2",
    title: "The Impostor",
    targets: [
      { id: "hostname", label: "HOSTNAME", category: "Certificate", clue: "Compare the requested hostname with the certificate Subject Alternative Name." },
      { id: "issuer", label: "ISSUER", category: "PKI", clue: "Identify the issuing intermediate and follow the chain toward its trust anchor." },
      { id: "chain", label: "TRUST CHAIN", category: "PKI", clue: "Validate signatures, constraints, validity, key usage, and the chain order." },
      { id: "revocation", label: "REVOCATION", category: "Trust", clue: "A trusted root does not make every certificate beneath it trustworthy forever." },
    ],
  },
  "mission-3": {
    id: "mission-3",
    title: "Hidden Evidence",
    targets: [
      { id: "hash", label: "FILE HASHES", category: "Integrity", clue: "Compare SHA-256 digests to determine whether two files have identical contents." },
      { id: "image", label: "IMAGE PAYLOAD", category: "Steganography", clue: "A hidden message is an investigative lead; corroborate it with independent evidence." },
      { id: "cipher", label: "ENCRYPTED NOTE", category: "Cryptography", clue: "Test the cipher method and rotation, then verify the decoded text against other artifacts." },
      { id: "provenance", label: "EVIDENCE SOURCE", category: "Forensics", clue: "Preserve each copy separately and document source, handling, and chain of custody." },
    ],
  },
  "mission-4": {
    id: "mission-4",
    title: "Network Under Attack",
    targets: [
      { id: "pc22", label: "PC-22", category: "Endpoint", clue: "The workstation generated the first unusual outbound connection and later contacted an internal file server." },
      { id: "dns", label: "DNS-GW-01", category: "Network", clue: "The DNS record links the workstation's timeline to an unfamiliar external hostname." },
      { id: "filesrv", label: "FILE-SRV-01", category: "Server", clue: "A new SMB session from PC-22 appears after the suspicious external connection." },
      { id: "auth", label: "AUTH-SRV-01", category: "Identity", clue: "Authentication records show a service account used outside its normal pattern." },
      { id: "db", label: "DB-01", category: "Database", clue: "No confirmed database access appears in the supplied evidence. Do not overstate the scope." },
    ],
  },
  "mission-5": {
    id: "mission-5",
    title: "Incident Response",
    targets: [
      { id: "scope", label: "SCOPE", category: "Assessment", clue: "Separate confirmed affected systems from systems that are only suspected." },
      { id: "contain", label: "CONTAINMENT", category: "Response", clue: "Choose a proportionate action that limits spread while preserving evidence." },
      { id: "eradicate", label: "ERADICATION", category: "Recovery", clue: "Remove the cause of compromise and validate that persistence has been addressed." },
      { id: "restore", label: "RECOVERY", category: "Recovery", clue: "Restore from trusted sources, verify controls, and monitor for recurrence." },
      { id: "lessons", label: "LESSONS LEARNED", category: "Risk", clue: "Turn the incident findings into prioritized improvements with owners and follow-up dates." },
    ],
  },
};

export const DIFFICULTY_TIMES = {
  rookie: 20 * 60,
  analyst: 15 * 60,
  commander: 12 * 60,
} as const;

export type DifficultyId = keyof typeof DIFFICULTY_TIMES;

export function heatLabel(value: number): string {
  if (value >= 85) return "CRITICAL";
  if (value >= 65) return "HOT";
  if (value >= 40) return "WARM";
  if (value >= 20) return "COOL";
  return "COLD";
}

export function heatColor(value: number): string {
  const stops = [
    { at: 0, color: [38, 112, 218] },
    { at: 25, color: [39, 177, 205] },
    { at: 50, color: [224, 199, 70] },
    { at: 75, color: [239, 132, 49] },
    { at: 100, color: [218, 57, 57] },
  ];
  const safe = Math.max(0, Math.min(100, value));
  const upperIndex = stops.findIndex((stop) => stop.at >= safe);
  const upper = stops[Math.max(1, upperIndex)];
  const lower = stops[Math.max(0, upperIndex - 1)];
  const ratio = (safe - lower.at) / (upper.at - lower.at);
  const rgb = lower.color.map((channel, index) => Math.round(channel + (upper.color[index] - channel) * ratio));
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

export function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
