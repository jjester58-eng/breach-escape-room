import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BREACH | Cybersecurity Escape Room",
  description:
    "Investigate the breach. Follow the evidence. Stop the attack. A classroom cybersecurity escape room.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
