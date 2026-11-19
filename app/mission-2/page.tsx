import Link from "next/link";
import MissionTwoClient from "./mission-client";

export const metadata = {
  title: "Mission 02: The Impostor | BREACH",
  description: "Investigate simulated digital identities, TLS certificates, and public key infrastructure.",
};

export default function MissionTwoPage() {
  return (
    <>
      <div className="hotel-entry-banner">
        <div><span>NEW FIELD SIMULATION</span><strong>Explore the Northstar Hotel</strong><small>Walk through the environment and discover investigation clues before tackling the full PKI challenge.</small></div>
        <Link href="/mission-2/hotel">ENTER HOTEL ↗</Link>
      </div>
      <MissionTwoClient />
    </>
  );
}
