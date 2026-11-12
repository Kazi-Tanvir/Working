# Module M1 — Hardware & Power

> **Owner:** Hardware Lead (C) · **Backup:** Firmware Lead (B)

---

## 1. Purpose

Build the complete physical circuit on a breadboard first, then transfer to perfboard. This module produces a working, tested, wired assembly that every other firmware module depends on. If the wires are wrong, nothing else works — so this module must be done carefully and verified with a multimeter.

---

## 2. Inputs & Outputs

| Direction | What | From/To |
|-----------|------|---------|
| **Input** | Pin map from [01-interface-contracts.md](file:///d:/02_CODE/04_WORKING/IoT/docs/01-interface-contracts.md) | Interface contracts |
| **Input** | Components from BOM | Purchase |
| **Output** | Fully wired, tested perfboard assembly | → M2 (sensors), M3 (relay, buttons) |
| **Output** | Verified voltage divider (≤ 3.0 V at output) | → M2 (MQ-135 reading) |
| **Output** | Wiring photo / diagram uploaded to `hardware/` | → Everyone (reference) |

### Interface Contract

This module must obey the pin map in `01-interface-contracts.md` §1 exactly. Every wire must match. If a pin needs to change (e.g., because a component doesn't work on that GPIO), the change must be:
1. Discussed with the Firmware Lead
2. Updated in `hardware/pin-map.md` first
3. Updated in `firmware/desk-station/config.h` second
4. Announced in the group chat

---

## 3. Dependencies & Stubs

| Dependency | Status | Stub |
|-----------|--------|------|
| Components purchased | **Blocking** — can't wire without parts | Order on Day 1 |
| Pin map finalized | Done (in contracts doc) | — |
| Firmware | NOT blocking — hardware can be built and tested with simple sketches | Use blink/analogRead to test each component |

**This module blocks M2 and M3** — firmware can't run without wired hardware. However, the Firmware Lead can start learning exercises on a bare ESP32 + breadboard with just a DHT22 while the Hardware Lead builds the full assembly.

---

## 4. Task List

| # | Task | Hours | Done When |
|---|------|-------|-----------|
| 1 | Inventory all components. Check each one is present and undamaged. Test ESP32 boots (plug USB, see LED). | 0.5 | Checklist of all components ticked off. ESP32 LED blinks with test sketch |
| 2 | Draw wiring diagram on paper matching pin map. Label every wire with GPIO number and colour | 0.5 | Diagram reviewed by Firmware Lead |
| 3 | Build breadboard prototype: ESP32 + DHT22 only. Flash DHT22 test sketch. Verify reading appears in Serial | 1.0 | Serial Monitor shows temperature and humidity (not NaN) |
| 4 | Add MQ-135 to breadboard. Build voltage divider (R1=1 kΩ, R2=1.5 kΩ). Measure output with multimeter before connecting to ESP32 | 1.0 | Multimeter reads ≤ 3.0 V at divider output with MQ-135 powered. ADC reads change when breathing on sensor |
| 5 | Add OLED to breadboard (SDA=GPIO21, SCL=GPIO22). Flash OLED test sketch | 0.5 | "Hello World" visible on OLED |
| 6 | Add relay module. Flash relay toggle test. Hear click | 0.5 | Relay clicks on and off every 2 seconds |
| 7 | Add two buttons (GPIO13, GPIO14 with internal pull-ups). Test with digitalRead | 0.5 | Serial shows 0 when pressed, 1 when released |
| 8 | Add RGB LED (GPIO16/17/18 with 220 Ω resistors) and buzzer (GPIO25). Test individually | 0.5 | RGB shows red/green/blue on command. Buzzer beeps |
| 9 | Connect fan (or LED strip) to relay NO/COM terminals. Test relay toggles fan | 0.5 | Fan spins when relay is ON, stops when OFF |
| 10 | Full breadboard integration test: all components connected, flash full sensor sketch | 1.0 | All sensors read, OLED displays, relay clicks, buttons work, RGB lights, buzzer beeps |
| 11 | Transfer to perfboard: solder ESP32 headers, solder components, solder wires | 3.0 | All connections soldered. Visual inspection — no solder bridges |
| 12 | Post-solder continuity test: check every connection with multimeter | 0.5 | Every wire has continuity from component pin to ESP32 pin. No shorts between adjacent pins |
| 13 | Final full test on perfboard: flash complete firmware, verify all functions | 0.5 | Same as step 10, but on perfboard |
| 14 | Cable management: zip ties, labels, clean routing | 0.5 | Neat assembly. Each wire labelled or colour-coded |
| 15 | Photo wiring diagram and upload to `hardware/` in repo | 0.5 | Photo in repo, readable |
| | **Total** | **~11 h** | |

> [!TIP]
> **Split across days:** Tasks 1-7 on the first free day block (Nov 13-15). Tasks 8-10 on the second day. Tasks 11-15 on the second free day block (Nov 20-22) when breadboard prototype is confirmed working.

---

## 5. Files & Folder Locations

```
hardware/
├── pin-map.md           # Canonical pin assignments (copy from contracts, keep updated)
├── wiring-diagram.png   # Photo of final wiring (or hand-drawn scan)
├── voltage-divider.md   # Calculation + measured values
└── assembly-notes.md    # Any discoveries during assembly ("our OLED is 0x3D not 0x3C")
```

---

## 6. Acceptance Test

### Test Procedure (15 minutes)

| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Plug ESP32 into USB. Check power LED on ESP32 | LED lights up | ☐ |
| 2 | Measure 5V rail with multimeter | 4.8–5.2 V | ☐ |
| 3 | Measure 3.3V rail (ESP32 3V3 pin) | 3.2–3.4 V | ☐ |
| 4 | Measure voltage divider output (MQ-135 powered, no load) | ≤ 3.0 V | ☐ |
| 5 | Flash DHT22 test sketch. Check Serial Monitor | Temp and humidity values (not NaN) | ☐ |
| 6 | Flash analogRead(34) sketch. Check Serial Monitor | ADC value 100–3500 range (not stuck at 0 or 4095) | ☐ |
| 7 | Flash OLED test sketch | "Hello" visible on OLED | ☐ |
| 8 | Flash relay test sketch (toggle every 2s) | Hear click, relay LED blinks | ☐ |
| 9 | Flash button test sketch. Press Button 1, Button 2 | Serial shows 0 on press for each button | ☐ |
| 10 | Flash RGB test sketch | LED shows red, green, blue in sequence | ☐ |
| 11 | Flash buzzer test sketch | Buzzer beeps | ☐ |
| 12 | Connect fan to relay. Toggle relay | Fan spins on, stops off | ☐ |
| 13 | Wiggle each wire connection | No intermittent readings/disconnects | ☐ |

**Pass criteria:** All 13 checks pass. If any fail, debug before proceeding.

---

## 7. Wiring Step-by-Step

### 7.1 DHT22

```
DHT22 Module (3 or 4 pins):
  VCC  → 3.3V rail (ESP32 3V3 pin)
  GND  → GND rail
  DATA → GPIO4

If using bare DHT22 (4-pin, no breakout):
  Add 10 kΩ resistor between DATA and VCC (pull-up)
  Leave pin 3 (NC) unconnected
```

### 7.2 MQ-135 with Voltage Divider

```
MQ-135 Module:
  VCC  → 5V rail (NOT 3.3V — heater needs 5V)
  GND  → GND rail
  AOUT → [R1 = 1 kΩ] → Junction → GPIO34
                         Junction → [R2 = 1.5 kΩ] → GND
  DOUT → not connected (we use analog only)
```

> [!CAUTION]
> **Build and test the voltage divider BEFORE connecting to GPIO34.** Measure the junction voltage with a multimeter. It must read ≤ 3.0 V. If it reads > 3.3 V, the ESP32 will be damaged.

### 7.3 OLED Display (I2C)

```
OLED SSD1306:
  VCC → 3.3V rail (most modules accept 3.3–5V)
  GND → GND rail
  SDA → GPIO21
  SCL → GPIO22
```

### 7.4 Relay Module

```
Relay Module:
  VCC → 5V rail (relay coil needs 5V)
  GND → GND rail
  IN  → GPIO26

Relay Screw Terminals:
  COM (Common)    → 5V supply positive (for fan)
  NO  (Normally Open) → Fan positive wire
  Fan negative    → GND rail

When GPIO26 = LOW → relay closes → fan gets power → fan spins
When GPIO26 = HIGH → relay opens → fan off
(This is for active-LOW modules. [VERIFY] your relay module's logic)
```

### 7.5 Buttons

```
Button 1 (Relay Toggle):
  One leg  → GPIO13
  Other leg → GND
  (Internal pull-up enabled in firmware: pinMode(13, INPUT_PULLUP))

Button 2 (Mode):
  One leg  → GPIO14
  Other leg → GND
  (Internal pull-up enabled in firmware: pinMode(14, INPUT_PULLUP))
```

> [!NOTE]
> **Internal pull-ups** mean no external resistor is needed. The ESP32 internally connects the pin to 3.3 V through a ~45 kΩ resistor. When the button is pressed, it connects the pin directly to GND, pulling it LOW (reading = 0).

### 7.6 RGB LED (Common Cathode)

```
RGB LED (4 pins, longest leg = common cathode):
  Red anode   → [220 Ω] → GPIO16
  Common cathode (longest) → GND
  Green anode → [220 Ω] → GPIO17
  Blue anode  → [220 Ω] → GPIO18
```

### 7.7 Buzzer

```
Active Buzzer:
  + (longer leg or marked) → GPIO25
  - (shorter leg)          → GND
```

### 7.8 Power Distribution

```
5V 2A Power Supply (USB charger / bench supply):
  +5V → 5V rail on perfboard
  GND → GND rail on perfboard

From 5V rail:
  → ESP32 VIN pin
  → MQ-135 VCC
  → Relay VCC
  → Fan power (through relay COM)

From ESP32 3V3 pin:
  → DHT22 VCC
  → OLED VCC

GND rail:
  → ESP32 GND
  → All component GNDs
  → Fan GND
```

---

## 8. Top Risks & Fallbacks

| Risk | Likelihood | Mitigation | Fallback |
|------|-----------|------------|----------|
| Cold solder joint causes intermittent failure | Medium | Test every joint with multimeter continuity check | Reflow solder. If persistent, revert to breadboard for demo |
| Wrong pin wired | Medium | Double-check pin-map.md before EVERY connection | Desolder and rewire. Takes 5–10 min per wire |
| ESP32 GPIO damaged by overvoltage | Low | ALWAYS measure voltage divider before connecting | Use spare ESP32 |
| Relay coil draws too much current from ESP32 | Low | Relay module has optocoupler isolation; use 5V rail for coil | Power relay from external 5V, not ESP32 |
| MQ-135 gets very hot | Expected | Normal — the heater runs at ~150 mA. Ensure ventilation | Mount with gap underneath for airflow |
| Components not available locally | Low | Order on Day 1. Check Elephant Road shops or Daraz | Borrow from EEE department or another team |
| Perfboard too small | Low | Use 7×9 cm or larger. Plan layout before soldering | Use two smaller perfboards side by side |

