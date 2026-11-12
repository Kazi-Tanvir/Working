# Module M7 — Extras (Telegram, To-Do, Pomodoro, RGB, Buzzer)

> **Owner:** Integration Lead (D) · **Backup:** Hardware Lead (C)

> [!WARNING]
> This module is **SHOULD-tier**. It is the **first to be cut** if the team falls behind on MUST features. Do not start M7 until Gate 2 (Nov 25) passes. Priority order within M7: **RGB → Buzzer → To-Do display → Telegram → Pomodoro**.

---

## 1. Purpose

Add polish features that impress judges but are not critical: RGB LED status indicator, buzzer alerts, a Telegram notification bot, a to-do list visible on the dashboard, and a Pomodoro timer on the OLED.

---

## 2. Inputs & Outputs

| Direction | What | From/To |
|-----------|------|---------|
| **Input** | Air quality level from sensorData struct | ← M2 |
| **Input** | Commands from backend (set_rgb, buzz, start_pomodoro) | ← M3 |
| **Input** | Sensor readings for threshold alerts | ← M4 (backend DB) |
| **Output** | RGB LED colour | → Physical LED |
| **Output** | Buzzer beeps | → Physical buzzer |
| **Output** | Telegram message | → User's phone |
| **Output** | To-do list on dashboard | → M5 |
| **Output** | Pomodoro countdown on OLED | → M2 (display) |

---

## 3. Dependencies & Stubs

| Dependency | Blocking? | Workaround |
|-----------|-----------|------------|
| M2 (sensors provide air quality level) | Yes | Use hardcoded airQualityLevel = "moderate" for testing |
| M3 (command execution wired) | Yes for remote-triggered extras | Test firmware extras locally first (button-triggered) |
| M4 (backend for Telegram + to-do) | Yes for Telegram | Can develop Telegram bot independently, connect later |
| M5 (dashboard for to-do display) | Yes for to-do UI | Build to-do component after main dashboard is done |

---

## 4. Sub-Features & Task Lists

### 4.1 RGB LED Status Indicator (Priority 1 — 1.5 h)

The RGB LED shows air quality at a glance: green = good, yellow = moderate, red = poor.

| # | Task | Hours | Done When |
|---|------|-------|-----------|
| 1 | Wire RGB LED (already done in M1). Test with simple colour sketch | 0.25 | LED shows red, green, blue |
| 2 | Add `updateRGB()` function to firmware, called after sensor read | 0.5 | LED colour changes based on air quality level |
| 3 | Add smooth transitions (optional) using PWM fade | 0.5 | Colour fades between states instead of jumping |
| 4 | Test: blow on MQ-135 → LED goes yellow/red | 0.25 | Visual confirmation |

**Code:**
```cpp
// extras.cpp
#include "config.h"
#include "sensors.h"

void setupExtras() {
    // Use ledcWrite for ESP32 PWM (analogWrite doesn't work natively)
    ledcSetup(0, 5000, 8);  // Channel 0, 5kHz, 8-bit resolution
    ledcSetup(1, 5000, 8);  // Channel 1
    ledcSetup(2, 5000, 8);  // Channel 2
    ledcAttachPin(PIN_RGB_R, 0);
    ledcAttachPin(PIN_RGB_G, 1);
    ledcAttachPin(PIN_RGB_B, 2);
}

void updateRGB() {
    if (sensorData.airQualityLevel == "good") {
        ledcWrite(0, 0);    // R = off
        ledcWrite(1, 255);  // G = full
        ledcWrite(2, 0);    // B = off
    } else if (sensorData.airQualityLevel == "moderate") {
        ledcWrite(0, 255);  // R = full  (yellow = red + green)
        ledcWrite(1, 180);  // G = medium
        ledcWrite(2, 0);    // B = off
    } else {  // "poor"
        ledcWrite(0, 255);  // R = full
        ledcWrite(1, 0);    // G = off
        ledcWrite(2, 0);    // B = off
    }
}
```

> [!NOTE]
> **ESP32 PWM:** The ESP32 does NOT support `analogWrite()` like Arduino Uno. Instead, use `ledcSetup()`, `ledcAttachPin()`, and `ledcWrite()`. These are built-in to the ESP32 Arduino core — no extra library needed.

### 4.2 Buzzer Alerts (Priority 2 — 1 h)

Beep the buzzer when air quality transitions from moderate to poor.

| # | Task | Hours | Done When |
|---|------|-------|-----------|
| 1 | Add `checkBuzzerAlert()` function — tracks previous AQ level | 0.5 | Buzzer beeps when AQ goes to "poor" |
| 2 | Add non-blocking beep pattern (beep 3 times, 200 ms each) | 0.5 | Beep pattern plays without blocking main loop |

**Code:**
```cpp
// In extras.cpp
String prevAQLevel = "good";
bool buzzerActive = false;
int buzzerBeeps = 0;
unsigned long lastBuzzerToggle = 0;
bool buzzerState = false;

void checkBuzzerAlert() {
    if (sensorData.airQualityLevel == "poor" && prevAQLevel != "poor") {
        // Transition to poor — start beeping
        buzzerActive = true;
        buzzerBeeps = 0;
        buzzerState = false;
    }
    prevAQLevel = sensorData.airQualityLevel;
}

// Call this from main loop every 100 ms
void updateBuzzer() {
    if (!buzzerActive) return;
    unsigned long now = millis();
    if (now - lastBuzzerToggle < 200) return;  // 200 ms per toggle

    lastBuzzerToggle = now;
    buzzerState = !buzzerState;
    digitalWrite(PIN_BUZZER, buzzerState ? HIGH : LOW);

    if (!buzzerState) {
        buzzerBeeps++;
        if (buzzerBeeps >= 3) {
            buzzerActive = false;
            digitalWrite(PIN_BUZZER, LOW);
        }
    }
}
```

### 4.3 To-Do List Dashboard Component (Priority 3 — 1.5 h)

The to-do data model and Vapi tools are already defined in the contracts. This task adds a visible to-do list on the dashboard.

| # | Task | Hours | Done When |
|---|------|-------|-----------|
| 1 | Add GET /api/dashboard/todos endpoint to backend | 0.5 | Returns list of incomplete TodoItems |
| 2 | Build TodoList component in dashboard | 1.0 | Shows list with checkboxes. Check = complete |

**Backend endpoint:**
```javascript
// backend/src/routes/dashboard.js — add this route
router.get('/todos', async (req, res) => {
    const items = await prisma.todoItem.findMany({
        where: { completed: false },
        orderBy: { createdAt: 'desc' },
    });
    res.json({ items });
});

router.post('/todos/:id/complete', async (req, res) => {
    await prisma.todoItem.update({
        where: { id: parseInt(req.params.id) },
        data: { completed: true, completedAt: new Date() },
    });
    res.json({ status: 'ok' });
});
```

### 4.4 Telegram Alert Bot (Priority 4 — 2.5 h)

Send a Telegram message when temperature exceeds threshold.

| # | Task | Hours | Done When |
|---|------|-------|-----------|
| 1 | Create Telegram bot via @BotFather. Get bot token | 0.25 | Bot token saved in .env |
| 2 | Get chat ID (message the bot, then GET updates API) | 0.25 | Chat ID saved in .env |
| 3 | Install `node-telegram-bot-api` in backend | 0.15 | Package installed |
| 4 | Add alert logic: on sensor POST, check if temp > 35 → send Telegram message (with cooldown to avoid spam) | 1.0 | Receive Telegram message when threshold exceeded |
| 5 | Add air quality alert: send message when AQ goes to "poor" | 0.5 | Receive Telegram message |
| 6 | Test end-to-end: warm sensor → phone notification | 0.5 | Notification appears on phone |

**Backend code:**
```javascript
// backend/src/lib/telegram.js
const TelegramBot = require('node-telegram-bot-api');

const bot = process.env.TELEGRAM_BOT_TOKEN
    ? new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)
    : null;

const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
let lastAlertTime = 0;
const COOLDOWN_MS = 5 * 60 * 1000; // 5-minute cooldown between alerts

async function sendAlert(message) {
    if (!bot || !CHAT_ID) {
        console.log('[Telegram] Not configured, skipping alert');
        return;
    }
    const now = Date.now();
    if (now - lastAlertTime < COOLDOWN_MS) {
        console.log('[Telegram] Cooldown active, skipping');
        return;
    }
    lastAlertTime = now;
    try {
        await bot.sendMessage(CHAT_ID, `🖥️ Desk Station Alert:\n${message}`);
        console.log('[Telegram] Alert sent');
    } catch (err) {
        console.error('[Telegram] Error:', err.message);
    }
}

module.exports = { sendAlert };
```

```javascript
// In sensor.js route, after saving reading:
const { sendAlert } = require('../lib/telegram');

// After saving sensor reading to DB:
if (data.sensors.temperature > 35) {
    sendAlert(`🌡️ High temperature: ${data.sensors.temperature}°C`);
}
if (data.sensors.air_quality_level === 'poor') {
    sendAlert(`🌬️ Poor air quality! Raw: ${data.sensors.air_quality_raw}`);
}
```

> [!NOTE]
> [VERIFY] Telegram accessibility in Bangladesh. If blocked, skip this feature — it's SHOULD-tier.

### 4.5 Pomodoro Timer on OLED (Priority 5 — 2.5 h)

A countdown timer displayed on the OLED. 25 min work → buzzer → 5 min break → buzzer → repeat.

| # | Task | Hours | Done When |
|---|------|-------|-----------|
| 1 | Add Pomodoro state machine in firmware (IDLE, WORK, BREAK) | 1.0 | State transitions work on button press |
| 2 | Display countdown on OLED (override normal display during Pomodoro) | 1.0 | Large countdown visible |
| 3 | Buzzer beep when timer reaches 0 | 0.25 | Beep heard at transition |
| 4 | Trigger via backend command (start_pomodoro) | 0.25 | Voice "start pomodoro" begins countdown |

**Code:**
```cpp
// extras.cpp
enum PomodoroState { POMO_IDLE, POMO_WORK, POMO_BREAK };

PomodoroState pomoState = POMO_IDLE;
unsigned long pomoStartTime = 0;
int pomoWorkMin = 25;
int pomoBreakMin = 5;

void startPomodoro(int workMin, int breakMin) {
    pomoState = POMO_WORK;
    pomoWorkMin = workMin;
    pomoBreakMin = breakMin;
    pomoStartTime = millis();
    Serial.printf("[POMO] Started: %d min work, %d min break\n", workMin, breakMin);
}

void stopPomodoro() {
    pomoState = POMO_IDLE;
}

// Call from main loop every 1 second
void updatePomodoro(unsigned long now) {
    if (pomoState == POMO_IDLE) return;

    int durationMs = (pomoState == POMO_WORK ? pomoWorkMin : pomoBreakMin) * 60000;
    int elapsed = now - pomoStartTime;
    int remaining = (durationMs - elapsed) / 1000;  // seconds remaining

    if (remaining <= 0) {
        // Timer done! Buzz and switch state
        digitalWrite(PIN_BUZZER, HIGH);
        delay(500);
        digitalWrite(PIN_BUZZER, LOW);

        if (pomoState == POMO_WORK) {
            pomoState = POMO_BREAK;
            pomoStartTime = now;
        } else {
            pomoState = POMO_IDLE;  // Break over, stop
        }
        return;
    }

    // Display countdown on OLED (override normal display)
    // This is called from updateDisplay() when pomoState != IDLE
    // See display.cpp for the Pomodoro OLED layout
}

int getPomodoroRemaining() {
    if (pomoState == POMO_IDLE) return -1;
    int durationMs = (pomoState == POMO_WORK ? pomoWorkMin : pomoBreakMin) * 60000;
    return max(0, (int)((durationMs - (millis() - pomoStartTime)) / 1000));
}

const char* getPomodoroLabel() {
    switch (pomoState) {
        case POMO_WORK: return "WORK";
        case POMO_BREAK: return "BREAK";
        default: return "";
    }
}
```

---

## 5. Acceptance Test

| Step | Action | Expected | Pass? |
|------|--------|----------|-------|
| 1 | MQ-135 in clean air | RGB LED is green | ☐ |
| 2 | Blow on MQ-135 | RGB changes to yellow or red. Buzzer beeps if "poor" | ☐ |
| 3 | Clean air resumes | RGB goes back to green. No more buzzing | ☐ |
| 4 | Say "add finish homework to my list" | To-do appears on dashboard TodoList | ☐ |
| 5 | Warm sensor above 35°C | Telegram message received on phone | ☐ |
| 6 | Say "start pomodoro" | OLED shows countdown from 25:00 | ☐ |
| 7 | Wait for timer to expire (use 1-min test timer) | Buzzer beeps, switches to BREAK | ☐ |

---

## 6. Top Risks & Fallbacks

| Risk | Mitigation | Fallback |
|------|------------|----------|
| Running out of time | Strict priority order: RGB → Buzzer → rest. Don't start lower-priority items until higher ones are done | Cut everything below what's finished |
| Telegram blocked in BD | Test early (Day 1-2) | Skip Telegram entirely |
| Pomodoro display conflicts with sensor display | Use a state flag: if Pomodoro active, show Pomodoro layout; else show sensors | Show compact sensor line at bottom during Pomodoro |
| Too many features distract from MUST demo | Integration Lead gatekeeps: no extras until MUST items pass Gate 2 | Focus on what works. Don't demo half-broken features |

