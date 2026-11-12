# Module M9 — Demo Prep, Fallbacks, Enclosure, Documentation

> **Owner:** Integration Lead (D) · **Backup:** Hardware Lead (C)

---

## 1. Purpose

Everything needed for showcase day: the 3-minute demo script, fallback strategies, setup checklist, enclosure / cable management, project poster, and final README. This module runs during Week 4 (Dec 3–12) after all features are frozen.

---

## 2. Task List

| # | Task | Hours | Done When |
|---|------|-------|-----------|
| 1 | Write demo script (see §4 below) | 0.5 | Script printed out for all team members |
| 2 | Rehearse demo 3 times (all 4 people) | 1.5 | Each rehearsal timed at ≤ 3 min. Everyone knows their lines |
| 3 | Record fallback video: screen + audio capture of working demo | 0.5 | MP4 file on laptop, tested playback |
| 4 | Build packing checklist (see §5) | 0.25 | Printed checklist |
| 5 | Build/decorate enclosure: cardboard box, cut holes for OLED + sensors + buttons, label components | 2.0 | ESP32 + perfboard inside box, OLED + buttons accessible, neat appearance |
| 6 | Cable management: zip ties, tape, route wires neatly | 0.5 | No loose dangling wires |
| 7 | Create project poster / info sheet (A3 or A4) | 1.0 | Printed poster with: title, system diagram, tech stack, team members |
| 8 | Write final README.md in repo root | 0.5 | README has: what it is, how to run, architecture, team credits |
| 9 | Final dry run at home with complete setup | 1.0 | Full demo works from cold start in < 5 min |
| | **Total** | **~7.75 h** | |

---

## 3. Files & Folder Locations

```
docs/
├── demo-script.md          # 3-minute script (also printed)
├── packing-checklist.md     # What to bring
└── poster-content.md        # Text for printed poster

hardware/
└── enclosure-notes.md       # Measurements, photos

README.md                    # Root README
```

---

## 4. Demo Script (3 Minutes)

### Roles
- **Presenter** (Person D — Integration Lead): Introduces the project, narrates
- **Voice Operator** (Person A — Cloud Lead): Operates the browser/voice
- **Hardware Operator** (Person C — Hardware Lead): Presses buttons, points at hardware
- **Backup** (Person B — Firmware Lead): Stands ready, handles tech issues

### The Script

**[0:00–0:30] Introduction**
> **Presenter:** "Welcome! This is **Desk Station** — a smart study desk. It monitors your study environment and lets you control it by voice, from a web dashboard, or with physical buttons. Let me show you how it works."

*Point at the hardware setup on the table.*

> **Presenter:** "On the desk we have sensors measuring temperature, humidity, and air quality, connected to an ESP32 microcontroller. The OLED display shows live readings."

**[0:30–1:10] Voice Demo**
> **Presenter:** "The most exciting feature is voice control. [Person A], can you ask about the temperature?"

> **Voice Operator:** *Clicks mic button in browser.* "What's the temperature?"

*Wait for Vapi to respond with the temperature reading (~3-5 seconds).*

> **Presenter:** "Now let's control the fan by voice."

> **Voice Operator:** "Turn the fan on."

*Relay clicks. Fan starts spinning (or LED strip lights up). OLED updates.*

> **Presenter:** "The voice command went from the browser to Vapi AI, which called our Express backend, which queued a command for the ESP32. The ESP32 picked it up and toggled the relay."

**[1:10–1:50] Dashboard Demo**
> **Presenter:** "We also have a live web dashboard. [Person A], show the dashboard."

> **Voice Operator:** *Switches to dashboard tab on laptop.*

> **Presenter:** "Here you can see the temperature, humidity, and air quality updating in real time — every 3 seconds. There's a history chart showing trends. You can also toggle the fan from here."

> **Voice Operator:** *Clicks the relay toggle on dashboard. Fan toggles.*

**[1:50–2:20] Physical Controls + Automation**
> **Presenter:** "What if the internet is down? The desk works offline too. [Person C], press the button."

> **Hardware Operator:** *Presses Button 1. Relay toggles.*

> **Presenter:** "Physical buttons work instantly, no network needed. We also have automatic control: when the temperature goes above 30 degrees, the fan turns on by itself. The RGB LED shows air quality — green means good air."

*Point at RGB LED. Optionally blow on MQ-135 to change colour.*

**[2:20–3:00] Architecture + Closing**
> **Presenter:** "Under the hood: the ESP32 reads sensors every 2 seconds and sends data to our Express.js backend on Railway every 5 seconds. The Next.js dashboard on Vercel polls the backend. Voice goes through Vapi AI. Everything is connected but also works independently."

*Point at poster/diagram if available.*

> **Presenter:** "Thank you! Any questions?"

---

## 5. Setup Checklist (Showcase Morning)

### 5.1 Packing List (check the night before)

| Item | Packed? | Person |
|------|---------|--------|
| ESP32 + perfboard assembly (in protective box) | ☐ | C |
| USB cable for ESP32 | ☐ | C |
| 5V power supply (phone charger, 2A+) | ☐ | C |
| Fan / LED strip (load device) | ☐ | C |
| Extension cord / power strip | ☐ | C |
| Laptop 1 (dashboard + voice demo) | ☐ | A |
| Laptop 2 (backup, showing code) | ☐ | D |
| Laptop charger(s) | ☐ | A, D |
| Phone (hotspot) + charger | ☐ | B |
| Spare ESP32 (unprogrammed but flashed) | ☐ | B |
| Spare USB cable | ☐ | B |
| Multimeter (for emergency debug) | ☐ | C |
| Printed demo script (2 copies) | ☐ | D |
| Printed poster / info sheet | ☐ | D |
| Tape, zip ties (for last-minute fixes) | ☐ | C |
| Water bottle (for voice presenter) | ☐ | A |
| Fallback demo video on laptop (downloaded, not streaming) | ☐ | D |

### 5.2 At Venue — Setup Timeline

| Time | Task | Who |
|------|------|-----|
| T-60 min | Arrive. Find table. Find power outlet | All |
| T-55 min | Plug in extension cord. Set up power supply | C |
| T-50 min | Connect ESP32 + perfboard. **Power on MQ-135 now** (needs 30 min warm-up) | C |
| T-45 min | Set up phone hotspot. Connect ESP32 to hotspot Wi-Fi | B |
| T-40 min | Verify backend is up: `curl https://your-app.up.railway.app/api/health` | A |
| T-35 min | Open dashboard on laptop. Verify data is flowing | A |
| T-30 min | Test one voice command ("what's the temperature?") | A |
| T-25 min | Test physical button (relay toggles) | C |
| T-20 min | Test dashboard relay toggle | A |
| T-15 min | Arrange display: enclosure front-facing, laptop visible, poster up | D |
| T-10 min | Final check: OLED showing data, RGB LED on, dashboard live | All |
| T-5 min | Open voice page in browser. Have fallback video ready in a tab | A, D |
| T-0 | **Judges arrive. Demo begins.** | All |

### 5.3 "Wi-Fi Down" Plan

```
1. Primary Wi-Fi: Team member's phone hotspot (known SSID hardcoded in firmware)
2. If hotspot fails: try venue Wi-Fi (if available)
3. If ALL Wi-Fi fails:
   a. ESP32 runs in OFFLINE mode: sensors + OLED + buttons + auto-threshold all work
   b. Show judges the offline demo (sensors, buttons, OLED)
   c. Play the pre-recorded video showing the full demo with voice + dashboard
   d. Show the codebase on laptop and explain the architecture from the poster
   e. Key line: "The system is designed to work offline. What you see on the OLED
      is happening in real time. When connected, this data also flows to our web
      dashboard and voice assistant, as shown in this video."
```

---

## 6. Enclosure Suggestions

### Simple Cardboard Enclosure (1-2 hours)

1. Find a sturdy cardboard box (~20×15×10 cm)
2. Cut rectangular hole for OLED display (front)
3. Cut two small holes for buttons (front, below OLED)
4. Cut ventilation holes for MQ-135 sensor (side or top)
5. Cut hole for USB cable (back)
6. Mount perfboard inside with hot glue or double-sided tape
7. Mount OLED flush with the front hole
8. Route button wires to front holes, glue buttons in place
9. Label everything with marker or printed labels:
   - "Temperature & Humidity" near DHT22
   - "Air Quality" near MQ-135
   - "Fan ON/OFF" near Button 1
   - "Mode" near Button 2
10. Spray paint or cover with coloured paper for looks

### Professional Touch (optional)

- 3D print a case (if someone has access to a printer)
- Use a clear acrylic sheet for the front panel
- Add team name / project logo

---

## 7. Poster Content

### Suggested Layout (A3)

```
┌─────────────────────────────────────────┐
│         🖥️ DESK STATION                │
│  Voice-Controlled Smart Study Desk      │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │  [System Architecture Diagram]   │    │
│  │  (simplified version of the      │    │
│  │   Mermaid diagram from overview) │    │
│  └─────────────────────────────────┘    │
│                                          │
│  FEATURES:                               │
│  ✓ Temperature, humidity, air quality    │
│  ✓ Voice control ("turn the fan on")    │
│  ✓ Live web dashboard                   │
│  ✓ Physical buttons                     │
│  ✓ Automatic fan control                │
│  ✓ Works offline                        │
│                                          │
│  TECH STACK:                             │
│  ESP32 · DHT22 · MQ-135 · OLED · Relay  │
│  Express.js · Next.js · Prisma · MySQL   │
│  Vapi AI · Railway · Vercel              │
│                                          │
│  TEAM: [Name A] · [Name B] ·            │
│        [Name C] · [Name D]              │
│  [University Name] · November 2026       │
└─────────────────────────────────────────┘
```

---

## 8. Acceptance Test

| Check | Pass? |
|-------|-------|
| Demo script completed in ≤ 3 min during rehearsal | ☐ |
| All 4 team members know their role | ☐ |
| Fallback video plays correctly | ☐ |
| Packing list complete (everything present) | ☐ |
| Cold start: from power-on to working demo in < 5 min | ☐ |
| Enclosure neat and labelled | ☐ |
| Poster printed and readable from 1 meter | ☐ |
| README in repo is up to date | ☐ |

