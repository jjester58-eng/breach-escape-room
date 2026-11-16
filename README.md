# BREACH — Cybersecurity Escape Room

**An interactive cybersecurity investigation game for high school and dual-credit students.**

BREACH places students inside a connected cybersecurity incident. Through five missions, students investigate suspicious activity, analyze digital evidence, solve technical challenges, and make decisions that determine how an organization responds to a cyberattack.

The goal is to move beyond memorizing cybersecurity terminology and give students opportunities to think and work like cybersecurity professionals.

## Project Goals

- Tell one connected cybersecurity incident through five missions.
- Provide three difficulty paths for different experience levels.
- Use interactive simulations involving email, files, logs, network traffic, and digital evidence.
- Reinforce practical cybersecurity knowledge through investigation and problem-solving.
- Provide a browser-only experience with no software installation or command-line access required.
- Support deployment through GitHub and Vercel.
- Keep all activities within a fictional, controlled educational environment.

## Intended Audience

Designed for high school cybersecurity students, including:

- Introductory cybersecurity students
- Intermediate cybersecurity students
- Senior-level Capstone and dual-credit students

Students may have experience with Java, Python, HTML, networking fundamentals, and introductory Linux concepts.

## Difficulty Levels

| Level | Role | Experience |
|---|---|---|
| Rookie Investigator | Guided investigation | Foundational concepts, guided clues, and additional support |
| Security Analyst | Independent investigation | More complex evidence, technical puzzles, and fewer hints |
| Incident Commander | Advanced response | Multi-step investigations, competing priorities, and evidence-based decisions |

The difficulty system should change the actual investigation experience, not simply the number of questions.

## Missions

### 1. The Infiltration
Investigate a suspicious email and determine how an attacker gained an initial foothold.

Topics: phishing, social engineering, malware, and attack vectors.

### 2. The Impostor
Investigate suspicious digital identities and determine which certificates and connections can be trusted.

Topics: digital certificates, Public Key Infrastructure (PKI), encryption, and trust.

### 3. Hidden Evidence
Recover hidden information and analyze digital artifacts to uncover what happened.

Topics: steganography, cryptography, file analysis, and digital forensics.

### 4. Network Under Attack
Investigate network activity, identify suspicious traffic, and determine how an attacker moved through a network.

Topics: packets, networking, network defense, and lateral movement.

### 5. Incident Response
Take responsibility for the incident and determine how to contain the threat, recover systems, and reduce future risk.

Topics: risk management, incident response, containment, eradication, and recovery.

## Technology

- Next.js
- React
- TypeScript
- GitHub
- Vercel

The application is designed around a shared game engine with modular mission content, reusable scoring and hint systems, and a final incident report.

## Development Status

**Current phase: Foundation and initial deployment**

Planned development stages:

1. Establish the application foundation and visual interface.
2. Build a playable version of Mission 1.
3. Develop the remaining four missions.
4. Integrate difficulty levels, scoring, hints, and progress tracking.
5. Create the final incident report and teacher resources.
6. Evaluate opportunities for future classroom features.

## Getting Started

### Requirements

- Node.js
- npm

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Safety and Educational Use

All organizations, identities, messages, systems, and evidence used in BREACH are fictional.

BREACH is a controlled educational simulation. Students investigate simulated environments and evidence. The application does not interact with live networks, access real systems, or conduct attacks against external targets.

The purpose is to develop cybersecurity awareness, technical reasoning, investigative skills, and responsible security practices.
