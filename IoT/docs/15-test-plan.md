# Test Plan

---

## 1. Per-Module Unit Tests

### M1 — Hardware
| Test | Procedure | Pass |
|------|-----------|------|
| Continuity | Multimeter continuity mode on every wire: component pin → ESP32 pin | Beep on every connection |
| No shorts | Check between adjacent pins (especially 3.3V and GND) | No beep |
| Voltage divider | Measure MQ-135 divider output with 5V input | ≤ 3.0 V |
| Power rails | Measure 5V rail and 3.3V rail | 4.8–5.2 V and 3.2–3.4 V |

### M2 — Sensors + OLED
| Test | Procedure | Pass |
|------|-----------|------|
| DHT22 reads | Flash test sketch. Check Serial Monitor | Temp 15–45°C, Humidity 20–90% (plausible) |
| DHT22 NaN recovery | Unplug DHT22 data wire while running | OLED shows "?" not crash. Replugs → resumes |
| MQ-135 responds | Breathe on sensor (after 5 min warm-up) | ADC value increases by > 200 |
| MQ-135 stuck check | Read for 1 min in clean air | Value NOT stuck at 0 or 4095 |
| OLED all lines | Display all 4 info lines | All lines visible and correct |

### M3 — Wi-Fi + HTTP + Relay
| Test | Procedure | Pass |
|------|-----------|------|
| Wi-Fi connect | Flash with hotspot credentials | IP printed within 10 s |
| HTTP POST | POST to backend. Check server logs | 201 response, data in DB |
| HTTP GET | Queue a command in DB. ESP32 polls | Command received and logged to Serial |
| Relay via command | Send `set_relay` command | Relay clicks |
| Button toggle | Press Button 1 | Relay toggles. Auto mode disables |
| Auto-threshold ON | Warm DHT22 above 30°C (auto mode on) | Relay turns ON |
| Auto-threshold OFF | Cool DHT22 below 28°C | Relay turns OFF |
| Offline continues | Disconnect Wi-Fi | OLED + sensors + buttons still work |
| Reconnect | Reconnect Wi-Fi | Data posting resumes within 10–20 s |

### M4 — Backend
| Test | Procedure | Pass |
|------|-----------|------|
| Health check | `curl /api/health` | 200 with `"status": "ok"` |
| Auth reject | `curl` without X-API-Key | 401 |
| Sensor POST | POST valid sensor JSON | 201, row in DB |
| Invalid POST | POST with temperature=999 | 400 (validation error) |
| Command queue | POST /api/dashboard/command, then GET /api/commands | Command appears in GET |
| Command ACK | POST /api/commands/ack | Command status changes to "acked" |
| Command expiry | Wait 60+ s, check stale commands | Status = "expired" |
| Vapi webhook | POST fake tool call | Correct tool result returned |

### M5 — Dashboard
| Test | Procedure | Pass |
|------|-----------|------|
| Loads | `npm run dev`, open localhost:3000 | Page renders without errors |
| Data display | Backend has data | Temp, humidity, AQ cards show values |
| Auto-refresh | Wait 6 s without clicking | Values update at least once |
| Relay toggle | Click toggle | POST sent, toggle reflects new state |
| History chart | Backend has 5+ readings | Chart renders with data points |
| Cross-browser | Open in Firefox | Same layout, no visual bugs |

### M6 — Voice
| Test | Procedure | Pass |
|------|-----------|------|
| Mic permission | Click mic button in Chrome | Browser asks for permission, grants it |
| Voice query | Say "what's the temperature?" | Spoken response with temperature value |
| Voice command | Say "turn the fan on" | Relay clicks within 5 s |
| Push-to-talk | Click mic, speak, click stop | Works same as above |
| Typed fallback | Type "fan on" in text input | Relay toggles |
| Noise test | Play music at 50% volume, try voice | Push-to-talk works at 30 cm |

---

## 2. Integration Tests (M8)

Run these in order. If one fails, debug it before moving to the next.

| # | Test | Steps | Pass | Est. Time |
|---|------|-------|------|-----------|
| 1 | **Cold start** | Power on ESP32. Wait. Check OLED. Check dashboard | OLED shows data within 10 s. Dashboard shows data within 15 s | 2 min |
| 2 | **Sensor → Dashboard** | Read OLED values. Compare with dashboard values | Match within 1 reading cycle (5 s) | 2 min |
| 3 | **Voice → Relay** | Say "turn the fan on" | Relay clicks within 5 s | 1 min |
| 4 | **Dashboard → Relay** | Click relay toggle on dashboard | Relay clicks within 5 s | 1 min |
| 5 | **Button → Relay → Dashboard** | Press physical button | Relay toggles instantly. Dashboard updates within 5 s | 1 min |
| 6 | **Auto-threshold** | Warm DHT22 above 30°C (auto mode on) | Relay turns ON automatically | 2 min |
| 7 | **Offline mode** | Disconnect Wi-Fi (turn off hotspot) | Sensors + OLED + buttons + auto still work. Built-in LED goes off | 2 min |
| 8 | **Reconnect** | Reconnect Wi-Fi | Data flow resumes. Dashboard updates | 1 min |
| 9 | **Full demo run** | Execute 3-minute demo script | All steps complete without failure | 3 min |

---

## 3. Soak Test (2 hours)

**Purpose:** Verify the system doesn't crash, leak memory, or degrade over time.

**Setup:**
1. Power on ESP32 with full firmware
2. Start phone hotspot
3. Verify backend on Railway is up
4. Open dashboard on laptop
5. Start a Serial Monitor log (or redirect to file)
6. Note the starting `ESP.getFreeHeap()` value

**During (every 15 min):**
- Glance at dashboard: is data still flowing?
- Glance at OLED: is it still updating?
- Note any error messages in Serial Monitor

**After 2 hours, check:**
| Check | Expected | Pass? |
|-------|----------|-------|
| OLED still updating | Yes, every 2 s | ☐ |
| Dashboard still showing data | Yes, refreshing every 3 s | ☐ |
| Serial Monitor: any crash / reboot messages? | No | ☐ |
| Free heap at start | Note value: _____ | ☐ |
| Free heap after 2 hours | Within 5 kB of start value | ☐ |
| HTTP error count (search Serial log for "failed") | < 5 errors total | ☐ |
| Backend: database row count | ~1440 readings (every 5 s × 7200 s) | ☐ |
| Toggle relay during soak test | Still responds | ☐ |
| Button press during soak test | Still works | ☐ |

---

## 4. Offline Test

| Step | Action | Expected |
|------|--------|----------|
| 1 | System running normally (Wi-Fi connected) | Dashboard + OLED both show data |
| 2 | Turn off phone hotspot (disconnect Wi-Fi) | |
| 3 | Wait 10 s | OLED shows "WiFi: OFFLINE". Built-in LED OFF. Sensors still reading. OLED still updating |
| 4 | Press Button 1 | Relay toggles instantly |
| 5 | Warm sensor above 30°C (auto mode on) | Relay turns ON automatically |
| 6 | Dashboard on laptop | Shows "Connecting..." or stale data |
| 7 | Turn on phone hotspot again | |
| 8 | Wait 10–20 s | ESP32 reconnects. Built-in LED ON. OLED shows "WiFi: OK" |
| 9 | Check dashboard | Fresh data appears. Data flow resumes |

---

## 5. Noise Test (for Voice)

| Distance | Background | Action | Expected |
|----------|------------|--------|----------|
| 30 cm | Quiet room | Say "turn the fan on" | Recognised ✓ |
| 30 cm | Music at 50% | Say "turn the fan on" (push-to-talk) | Recognised ✓ |
| 60 cm | Quiet room | Say "what's the temperature?" | Recognised ✓ |
| 60 cm | Music at 50% | Say "what's the temperature?" | May fail — acceptable |
| 30 cm | Crowd noise (YouTube "crowd ambience") at 50% | Push-to-talk: "turn the fan on" | Should work ✓ |
| 30 cm | Crowd noise at 75% | Push-to-talk | May fail — use typed fallback |

**Conclusion:** For the demo, always use **push-to-talk** and speak at **30 cm** from the mic. If the venue is very loud, switch to typed commands immediately.

---

## 6. Repeated-Run Test (Judge Simulation)

Simulate 5 back-to-back judge visits (20 total on demo day):

| Run | Pre-check | Demo | Post-check | Issues? |
|-----|-----------|------|------------|---------|
| 1 | OLED on, dashboard live | Full 3-min script | Relay off, reset | |
| 2 | Same | Full 3-min script | Relay off, reset | |
| 3 | Same | Full 3-min script | Relay off, reset | |
| 4 | Same | Full 3-min script | Relay off, reset | |
| 5 | Same | Full 3-min script | Relay off, reset | |

**After each run:** Set relay to OFF (known state). Check OLED is still responsive.

**After all 5 runs:** Check `ESP.getFreeHeap()` — should be stable. Check backend logs for errors.

---

## 7. Edge Case Tests

| Scenario | How to Trigger | Expected Behaviour |
|----------|---------------|-------------------|
| DHT22 returns NaN | Unplug DHT22 data wire | OLED shows "?". Last good values used. No crash |
| MQ-135 not warmed up | Power on and read immediately | Low/erratic values. Display "warming up" or just show raw value |
| Two commands at once | Send two commands before ESP32 polls | Both executed in sequence |
| Database full | Not likely in 3 weeks | Backend should handle gracefully (Railway auto-scales storage) |
| ESP32 loses power briefly | Unplug and replug USB | Reboots, reconnects Wi-Fi, resumes data flow |
| Backend returns 500 | Stop the backend process | ESP32 logs error, retries next cycle. Local operation continues |
| Vapi timeout | Speak very quietly (not recognised) | Vapi returns after timeout. Status shows "try again" |

