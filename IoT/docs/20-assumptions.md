# Assumptions Made & Open Questions

---

## 1. Assumptions Made

Because several showcase details and exact hardware variants are currently `"unknown"`, this plan proceeds on the following explicit assumptions:

1. **Schedule capacity:** Each of the 4 members has **5–6 h/week** for group sessions (Fri/Sat/Sun) plus **2–3 h/week** for home work (**~7–9 h/week**, or **~34–38 h total** over the ~4.3 weeks from Nov 12 to Dec 12). The schedule is capped inside this envelope by treating M7 (Extras) as optional buffer.
2. **Board variant:** The ESP32 boards are standard **30-pin ESP32 DevKit V1 (WROOM-32)** modules [VERIFY pinout silkscreen against your physical boards on Day 1].
3. **OLED controller:** The 0.96" I2C OLED uses an **SSD1306** driver at address `0x3C` (or `0x3D`) [VERIFY with I2C scanner on Day 2].
4. **Relay module:** A standard 5V optocoupler-isolated single-channel relay module, assumed **active-LOW** [VERIFY on Day 2 before wiring the fan].
5. **Low-voltage load safety:** Only a **5V DC fan** or **12V DC LED strip** is switched by the relay — strictly **zero mains (220V AC)** connections.
6. **Showcase venue worst case:** Venue Wi-Fi may be unavailable, slow, or blocked by a captive portal; venue ambient noise may be high; judging visits last ~3 minutes each (~20 visits total). Therefore, offline mode, phone hotspot, push-to-talk, typed fallback, and a pre-recorded video are mandatory.
7. **Judging priorities:** With unknown judging criteria, the project optimizes for (a) live hardware+cloud reliability, (b) clear visual feedback (OLED + dashboard + RGB LED), and (c) clean explanation of local vs cloud architecture.
8. **Cloud free tiers:** Railway (Express + MySQL), Vercel (Next.js), and Vapi Web SDK free tiers remain available and sufficient for ~4 weeks of development + showcase day [VERIFY current Railway trial/credit limits and Vapi free minutes on Day 1].
9. **Local parts availability:** All core BOM components (ESP32, DHT22, MQ-135, OLED, relay, resistors, perfboard) are purchasable locally in Dhaka (Elephant Road / Stadium Market / Techshop / Robolab BD) by Day 2.
10. **Lab tools:** Soldering iron and multimeter are either already owned by a team member or accessible at the university lab.
11. **Telegram access:** Telegram Bot API (`api.telegram.org`) is reachable from Railway servers (cloud-hosted) and on team phones in Bangladesh [VERIFY on Day 1 if pursuing M7].

---

## 2. Open Questions (Action Items for Days 1–3)

### Blocking Questions (Answer before starting hardware/cloud lock-in — max 3)

1. **Exact ESP32 board & USB chip check:** Are your two ESP32 boards 30-pin or 38-pin DevKit V1, and do they use Micro-B or USB-C (CP2102 or CH340)? *(Needed by Day 1 to confirm drivers, cables, and perfboard header spacing.)*
2. **Showcase judging & venue rules:** Ask the coordinator — how long is each judge visit, are power outlets guaranteed at every table, and is there any specific rubric/weight (innovation vs hardware vs presentation)?
3. **Lab / tool access:** Does anyone already own a multimeter and soldering iron, or do we need to reserve university lab access / buy a budget multimeter on Day 1?

### Non-Blocking Team Decisions (Settle in Kickoff Sync)

- Firmware IDE choice for Firmware Lead: **Arduino IDE 2.x** (default in plan, simplest for beginners) vs PlatformIO in VS Code.
- Actuator choice for the relay: **5V DC fan** vs **12V LED strip** (pick one on Day 1 when shopping).
- Which member's phone acts as the **dedicated demo hotspot** (hardcode its SSID/password in `config.h` early).

