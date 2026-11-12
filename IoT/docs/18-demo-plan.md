# Demo Plan (Showcase Day — Dec 12)

> **Target duration:** 3 minutes per judge visit · **Expected visits:** up to 20 · **Goal:** Clear, reliable, zero panic.

---

## 1. Team Roles During Demo

| Role | Who | Responsibilities |
|------|-----|------------------|
| **Presenter** | Integration Lead (D) | Greets judges, tells the story, keeps time (3 min), explains architecture |
| **Voice & Dashboard Operator** | Cloud Lead (A) | Clicks mic button, speaks voice commands, shows live dashboard & chart |
| **Hardware Operator** | Hardware Lead (C) | Points out sensors/OLED/RGB, presses physical buttons, warms DHT22 / breathes on MQ-135 |
| **Tech Watch / Reset** | Firmware Lead (B) | Watches Serial/hotspot/power; resets relay OFF between judge visits; handles fallbacks silently |

---

## 2. The 3-Minute Demo Script (Word-for-Word)

### [0:00 – 0:30] Hook & Hardware Overview
- **Presenter (D):** *"Hi! Welcome to **Desk Station** — a voice-controlled smart study desk. Studying in a hot or stuffy room hurts focus, so our desk monitors temperature, humidity, and air quality in real time, runs automatic cooling, and can be controlled three ways: by voice, from a web dashboard, or with physical buttons."*
- **Hardware Op (C):** *(Points sequentially at labeled components on the desk box)* *"Here is our ESP32 reading the DHT22 temperature/humidity sensor, the MQ-135 air quality sensor, and updating this OLED screen every 2 seconds."*

### [0:30 – 1:15] Voice Control (Hero Moment)
- **Presenter (D):** *"Let's check the desk using voice in the browser. [Person A], ask for the current conditions."*
- **Voice Op (A):** *(Clicks push-to-talk mic button, speaks clearly 30 cm from laptop mic)* **"What's the temperature?"**
- *(Vapi replies aloud with temperature, humidity, air quality — ~3–4 s)*
- **Presenter (D):** *"Now let's turn the desk fan on by voice."*
- **Voice Op (A):** *(Clicks mic)* **"Turn the fan on."**
- *(Relay clicks within 5 s, fan/LED strip turns ON, OLED updates to `Fan: ON`)*
- **Presenter (D):** *"That command went from the browser through Vapi AI to our Express backend on Railway, which queued the command for the ESP32."*

### [1:15 – 1:50] Live Web Dashboard
- **Presenter (D):** *"Everything also syncs to our live Next.js dashboard."*
- **Voice Op (A):** *(Highlights gauges and history chart on laptop screen, then clicks Fan toggle OFF)*
- *(Relay clicks OFF within 5 s)*
- **Presenter (D):** *"Judges can see live readings refreshing every 3 seconds, historical trends, and remote toggles from anywhere."*

### [1:50 – 2:30] Physical Buttons, Local Automation & Offline Proof
- **Presenter (D):** *"What if the venue Wi-Fi drops? Desk Station still works 100% offline. [Person C], press the desk button."*
- **Hardware Op (C):** *(Presses Button 1)*
- *(Relay toggles **instantly**; OLED updates immediately)*
- **Presenter (D):** *"And in Auto Mode, if the room temperature passes 30°C, the ESP32 turns the fan on by itself — with 2°C hysteresis so it doesn't flicker. Plus our RGB LED shifts from green to yellow or red based on air quality."* *(Optional: C breathes gently near MQ-135 or points to RGB LED)*

### [2:30 – 3:00] Architecture & Closing
- **Presenter (D):** *(Points to printed A3 architecture diagram)* *"In short: ESP32 handles sensing and safety-critical local control offline, syncing over HTTP/JSON to Express + MySQL on Railway, Next.js on Vercel, and Vapi for voice. Thank you — happy to take questions!"*

---

## 3. Showcase Morning Setup Checklist

### 3.1 Night Before (Dec 11)
- [ ] Flash final production firmware onto **both** Primary and Spare ESP32 boards (hotspot SSID + Railway URL)
- [ ] Verify Railway backend & Vercel dashboard are live and responding
- [ ] Download fallback MP4 demo video locally to Laptop 1 Desktop (`desk-station-fallback.mp4`)
- [ ] Charge Laptop 1, Laptop 2, Power Bank, and Hotspot Phone to 100%
- [ ] Pack everything in protective box using the packing list below

### 3.2 Packing List
- [ ] Primary perfboard Desk Station assembly + enclosure (Person C)
- [ ] Spare pre-flashed ESP32 + breadboard backup (Person B)
- [ ] 5V 2A USB charger + 2× USB data cables + extension cord / power strip (Person C)
- [ ] 5V fan (or 12V LED strip + adapter) connected to relay (Person C)
- [ ] Laptop 1 (Dashboard + Voice + Fallback Video) + charger (Person A)
- [ ] Laptop 2 (Code / Serial debug backup) + charger (Person D)
- [ ] Hotspot phone + charger / power bank (Person B)
- [ ] Multimeter, spare jumper wires, electrical tape, zip ties (Person C)
- [ ] Printed A3 poster + 2 printed copies of demo script (Person D)
- [ ] Water bottle for Voice Operator (Person A)

### 3.3 At Venue Timeline
| Time | Action | Owner | Done? |
|------|--------|-------|-------|
| **T-60 min** | Claim table, locate nearest power outlet, run extension cord | All | ☐ |
| **T-50 min** | **Power on Desk Station immediately** so MQ-135 begins its 30+ min heater warm-up | C | ☐ |
| **T-45 min** | Turn on phone hotspot; verify ESP32 built-in LED turns ON (Wi-Fi connected) | B | ☐ |
| **T-40 min** | Open Railway `/api/health` and Vercel dashboard on Laptop 1; confirm fresh readings | A | ☐ |
| **T-30 min** | Run 1 full dry-run: 1 voice command, 1 dashboard toggle, 1 button press | All | ☐ |
| **T-15 min** | Set up printed poster, tape down loose power cables, close unnecessary browser tabs | D | ☐ |
| **T-5 min** | Keep Dashboard + Voice tab open; keep `desk-station-fallback.mp4` paused in media player; set relay to `OFF` | A, B | ☐ |

---

## 4. Fallback Ladder (Seamless Recovery)

Never apologize or panic if something fails live — drop down **one level** immediately:

```
Level 1 (Best):  Live Voice (push-to-talk) + Dashboard + Hardware
   │ (if voice fails / venue too loud)
   ▼
Level 2:         Typed Command Box on Dashboard + Dashboard Toggle + Hardware
   │ (if internet / hotspot / Railway drops)
   ▼
Level 3:         100% Offline Hardware Demo (OLED + Buttons + Auto-Threshold + RGB)
                 + Pre-recorded Video of Cloud/Voice on Laptop
   │ (if perfboard hardware fails completely)
   ▼
Level 4:         Breadboard Spare ESP32 OR Pre-recorded Full System Video + Poster Walkthrough
```

---

## 5. "Wi-Fi Down" Emergency Plan

1. **Primary connection:** Team member's phone hotspot (pre-configured in `config.h`), positioned right next to the ESP32 and Laptop 1.
2. **If cellular data on hotspot fails:** Switch Laptop 1 and ESP32 to **Offline Mode**. Do NOT try to debug venue captive portals in front of judges.
3. **What to say to judges:** *"Our architecture explicitly separates local safety and control from the cloud. Right now there is no internet at the table, so you are seeing live local sensing on the OLED, instant button switching, and automatic thermal control. Here is our recorded clip showing the live dashboard and voice AI when connected."*

---

## 6. Repeated-Run Protocol (20 Judge Visits)

- **Reset between every visit (30 seconds):**
  1. Ensure Relay is **OFF** and Auto Mode is **ON** (`Button 2` if needed).
  2. Glance at OLED to verify temperature/humidity are updating normally.
  3. Clear any stale voice call session in browser (ensure mic button shows `"Click mic to start"`).
- **Every 5 visits (~every 45–60 min):**
  - Person B checks hotspot battery and charger temperature.
  - Person A refreshes browser tab (`F5`) if needed to keep WebSocket/audio context fresh.
  - Person A drinks water!

