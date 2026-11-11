# Desk Station — Interface Contracts

> [!IMPORTANT]
> These contracts are **frozen by Day 3 (November 14)**. Any change after that requires agreement from the Integration Lead AND the affected module owners. Changes must be announced in the group chat and updated in this file first.

---

## 1. Pin Map

### 1.1 ESP32 DevKit V1 (WROOM-32, 30-pin) Pin Assignments

| Component | ESP32 Pin | GPIO | Type | Notes |
|-----------|-----------|------|------|-------|
| DHT22 DATA | D4 | GPIO4 | Digital In | 10 kΩ pull-up to 3.3V required |
| MQ-135 AOUT | D34 | GPIO34 | ADC1_CH6 | Input-only pin. Through voltage divider. **ADC1 required** — ADC2 conflicts with Wi-Fi |
| OLED SDA | D21 | GPIO21 | I2C SDA | Default I2C SDA on ESP32 |
| OLED SCL | D22 | GPIO22 | I2C SCL | Default I2C SCL on ESP32 |
| Relay IN | D26 | GPIO26 | Digital Out | Active LOW on most relay modules [VERIFY your module] |
| RGB LED — Red | D16 | GPIO16 | PWM Out | 220 Ω resistor in series |
| RGB LED — Green | D17 | GPIO17 | PWM Out | 220 Ω resistor in series |
| RGB LED — Blue | D18 | GPIO18 | PWM Out | 220 Ω resistor in series |
| Buzzer | D25 | GPIO25 | Digital Out / PWM | Active buzzer: HIGH = on. Passive: use `tone()` |
| Button 1 (Relay) | D13 | GPIO13 | Digital In | Internal pull-up enabled. Wire button between GPIO13 and GND |
| Button 2 (Mode) | D14 | GPIO14 | Digital In | Internal pull-up enabled. Wire button between GPIO14 and GND |
| Built-in LED | — | GPIO2 | Digital Out | Used as Wi-Fi status indicator |

> [!NOTE]
> **Why GPIO34 for MQ-135?** GPIOs 34-39 are input-only on ESP32 — perfect for analog sensors. More importantly, they are on **ADC1**, which works while Wi-Fi is active. ADC2 (GPIOs 0, 2, 4, 12-15, 25-27) **cannot be used with Wi-Fi on** — the Wi-Fi driver takes over ADC2 hardware.

### 1.2 Pins to Avoid

| Pin | Reason |
|-----|--------|
| GPIO0 | Boot mode select. Pulling LOW during boot enters flash mode |
| GPIO2 | Boot mode. Used for built-in LED — OK for output, don't use for input |
| GPIO5 | Outputs PWM signal at boot. Can cause relay click on startup |
| GPIO12 | Boot fail if pulled HIGH (sets flash voltage) |
| GPIO15 | Outputs PWM signal at boot |
| GPIO6-11 | Connected to internal SPI flash. **Never use** |

### 1.3 Power Rails

```
USB 5V (from laptop/charger)
  ├── ESP32 VIN pin (onboard regulator → 3.3V for ESP32)
  ├── DHT22 VCC (3.3V from ESP32 3V3 pin, or 5V — both work) [VERIFY DHT22 module voltage]
  ├── MQ-135 VCC (5V — this sensor needs 5V heater)
  ├── OLED VCC (3.3V from ESP32 3V3 pin — most modules accept 3.3-5V)
  ├── Relay module VCC (5V from ESP32 VIN or external supply)
  └── Fan / LED strip (5V from same supply, or 12V from separate supply through relay)

GND — ALL grounds connected together (ESP32 GND, sensor GNDs, relay GND, power supply GND)
```

> [!WARNING]
> **Common ground is critical.** If the MQ-135 and ESP32 do not share the same GND, the ADC readings will be garbage. Every component's GND wire must connect to the same ground rail.

### 1.4 External 5V Power Supply

The ESP32's onboard 3.3V regulator can supply ~500 mA. The MQ-135 heater alone draws ~150 mA, the relay coil ~70 mA, and the OLED ~20 mA. **Use an external 5V 2A power supply** (phone charger or bench supply) connected to a shared 5V rail. The ESP32 can be powered from this rail through its VIN pin.

```
External 5V 2A Supply
  ├── VIN → ESP32 VIN
  ├── 5V  → MQ-135 VCC
  ├── 5V  → Relay VCC
  ├── 5V  → Fan (if 5V fan)
  └── GND → Common GND rail
```

---

## 2. Voltage Divider for MQ-135

### 2.1 The Problem

The MQ-135 analog output (AOUT) ranges from 0 V to 5 V. The ESP32 ADC input maximum is **3.3 V**. Feeding 5 V directly into GPIO34 will **damage the ESP32**.

### 2.2 The Solution: Resistive Voltage Divider

A voltage divider is two resistors in series that scale down a voltage. The output voltage is taken from the junction between the two resistors.

```
MQ-135 AOUT ──── [ R1 = 1 kΩ ] ──┬── GPIO34 (ESP32 ADC input)
                                   │
                              [ R2 = 1.5 kΩ ]
                                   │
                                  GND
```

### 2.3 Calculation

$$V_{out} = V_{in} \times \frac{R_2}{R_1 + R_2}$$

With R1 = 1 kΩ and R2 = 1.5 kΩ:

$$V_{out} = 5\text{V} \times \frac{1.5}{1 + 1.5} = 5 \times \frac{1.5}{2.5} = 5 \times 0.6 = 3.0\text{V}$$

**Maximum output: 3.0 V** — safely below the ESP32's 3.3 V limit, with 0.3 V margin.

### 2.4 ADC Mapping

The ESP32 ADC is 12-bit: readings range from 0 to 4095.

- At 0 V input (clean air): ADC ≈ 0
- At 3.0 V input (worst air): ADC ≈ 3.0 / 3.3 × 4095 ≈ **3723**

The usable ADC range is **0 – 3723**.

> [!NOTE]
> The ESP32 ADC is non-linear, especially near 0 V and 3.3 V. For this project, we only need **relative** air quality levels (good / moderate / poor), not precise ppm. So non-linearity is acceptable. Do NOT claim ppm values in the demo.

### 2.5 Air Quality Thresholds (Configurable)

These are starting values. **Calibrate after the MQ-135 has warmed up for 24-48 hours.** Read the ADC value in clean air — that is your "good" baseline.

```cpp
// In config.h — adjust after testing!
#define AQ_GOOD_MAX      1200   // Below this = "Good" (green)
#define AQ_MODERATE_MAX  2200   // Below this = "Moderate" (yellow)
// Above AQ_MODERATE_MAX       = "Poor" (red)
```

> [!CAUTION]
> **MQ-135 warm-up:** This sensor needs **20+ minutes** (ideally 24-48 hours) of continuous power before readings stabilize. At the showcase, **power it on at least 30 minutes before judges arrive**. On first power-up ever, burn it in for 24 hours at home.

---

## 3. JSON Schemas

### 3.1 Sensor Data Payload (ESP32 → Backend)

**Sent:** Every 5 seconds via HTTP POST

```jsonc
// POST /api/sensor-data
// Content-Type: application/json
// X-API-Key: <API_KEY>
{
  "device_id": "desk-station-01",       // String. Fixed device identifier
  "timestamp": 1700000000,              // Number. Unix epoch seconds from ESP32 millis() or NTP
  "sensors": {
    "temperature": 25.5,                // Number. Celsius, 1 decimal
    "humidity": 62.0,                   // Number. Percent, 1 decimal
    "air_quality_raw": 1050,            // Number. Raw ADC value 0-3723
    "air_quality_level": "good"         // String. "good" | "moderate" | "poor"
  },
  "relay_state": false,                 // Boolean. true = ON, false = OFF
  "auto_mode": true,                    // Boolean. true = auto-threshold active
  "wifi_rssi": -45,                     // Number. Wi-Fi signal strength in dBm
  "uptime_s": 3600                      // Number. Seconds since boot
}
```

**Validation rules (backend must enforce):**
- `temperature`: -40 to 80 (DHT22 range). Reject outside this → bad sensor.
- `humidity`: 0 to 100.
- `air_quality_raw`: 0 to 4095.
- `air_quality_level`: must be one of `"good"`, `"moderate"`, `"poor"`.
- If any field is missing or invalid, return 400 and log a warning. Do NOT crash.

### 3.2 Command Queue Response (Backend → ESP32)

**Returned:** When ESP32 polls GET /api/commands

```jsonc
// GET /api/commands?device_id=desk-station-01
// X-API-Key: <API_KEY>
//
// Response 200:
{
  "commands": [
    {
      "id": "cmd-a1b2c3d4",             // String. UUID, generated by backend
      "action": "set_relay",             // String. See action vocabulary below
      "params": {                        // Object. Action-specific parameters
        "state": true
      },
      "created_at": 1700000010           // Number. Unix epoch seconds
    }
  ]
}

// Response 200 (no pending commands):
{
  "commands": []
}
```

### 3.3 Command Acknowledgement (ESP32 → Backend)

**Sent:** After executing command(s), in the same POST as sensor data OR separately

```jsonc
// POST /api/commands/ack
// Content-Type: application/json
// X-API-Key: <API_KEY>
{
  "device_id": "desk-station-01",
  "acked": ["cmd-a1b2c3d4", "cmd-e5f6g7h8"]   // Array of command IDs executed
}
```

### 3.4 Command Action Vocabulary

| Action | Params | Description | MUST/SHOULD |
|--------|--------|-------------|-------------|
| `set_relay` | `{ "state": true/false }` | Turn relay on or off | MUST |
| `set_auto_mode` | `{ "enabled": true/false }` | Enable or disable auto-threshold | MUST |
| `set_threshold` | `{ "temp_on": 30, "temp_off": 28 }` | Change auto-threshold temps | SHOULD |
| `set_rgb` | `{ "r": 255, "g": 0, "b": 0 }` | Set RGB LED colour | SHOULD |
| `buzz` | `{ "duration_ms": 500, "count": 3 }` | Beep the buzzer | SHOULD |
| `start_pomodoro` | `{ "work_min": 25, "break_min": 5 }` | Start a Pomodoro timer | SHOULD |
| `stop_pomodoro` | `{}` | Stop Pomodoro timer | SHOULD |
| `display_message` | `{ "line": 3, "text": "Hello!" }` | Show text on OLED line 0-3 | SHOULD |

> [!NOTE]
> **Action vocabulary is extensible.** If the ESP32 receives an action it does not recognise, it should **ignore it** (not crash), log it to Serial, and still ACK it so the backend does not re-send it forever.

---

## 4. REST API Endpoints

**Base URL:** `https://<app-name>.up.railway.app` (production) or `http://localhost:3001` (development)

**Auth:** All endpoints require header `X-API-Key: <value>` matching the `API_KEY` env variable. The backend returns `401 Unauthorized` if the key is missing or wrong.

### 4.1 ESP32 Endpoints

| Method | Path | Request Body | Success Response | Error Responses |
|--------|------|-------------|-----------------|-----------------|
| `POST` | `/api/sensor-data` | Sensor payload (§3.1) | `201 { "status": "ok", "id": <reading_id> }` | `400` invalid data, `401` bad key |
| `GET` | `/api/commands?device_id=desk-station-01` | — | `200` Command queue (§3.2) | `401` bad key |
| `POST` | `/api/commands/ack` | Ack payload (§3.3) | `200 { "status": "ok", "acked_count": 2 }` | `400` invalid, `401` bad key |

### 4.2 Dashboard Endpoints

| Method | Path | Request Body | Success Response | Error |
|--------|------|-------------|-----------------|-------|
| `GET` | `/api/dashboard/current` | — | `200` Latest sensor reading (same shape as §3.1 + `id` and `created_at`) | `401`, `404` no data yet |
| `GET` | `/api/dashboard/history?hours=24` | — | `200 { "readings": [...] }` Array of recent readings, newest first, max 500 | `401` |
| `POST` | `/api/dashboard/command` | `{ "action": "set_relay", "params": { "state": true } }` | `201 { "status": "queued", "command_id": "cmd-xxx" }` | `400`, `401` |
| `GET` | `/api/dashboard/command/:id/status` | — | `200 { "id": "...", "status": "pending"|"acked"|"expired", ... }` | `401`, `404` |

### 4.3 Vapi Webhook Endpoint

| Method | Path | Request Body | Success Response |
|--------|------|-------------|-----------------|
| `POST` | `/api/vapi/webhook` | Vapi tool-call payload (see §6) | `200` Tool result JSON (see §6) |

### 4.4 Health Check

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/api/health` | `200 { "status": "ok", "uptime": 12345, "db": "connected" }` |

### 4.5 Command Expiry

Commands older than **60 seconds** with status `"pending"` are considered expired. A cron job (or check on each GET) marks them `"expired"`. This prevents stale commands from executing after a long ESP32 disconnect.

---

## 5. Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

// For local development: SQLite
// datasource db {
//   provider = "sqlite"
//   url      = "file:./dev.db"
// }

// For production: MySQL on Railway
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model SensorReading {
  id               Int      @id @default(autoincrement())
  deviceId         String   @map("device_id")
  temperature      Float
  humidity         Float
  airQualityRaw    Int      @map("air_quality_raw")
  airQualityLevel  String   @map("air_quality_level")  // "good" | "moderate" | "poor"
  relayState       Boolean  @map("relay_state")
  autoMode         Boolean  @map("auto_mode")
  wifiRssi         Int?     @map("wifi_rssi")
  uptimeS          Int?     @map("uptime_s")
  createdAt        DateTime @default(now()) @map("created_at")

  @@index([deviceId, createdAt])
  @@map("sensor_readings")
}

model Command {
  id        String   @id @default(uuid())
  deviceId  String   @map("device_id")
  action    String                           // e.g. "set_relay"
  params    Json                             // e.g. {"state": true}
  source    String   @default("dashboard")   // "dashboard" | "vapi" | "telegram" | "auto"
  status    String   @default("pending")     // "pending" | "acked" | "expired"
  createdAt DateTime @default(now()) @map("created_at")
  ackedAt   DateTime? @map("acked_at")

  @@index([deviceId, status])
  @@map("commands")
}

// SHOULD tier — for voice-managed to-do list
model TodoItem {
  id          Int      @id @default(autoincrement())
  text        String
  completed   Boolean  @default(false)
  createdAt   DateTime @default(now()) @map("created_at")
  completedAt DateTime? @map("completed_at")

  @@map("todo_items")
}
```

### 5.1 Migration Commands

```bash
# Generate Prisma client
npx prisma generate

# Create migration (development)
npx prisma migrate dev --name init

# Apply migration (production — Railway)
npx prisma migrate deploy

# View database in browser
npx prisma studio
```

---

## 6. Vapi Tool Definitions

These are the functions Vapi can call. They are registered in the Vapi dashboard as "tools" for the voice assistant.

### 6.1 Tool: `get_sensor_data`

```json
{
  "name": "get_sensor_data",
  "description": "Get the current temperature, humidity, and air quality readings from the desk station sensors.",
  "parameters": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

**Backend handler returns:**
```json
{
  "temperature": 25.5,
  "humidity": 62.0,
  "air_quality": "good",
  "relay_state": "off",
  "auto_mode": "on"
}
```

**Vapi will speak something like:** *"The temperature is 25.5 degrees Celsius, humidity is 62 percent, and the air quality is good. The fan is currently off and auto mode is on."*

### 6.2 Tool: `set_relay`

```json
{
  "name": "set_relay",
  "description": "Turn the fan (relay) on or off. Use this when the user says things like 'turn the fan on', 'switch off the fan', 'turn on the light'.",
  "parameters": {
    "type": "object",
    "properties": {
      "state": {
        "type": "boolean",
        "description": "true to turn ON, false to turn OFF"
      }
    },
    "required": ["state"]
  }
}
```

**Backend handler returns:**
```json
{
  "success": true,
  "message": "Fan has been turned on. The command has been sent to the device."
}
```

### 6.3 Tool: `set_auto_mode`

```json
{
  "name": "set_auto_mode",
  "description": "Enable or disable automatic fan control based on temperature thresholds. When enabled, the fan turns on automatically above 30°C and off below 28°C.",
  "parameters": {
    "type": "object",
    "properties": {
      "enabled": {
        "type": "boolean",
        "description": "true to enable auto mode, false to disable"
      }
    },
    "required": ["enabled"]
  }
}
```

### 6.4 Tool: `add_todo` (SHOULD tier)

```json
{
  "name": "add_todo",
  "description": "Add an item to the study to-do list. Use when the user says things like 'add finish lab report to my list' or 'remind me to buy milk'.",
  "parameters": {
    "type": "object",
    "properties": {
      "text": {
        "type": "string",
        "description": "The to-do item text"
      }
    },
    "required": ["text"]
  }
}
```

### 6.5 Tool: `get_todos` (SHOULD tier)

```json
{
  "name": "get_todos",
  "description": "Get all incomplete items from the study to-do list.",
  "parameters": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

### 6.6 Tool: `start_pomodoro` (SHOULD tier)

```json
{
  "name": "start_pomodoro",
  "description": "Start a Pomodoro study timer. Default is 25 minutes work, 5 minutes break. The timer shows on the desk OLED display.",
  "parameters": {
    "type": "object",
    "properties": {
      "work_minutes": {
        "type": "integer",
        "description": "Work duration in minutes. Default 25.",
        "default": 25
      },
      "break_minutes": {
        "type": "integer",
        "description": "Break duration in minutes. Default 5.",
        "default": 5
      }
    },
    "required": []
  }
}
```

### 6.7 Command Vocabulary (What Users Can Say)

| User says (examples) | Vapi tool called | Params |
|----------------------|-----------------|--------|
| "Turn the fan on" / "Switch on the fan" / "Fan on" | `set_relay` | `{ "state": true }` |
| "Turn off the fan" / "Fan off" | `set_relay` | `{ "state": false }` |
| "What's the temperature?" / "How hot is it?" | `get_sensor_data` | `{}` |
| "What's the humidity?" | `get_sensor_data` | `{}` |
| "How's the air quality?" | `get_sensor_data` | `{}` |
| "Enable auto mode" / "Turn on automatic" | `set_auto_mode` | `{ "enabled": true }` |
| "Disable auto mode" | `set_auto_mode` | `{ "enabled": false }` |
| "Add finish lab report to my list" | `add_todo` | `{ "text": "finish lab report" }` |
| "What's on my to-do list?" | `get_todos` | `{}` |
| "Start a Pomodoro" / "Start study timer" | `start_pomodoro` | `{}` |

### 6.8 Vapi Webhook Payload Format

When Vapi calls a tool, it sends a POST to `/api/vapi/webhook`. The payload structure [VERIFY with Vapi docs — format may vary by Vapi SDK version]:

```jsonc
// POST /api/vapi/webhook
{
  "message": {
    "type": "tool-calls",
    "toolCalls": [
      {
        "id": "call_abc123",
        "function": {
          "name": "set_relay",
          "arguments": "{\"state\": true}"    // Note: stringified JSON
        }
      }
    ]
  }
}
```

**Backend must respond with:**

```jsonc
{
  "results": [
    {
      "toolCallId": "call_abc123",
      "result": "{\"success\": true, \"message\": \"Fan turned on.\"}"
    }
  ]
}
```

> [!IMPORTANT]
> The Cloud Lead has experience with Vapi tool calls. The exact payload format depends on the Vapi assistant configuration (server URL vs function calling). **Verify the payload shape** by logging `req.body` during development with ngrok. The Cloud Lead should set up a Vapi assistant in the Vapi dashboard on Day 1 and test the webhook format by Day 3.

---

## 7. Error Handling and Retry Behaviour

### 7.1 ESP32 → Backend (Firmware Side)

| Scenario | Detection | Action |
|----------|-----------|--------|
| Wi-Fi disconnected | `WiFi.status() != WL_CONNECTED` | Attempt reconnect every 10 s. Continue offline operation (sensors, OLED, buttons, auto-threshold all work). Set built-in LED OFF |
| Wi-Fi connected | `WiFi.status() == WL_CONNECTED` | Set built-in LED ON. Resume HTTP cycle |
| HTTP POST fails (timeout, non-2xx) | `httpResponseCode <= 0` or `>= 400` | Log to Serial. Skip this cycle. Try again in 5 s. Do NOT block the loop |
| HTTP GET fails | Same as above | No commands this cycle. ESP32 keeps running |
| JSON parse error (bad response) | ArduinoJson `deserializeJson()` returns error | Log to Serial. Ignore response. Try again next cycle |
| DHT22 returns NaN | `isnan(temperature)` | Use last known good value. Show "?" on OLED. Do NOT send NaN to backend |
| MQ-135 reads 0 or 4095 continuously | Stuck at rail | Likely wiring issue. Show "ERR" on OLED air quality line. Send raw value; backend marks as suspect |
| Server down for > 30 s | Count consecutive failures | Show "OFFLINE" on OLED status line. All local functions continue |

### 7.2 Backend Side

| Scenario | Detection | Action |
|----------|-----------|--------|
| Invalid sensor payload | Validation fails (missing fields, out-of-range) | Return `400 { "error": "..." }`. Log warning. Do NOT store |
| Database connection lost | Prisma throws `PrismaClientKnownRequestError` | Return `503`. Log error. Process will auto-reconnect on next request |
| Vapi webhook has unknown tool | `toolName` not in handler map | Return `200` with `{ "result": "Unknown tool" }`. Don't crash |
| Duplicate command ACK | Command already `"acked"` | Return `200` (idempotent). No error |
| ESP32 not seen for > 60 s | No sensor POST for 60 s | Dashboard shows "Device offline" badge. Pending commands expire |

### 7.3 Dashboard Side

| Scenario | Detection | Action |
|----------|-----------|--------|
| API unreachable | Fetch throws error | Show "Connecting..." banner. SWR retries automatically |
| No sensor data yet | API returns 404 | Show "Waiting for device..." placeholder |
| Command sent but not acked after 10 s | Poll command status | Show "Pending..." → "Timeout" on the toggle |

### 7.4 Retry Summary

```
ESP32 HTTP cycle:
  ┌─ Read sensors (every 2 s, non-blocking)
  ├─ Update OLED (every 2 s)
  ├─ Check buttons (every 100 ms, debounced)
  ├─ Run auto-threshold (every 2 s)
  └─ If Wi-Fi connected:
       ├─ POST /api/sensor-data (every 5 s, timeout 3 s)
       ├─ GET /api/commands (every 5 s, timeout 3 s)
       └─ POST /api/commands/ack (if any ACKs pending, timeout 3 s)
       On failure: log, skip, retry next cycle. NEVER block.
```

---

## 8. OLED Display Layout

The SSD1306 128×64 OLED with the default Adafruit font (6×8 pixels) gives **21 characters × 8 lines**.

### 8.1 Normal Mode (4 main info lines + status)

```
┌──────────────────────┐
│ Temp: 25.5°C   H:62% │  Line 0: Temperature + Humidity
│ Air: ████████  GOOD   │  Line 1: Air quality bar + level
│ Fan: ON    Auto: ON   │  Line 2: Relay state + auto mode
│ Wi-Fi: OK   ↑35m      │  Line 3: Wi-Fi status + uptime
│                        │  Line 4-7: Reserved for messages
│ > Fan ON (voice)       │  Line 5: Last command received
│                        │
│ desk-station v1.0      │  Line 7: Footer
└──────────────────────┘
```

### 8.2 Pomodoro Mode (SHOULD tier)

```
┌──────────────────────┐
│ 🍅 POMODORO           │
│                        │
│     18:42              │  Large countdown
│     WORK               │  "WORK" or "BREAK"
│                        │
│ T:25.5  H:62  Air:OK  │  Compact sensor line
│ Fan: ON                │
│ [BTN2 to cancel]       │
└──────────────────────┘
```

---

## 9. Firmware Architecture (Non-Blocking)

The ESP32 firmware uses a **non-blocking** architecture. This means **no `delay()` calls** in the main loop. Instead, we use `millis()` to check if enough time has passed for each task.

### 9.1 Why Non-Blocking?

If you write `delay(5000)` to wait 5 seconds between HTTP calls, the ESP32 **cannot do anything else** during that time — it won't read buttons, update the OLED, or check sensors. Non-blocking timing lets the ESP32 do many things "at the same time" by quickly cycling through tasks.

### 9.2 Main Loop Pseudocode

```cpp
// desk-station.ino

#include "config.h"
#include "sensors.h"
#include "display.h"
#include "network.h"
#include "relay.h"
#include "commands.h"

// Timing variables (non-blocking)
unsigned long lastSensorRead = 0;
unsigned long lastHttpCycle = 0;
unsigned long lastButtonCheck = 0;

void setup() {
    Serial.begin(115200);
    setupPins();        // config.h pin modes
    setupDisplay();     // I2C OLED init
    setupSensors();     // DHT begin
    setupRelay();       // Relay pin LOW
    connectWiFi();      // Non-blocking: tries for 10s, then gives up and continues offline
    Serial.println("Desk Station ready.");
}

void loop() {
    unsigned long now = millis();

    // Task 1: Read sensors every 2 seconds
    if (now - lastSensorRead >= 2000) {
        lastSensorRead = now;
        readSensors();           // Updates global sensorData struct
        updateDisplay();         // Refreshes OLED with new data
        runAutoThreshold();      // Check temp → toggle relay if auto mode
    }

    // Task 2: Check buttons every 100 ms
    if (now - lastButtonCheck >= 100) {
        lastButtonCheck = now;
        checkButtons();          // Debounced button reads
    }

    // Task 3: HTTP cycle every 5 seconds (only if Wi-Fi connected)
    if (WiFi.status() == WL_CONNECTED && now - lastHttpCycle >= 5000) {
        lastHttpCycle = now;
        postSensorData();        // POST to /api/sensor-data
        pollCommands();          // GET from /api/commands → execute
    }

    // Task 4: Try Wi-Fi reconnect every 10 seconds if disconnected
    if (WiFi.status() != WL_CONNECTED && now - lastWiFiAttempt >= 10000) {
        lastWiFiAttempt = now;
        connectWiFi();
    }

    // Task 5: Update Pomodoro timer (if running) — SHOULD tier
    updatePomodoro(now);
}
```

### 9.3 Sensor Data Struct

```cpp
// sensors.h
struct SensorData {
    float temperature;       // Celsius
    float humidity;          // Percent
    int airQualityRaw;       // ADC value 0-3723
    String airQualityLevel;  // "good", "moderate", "poor"
    bool relayState;         // true = ON
    bool autoMode;           // true = auto-threshold active
    bool sensorError;        // true if DHT returned NaN
};

extern SensorData sensorData;  // Global, updated by readSensors()
```

### 9.4 HTTP POST Skeleton

```cpp
// network.cpp
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "sensors.h"

void postSensorData() {
    HTTPClient http;
    http.begin(String(BACKEND_URL) + "/api/sensor-data");
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", API_KEY);
    http.setTimeout(3000);  // 3 second timeout

    // Build JSON
    JsonDocument doc;
    doc["device_id"] = DEVICE_ID;
    doc["timestamp"] = millis() / 1000;
    doc["sensors"]["temperature"] = sensorData.temperature;
    doc["sensors"]["humidity"] = sensorData.humidity;
    doc["sensors"]["air_quality_raw"] = sensorData.airQualityRaw;
    doc["sensors"]["air_quality_level"] = sensorData.airQualityLevel;
    doc["relay_state"] = sensorData.relayState;
    doc["auto_mode"] = sensorData.autoMode;
    doc["uptime_s"] = millis() / 1000;

    String body;
    serializeJson(doc, body);

    int code = http.POST(body);
    if (code == 201) {
        Serial.println("Sensor data sent OK");
    } else {
        Serial.printf("POST failed: %d\n", code);
    }
    http.end();
}
```

### 9.5 Command Polling Skeleton

```cpp
// commands.cpp
void pollCommands() {
    HTTPClient http;
    String url = String(BACKEND_URL) + "/api/commands?device_id=" + DEVICE_ID;
    http.begin(url);
    http.addHeader("X-API-Key", API_KEY);
    http.setTimeout(3000);

    int code = http.GET();
    if (code == 200) {
        String payload = http.getString();
        JsonDocument doc;
        DeserializationError err = deserializeJson(doc, payload);
        if (err) {
            Serial.printf("JSON parse error: %s\n", err.c_str());
            http.end();
            return;
        }

        JsonArray cmds = doc["commands"].as<JsonArray>();
        for (JsonObject cmd : cmds) {
            String id = cmd["id"].as<String>();
            String action = cmd["action"].as<String>();
            JsonObject params = cmd["params"].as<JsonObject>();

            executeCommand(action, params);  // Handle each action
            ackList.add(id);                 // Queue for ACK
        }

        if (ackList.size() > 0) {
            sendAcks();  // POST to /api/commands/ack
        }
    } else {
        Serial.printf("GET commands failed: %d\n", code);
    }
    http.end();
}

void executeCommand(String action, JsonObject params) {
    if (action == "set_relay") {
        bool state = params["state"].as<bool>();
        setRelay(state);
        sensorData.autoMode = false;  // Manual override disables auto
        Serial.printf("Relay set to %s (remote)\n", state ? "ON" : "OFF");
    }
    else if (action == "set_auto_mode") {
        sensorData.autoMode = params["enabled"].as<bool>();
    }
    // ... more actions ...
    else {
        Serial.printf("Unknown action: %s (ignored)\n", action.c_str());
    }
}
```

### 9.6 config.h Template

```cpp
// config.h — Pin definitions and configuration
// This file is the firmware's source of truth for pin assignments.
// Keep in sync with hardware/pin-map.md

#ifndef CONFIG_H
#define CONFIG_H

// === Wi-Fi ===
#define WIFI_SSID     "your-wifi-ssid"      // Change before flashing!
#define WIFI_PASSWORD "your-wifi-password"   // Change before flashing!

// === Backend ===
#define BACKEND_URL   "https://your-app.up.railway.app"  // Railway URL
// #define BACKEND_URL   "http://192.168.1.100:3001"     // Local dev
#define API_KEY       "desk-station-secret-key-2026"
#define DEVICE_ID     "desk-station-01"

// === Pins ===
#define PIN_DHT22     4
#define PIN_MQ135     34    // ADC1 only!
#define PIN_OLED_SDA  21
#define PIN_OLED_SCL  22
#define PIN_RELAY     26
#define PIN_RGB_R     16
#define PIN_RGB_G     17
#define PIN_RGB_B     18
#define PIN_BUZZER    25
#define PIN_BTN1      13    // Relay toggle
#define PIN_BTN2      14    // Mode button
#define PIN_LED_WIFI  2     // Built-in LED

// === Sensor Thresholds ===
#define TEMP_ON_THRESHOLD   30.0   // Auto: relay ON above this
#define TEMP_OFF_THRESHOLD  28.0   // Auto: relay OFF below this
#define AQ_GOOD_MAX         1200   // ADC below = "good"
#define AQ_MODERATE_MAX     2200   // ADC below = "moderate", above = "poor"

// === Timing (ms) ===
#define SENSOR_INTERVAL     2000   // Read sensors every 2 s
#define HTTP_INTERVAL       5000   // HTTP cycle every 5 s
#define BUTTON_INTERVAL     100    // Button poll every 100 ms
#define WIFI_RETRY_INTERVAL 10000  // Wi-Fi reconnect every 10 s
#define HTTP_TIMEOUT        3000   // HTTP request timeout

// === Button Debounce ===
#define DEBOUNCE_MS         50

#endif
```

---

## 10. Express Backend Skeleton

### 10.1 Vapi Webhook Handler

```javascript
// routes/vapi.js
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

router.post('/webhook', async (req, res) => {
    try {
        // [VERIFY] Exact Vapi payload structure — log req.body during development
        const { message } = req.body;

        if (message?.type !== 'tool-calls') {
            return res.json({ results: [] });
        }

        const results = [];

        for (const toolCall of message.toolCalls) {
            const { id, function: fn } = toolCall;
            const name = fn.name;
            const args = JSON.parse(fn.arguments || '{}');

            let result;

            switch (name) {
                case 'get_sensor_data': {
                    const latest = await prisma.sensorReading.findFirst({
                        where: { deviceId: 'desk-station-01' },
                        orderBy: { createdAt: 'desc' },
                    });
                    if (latest) {
                        result = {
                            temperature: latest.temperature,
                            humidity: latest.humidity,
                            air_quality: latest.airQualityLevel,
                            relay_state: latest.relayState ? 'on' : 'off',
                            auto_mode: latest.autoMode ? 'on' : 'off',
                        };
                    } else {
                        result = { error: 'No sensor data available yet.' };
                    }
                    break;
                }

                case 'set_relay': {
                    await prisma.command.create({
                        data: {
                            deviceId: 'desk-station-01',
                            action: 'set_relay',
                            params: { state: args.state },
                            source: 'vapi',
                        },
                    });
                    result = {
                        success: true,
                        message: `Fan has been turned ${args.state ? 'on' : 'off'}.`,
                    };
                    break;
                }

                case 'set_auto_mode': {
                    await prisma.command.create({
                        data: {
                            deviceId: 'desk-station-01',
                            action: 'set_auto_mode',
                            params: { enabled: args.enabled },
                            source: 'vapi',
                        },
                    });
                    result = {
                        success: true,
                        message: `Auto mode has been ${args.enabled ? 'enabled' : 'disabled'}.`,
                    };
                    break;
                }

                case 'add_todo': {
                    const item = await prisma.todoItem.create({
                        data: { text: args.text },
                    });
                    result = {
                        success: true,
                        message: `Added "${args.text}" to your to-do list.`,
                    };
                    break;
                }

                case 'get_todos': {
                    const items = await prisma.todoItem.findMany({
                        where: { completed: false },
                        orderBy: { createdAt: 'desc' },
                    });
                    if (items.length === 0) {
                        result = { message: 'Your to-do list is empty.' };
                    } else {
                        const list = items.map((i, idx) => `${idx + 1}. ${i.text}`).join(', ');
                        result = { message: `You have ${items.length} items: ${list}` };
                    }
                    break;
                }

                case 'start_pomodoro': {
                    await prisma.command.create({
                        data: {
                            deviceId: 'desk-station-01',
                            action: 'start_pomodoro',
                            params: {
                                work_min: args.work_minutes || 25,
                                break_min: args.break_minutes || 5,
                            },
                            source: 'vapi',
                        },
                    });
                    result = {
                        success: true,
                        message: `Pomodoro timer started: ${args.work_minutes || 25} minutes work.`,
                    };
                    break;
                }

                default:
                    result = { error: `Unknown tool: ${name}` };
            }

            results.push({
                toolCallId: id,
                result: JSON.stringify(result),
            });
        }

        res.json({ results });
    } catch (error) {
        console.error('Vapi webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
```

---

## 11. Dashboard Polling (SWR)

```typescript
// dashboard/src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'desk-station-secret-key-2026';

export async function fetchAPI(path: string, options?: RequestInit) {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY,
            ...options?.headers,
        },
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}
```

```tsx
// dashboard/src/components/SensorGauge.tsx
'use client';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';

export default function SensorGauge() {
    // SWR polls every 3 seconds automatically
    const { data, error, isLoading } = useSWR(
        '/api/dashboard/current',
        fetchAPI,
        { refreshInterval: 3000 }
    );

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Connecting to device...</div>;

    return (
        <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg shadow">
                <h3 className="text-sm text-gray-500">Temperature</h3>
                <p className="text-3xl font-bold">{data.temperature}°C</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
                <h3 className="text-sm text-gray-500">Humidity</h3>
                <p className="text-3xl font-bold">{data.humidity}%</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
                <h3 className="text-sm text-gray-500">Air Quality</h3>
                <p className="text-3xl font-bold">{data.airQualityLevel}</p>
            </div>
        </div>
    );
}
```

