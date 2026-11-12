# Module M3 — Firmware: Wi-Fi, HTTP, Relay, Local Automation

> **Owner:** Firmware Lead (B) · **Backup:** Integration Lead (D)

---

## 1. Purpose

Connect the ESP32 to Wi-Fi, POST sensor data to the Express backend every 5 seconds, poll for pending commands and execute them (relay toggle, mode changes), implement physical button handling with debounce, and run local automation (temperature-based auto-threshold with hysteresis). The firmware must work **offline** — sensors, OLED, buttons, and auto-threshold continue without Wi-Fi.

---

## 2. Inputs & Outputs

| Direction | What | From/To |
|-----------|------|---------|
| **Input** | `SensorData` struct from M2 | ← M2 (sensors.cpp) |
| **Input** | Pending commands JSON from backend | ← M4 (Express API) |
| **Input** | Button presses (GPIO13, GPIO14) | ← Physical buttons |
| **Output** | HTTP POST sensor data to backend | → M4 |
| **Output** | HTTP POST command ACKs to backend | → M4 |
| **Output** | Relay GPIO26 state changes | → Physical relay → fan |
| **Output** | OLED status line updates | → M2 (display.cpp) |

---

## 3. Dependencies & Stubs

| Dependency | Blocking? | Workaround |
|-----------|-----------|------------|
| M2 (Sensors + OLED) | Yes, need SensorData struct | Can develop HTTP code with dummy hardcoded sensor values first |
| M1 (Relay wired) | Need relay to test | Can test HTTP without relay. Use Serial.println("RELAY ON") as placeholder |
| M4 (Backend running) | No | Use **fake-backend.py** from M0 — a Flask server that accepts POSTs and returns test commands |

### Using fake-backend.py

The Integration Lead provides `fake-backend.py` (from M0). It runs on any team member's laptop:

```bash
pip install flask
python tools/mocks/fake-backend.py
# Runs on http://localhost:3001
# POST /api/sensor-data → prints received data, returns 201
# GET  /api/commands?device_id=desk-station-01 → returns a test command
```

The Firmware Lead points the ESP32 at the laptop's local IP (e.g., `http://192.168.1.100:3001`). Both must be on the same Wi-Fi network.

---

## 4. Task List

| # | Task | Hours | Done When |
|---|------|-------|-----------|
| 1 | Wi-Fi connect exercise: connect to phone hotspot, print IP | 0.5 | IP address printed to Serial |
| 2 | HTTP POST exercise: POST JSON to fake-backend, get 201 | 1.0 | Fake-backend prints received data |
| 3 | HTTP GET exercise: GET from fake-backend, parse JSON commands | 1.0 | Command action printed to Serial |
| 4 | Integrate HTTP with M2: POST real sensor data from struct | 1.0 | Fake-backend receives real temperature/humidity values |
| 5 | Relay toggle function: `setRelay(bool state)` | 0.5 | GPIO26 toggles, relay clicks |
| 6 | Command execution: parse action from GET, call setRelay | 0.75 | Send `set_relay` from fake-backend, relay clicks |
| 7 | Command ACK: POST ack list after executing commands | 0.5 | Fake-backend receives ACK with command IDs |
| 8 | Button debounce: detect button press with 50 ms debounce using millis() | 1.0 | Single press = single toggle. No bouncing |
| 9 | Auto-threshold: if autoMode && temp > 30 → relay ON; temp < 28 → relay OFF | 0.75 | Warm sensor with hand → relay clicks ON. Cool down → relay clicks OFF |
| 10 | Manual override: button press or remote command sets autoMode = false | 0.5 | After button press, auto-threshold stops until re-enabled |
| 11 | Offline detection: if Wi-Fi drops, continue local operation, retry every 10 s | 0.5 | Disconnect Wi-Fi → OLED shows "OFFLINE", sensors + buttons work. Reconnect → resumes |
| 12 | Non-blocking main loop: integrate everything with millis() timing | 1.0 | No delay() calls. All tasks run concurrently |
| 13 | Test with real backend (M4) once available | 1.0 | Data appears in dashboard, commands from dashboard toggle relay |
| | **Total** | **~10 h** | |

---

## 5. Files & Folder Locations

```
firmware/desk-station/
├── desk-station.ino       # Main loop (integrates M2 + M3)
├── config.h               # All configuration (already in M2)
├── sensors.h / .cpp       # From M2
├── display.h / .cpp       # From M2
├── network.h / network.cpp  # Wi-Fi + HTTP POST/GET (this module)
├── relay.h / relay.cpp      # Relay control + auto-threshold (this module)
└── commands.h / commands.cpp # Command parsing + execution (this module)
```

---

## 6. Key Code

### 6.1 network.h / network.cpp

```cpp
// network.h
#ifndef NETWORK_H
#define NETWORK_H

void connectWiFi();
void postSensorData();
void pollCommands();
bool isWiFiConnected();

#endif
```

```cpp
// network.cpp
#include "network.h"
#include "config.h"
#include "sensors.h"
#include "commands.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

unsigned long lastWiFiAttempt = 0;

void connectWiFi() {
    Serial.printf("Connecting to Wi-Fi: %s", WIFI_SSID);
    WiFi.mode(WIFI_STA);  // Station mode (client)
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    // Wait up to 10 seconds (non-blocking alternative: check in loop)
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);  // OK here — only during setup
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\nConnected! IP: %s\n", WiFi.localIP().toString().c_str());
        digitalWrite(PIN_LED_WIFI, HIGH);  // Built-in LED = connected
    } else {
        Serial.println("\nWi-Fi failed. Running in offline mode.");
        digitalWrite(PIN_LED_WIFI, LOW);
    }
}

bool isWiFiConnected() {
    return WiFi.status() == WL_CONNECTED;
}

void postSensorData() {
    if (!isWiFiConnected()) return;

    HTTPClient http;
    http.begin(String(BACKEND_URL) + "/api/sensor-data");
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", API_KEY);
    http.setTimeout(HTTP_TIMEOUT);

    // Build JSON payload matching the contract in 01-interface-contracts.md §3.1
    JsonDocument doc;
    doc["device_id"] = DEVICE_ID;
    doc["timestamp"] = millis() / 1000;
    doc["sensors"]["temperature"] = sensorData.temperature;
    doc["sensors"]["humidity"] = sensorData.humidity;
    doc["sensors"]["air_quality_raw"] = sensorData.airQualityRaw;
    doc["sensors"]["air_quality_level"] = sensorData.airQualityLevel;
    doc["relay_state"] = sensorData.relayState;
    doc["auto_mode"] = sensorData.autoMode;
    doc["wifi_rssi"] = WiFi.RSSI();
    doc["uptime_s"] = millis() / 1000;

    String body;
    serializeJson(doc, body);

    int code = http.POST(body);
    if (code == 201) {
        Serial.println("[HTTP] Sensor data sent OK");
    } else {
        Serial.printf("[HTTP] POST failed: %d\n", code);
    }
    http.end();
}

void pollCommands() {
    if (!isWiFiConnected()) return;

    HTTPClient http;
    String url = String(BACKEND_URL) + "/api/commands?device_id=" + DEVICE_ID;
    http.begin(url);
    http.addHeader("X-API-Key", API_KEY);
    http.setTimeout(HTTP_TIMEOUT);

    int code = http.GET();
    if (code == 200) {
        String payload = http.getString();
        JsonDocument doc;
        DeserializationError err = deserializeJson(doc, payload);
        if (err) {
            Serial.printf("[HTTP] JSON parse error: %s\n", err.c_str());
            http.end();
            return;
        }

        JsonArray cmds = doc["commands"].as<JsonArray>();
        String ackIds = "";

        for (JsonObject cmd : cmds) {
            String id = cmd["id"].as<String>();
            String action = cmd["action"].as<String>();
            JsonObject params = cmd["params"].as<JsonObject>();

            executeCommand(action, params);

            // Build ACK list
            if (ackIds.length() > 0) ackIds += ",";
            ackIds += "\"" + id + "\"";
        }

        // Send ACKs if any commands were processed
        if (cmds.size() > 0) {
            sendAcks(ackIds);
        }
    } else if (code > 0) {
        Serial.printf("[HTTP] GET commands: %d\n", code);
    } else {
        Serial.printf("[HTTP] GET failed: %s\n", http.errorToString(code).c_str());
    }
    http.end();
}

void sendAcks(String ackIds) {
    HTTPClient http;
    http.begin(String(BACKEND_URL) + "/api/commands/ack");
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", API_KEY);
    http.setTimeout(HTTP_TIMEOUT);

    String body = "{\"device_id\":\"" + String(DEVICE_ID) + "\",\"acked\":[" + ackIds + "]}";
    int code = http.POST(body);
    if (code == 200) {
        Serial.printf("[HTTP] ACKed commands\n");
    }
    http.end();
}
```

### 6.2 relay.h / relay.cpp

```cpp
// relay.h
#ifndef RELAY_H
#define RELAY_H

void setupRelay();
void setRelay(bool state);
void toggleRelay();
void runAutoThreshold();
void checkButtons();

#endif
```

```cpp
// relay.cpp
#include "relay.h"
#include "config.h"
#include "sensors.h"
#include "display.h"

// Button debounce state
unsigned long lastBtn1Press = 0;
unsigned long lastBtn2Press = 0;
bool lastBtn1State = HIGH;
bool lastBtn2State = HIGH;

void setupRelay() {
    pinMode(PIN_RELAY, OUTPUT);
    digitalWrite(PIN_RELAY, HIGH);  // HIGH = relay OFF (active LOW module)
    // [VERIFY] Your relay module logic. Some are active HIGH.

    pinMode(PIN_BTN1, INPUT_PULLUP);  // Internal pull-up: reads HIGH when not pressed
    pinMode(PIN_BTN2, INPUT_PULLUP);

    sensorData.relayState = false;
    sensorData.autoMode = true;
}

void setRelay(bool state) {
    sensorData.relayState = state;
    // Active LOW relay: LOW = ON, HIGH = OFF
    digitalWrite(PIN_RELAY, state ? LOW : HIGH);
    Serial.printf("[RELAY] Set to %s\n", state ? "ON" : "OFF");
    displayMessage(5, state ? "> Fan ON" : "> Fan OFF");
}

void toggleRelay() {
    setRelay(!sensorData.relayState);
}

void runAutoThreshold() {
    // Only run if auto mode is enabled
    if (!sensorData.autoMode) return;
    if (sensorData.sensorError) return;  // Don't auto-switch on bad data

    // Hysteresis: ON above 30°C, OFF below 28°C
    // This 2°C gap prevents rapid on-off-on-off oscillation
    if (sensorData.temperature > TEMP_ON_THRESHOLD && !sensorData.relayState) {
        setRelay(true);
        displayMessage(5, "> Auto: Fan ON");
        Serial.println("[AUTO] Temp high → relay ON");
    } else if (sensorData.temperature < TEMP_OFF_THRESHOLD && sensorData.relayState) {
        setRelay(false);
        displayMessage(5, "> Auto: Fan OFF");
        Serial.println("[AUTO] Temp low → relay OFF");
    }
}

void checkButtons() {
    unsigned long now = millis();

    // --- Button 1: Toggle relay ---
    bool btn1 = digitalRead(PIN_BTN1);
    if (btn1 == LOW && lastBtn1State == HIGH && (now - lastBtn1Press > DEBOUNCE_MS)) {
        // Button just pressed (falling edge, debounced)
        lastBtn1Press = now;
        toggleRelay();
        sensorData.autoMode = false;  // Manual override disables auto
        Serial.println("[BTN] Button 1 pressed → relay toggled, auto OFF");
    }
    lastBtn1State = btn1;

    // --- Button 2: Toggle auto mode ---
    bool btn2 = digitalRead(PIN_BTN2);
    if (btn2 == LOW && lastBtn2State == HIGH && (now - lastBtn2Press > DEBOUNCE_MS)) {
        lastBtn2Press = now;
        sensorData.autoMode = !sensorData.autoMode;
        displayMessage(5, sensorData.autoMode ? "> Auto: ON" : "> Auto: OFF");
        Serial.printf("[BTN] Button 2 → auto mode %s\n", sensorData.autoMode ? "ON" : "OFF");
    }
    lastBtn2State = btn2;
}
```

### 6.3 commands.h / commands.cpp

```cpp
// commands.h
#ifndef COMMANDS_H
#define COMMANDS_H

#include <ArduinoJson.h>

void executeCommand(String action, JsonObject params);

#endif
```

```cpp
// commands.cpp
#include "commands.h"
#include "relay.h"
#include "sensors.h"
#include "display.h"
#include "config.h"

void executeCommand(String action, JsonObject params) {
    Serial.printf("[CMD] Executing: %s\n", action.c_str());

    if (action == "set_relay") {
        bool state = params["state"].as<bool>();
        setRelay(state);
        sensorData.autoMode = false;  // Remote command disables auto
    }
    else if (action == "set_auto_mode") {
        sensorData.autoMode = params["enabled"].as<bool>();
        displayMessage(5, sensorData.autoMode ? "> Auto: ON (remote)" : "> Auto: OFF (remote)");
    }
    else if (action == "set_threshold") {
        // SHOULD tier: change threshold dynamically
        // For now, thresholds are compile-time constants in config.h
        Serial.println("[CMD] set_threshold not yet implemented");
    }
    else if (action == "set_rgb") {
        // SHOULD tier: implemented in M7
        int r = params["r"] | 0;
        int g = params["g"] | 0;
        int b = params["b"] | 0;
        analogWrite(PIN_RGB_R, r);
        analogWrite(PIN_RGB_G, g);
        analogWrite(PIN_RGB_B, b);
    }
    else if (action == "buzz") {
        int duration = params["duration_ms"] | 500;
        int count = params["count"] | 1;
        for (int i = 0; i < count; i++) {
            digitalWrite(PIN_BUZZER, HIGH);
            delay(duration);  // OK for short buzzer — consider non-blocking for production
            digitalWrite(PIN_BUZZER, LOW);
            if (i < count - 1) delay(200);
        }
    }
    else if (action == "display_message") {
        int line = params["line"] | 5;
        const char* text = params["text"] | "...";
        displayMessage(line, text);
    }
    else if (action == "start_pomodoro") {
        // SHOULD tier: implemented in M7
        Serial.println("[CMD] start_pomodoro → handled by extras module");
    }
    else {
        Serial.printf("[CMD] Unknown action: %s (ignored)\n", action.c_str());
    }
}
```

### 6.4 Main Sketch (desk-station.ino)

```cpp
// desk-station.ino — Main entry point
// Integrates M2 (sensors + OLED) and M3 (Wi-Fi + HTTP + relay)

#include "config.h"
#include "sensors.h"
#include "display.h"
#include "network.h"
#include "relay.h"
#include "commands.h"

// Non-blocking timing
unsigned long lastSensorRead = 0;
unsigned long lastHttpCycle = 0;
unsigned long lastButtonCheck = 0;
unsigned long lastWiFiRetry = 0;

void setup() {
    Serial.begin(115200);
    Serial.println("\n=== Desk Station v1.0 ===");

    // Pin setup
    pinMode(PIN_LED_WIFI, OUTPUT);
    digitalWrite(PIN_LED_WIFI, LOW);

    // Initialize modules
    setupSensors();
    setupDisplay();
    setupRelay();

    // Connect Wi-Fi (blocking for up to 10s during setup is OK)
    connectWiFi();

    Serial.println("Setup complete. Entering main loop.");
}

void loop() {
    unsigned long now = millis();

    // --- Every 100 ms: check buttons ---
    if (now - lastButtonCheck >= BUTTON_INTERVAL) {
        lastButtonCheck = now;
        checkButtons();
    }

    // --- Every 2 s: read sensors + update OLED + auto-threshold ---
    if (now - lastSensorRead >= SENSOR_INTERVAL) {
        lastSensorRead = now;
        readSensors();
        updateDisplay();
        runAutoThreshold();
    }

    // --- Every 5 s: HTTP POST + GET (only if Wi-Fi connected) ---
    if (isWiFiConnected() && now - lastHttpCycle >= HTTP_INTERVAL) {
        lastHttpCycle = now;
        postSensorData();
        pollCommands();
    }

    // --- Every 10 s: retry Wi-Fi if disconnected ---
    if (!isWiFiConnected() && now - lastWiFiRetry >= WIFI_RETRY_INTERVAL) {
        lastWiFiRetry = now;
        Serial.println("[WIFI] Attempting reconnect...");
        WiFi.reconnect();
    }
}
```

---

## 7. Acceptance Test

| Step | Action | Expected | Pass? |
|------|--------|----------|-------|
| 1 | Flash firmware, open Serial Monitor at 115200 | Shows "Desk Station v1.0", connects to Wi-Fi, prints IP | ☐ |
| 2 | Start fake-backend.py on laptop. Set ESP32 BACKEND_URL to laptop IP | Fake-backend prints received sensor JSON every 5 s | ☐ |
| 3 | Modify fake-backend to return a `set_relay` command | Relay clicks within 5 s. Serial prints "[CMD] Executing: set_relay" | ☐ |
| 4 | Press Button 1 | Relay toggles. Serial prints "[BTN] Button 1". Auto mode set to OFF | ☐ |
| 5 | Press Button 2 | Auto mode toggles. OLED shows "Auto: ON" or "Auto: OFF" | ☐ |
| 6 | Warm DHT22 past 30°C (auto mode ON) | Relay turns ON automatically. OLED shows "Auto: Fan ON" | ☐ |
| 7 | Cool DHT22 below 28°C | Relay turns OFF automatically | ☐ |
| 8 | Turn off Wi-Fi on phone hotspot | OLED shows "WiFi: OFFLINE". Sensors + OLED + buttons still work | ☐ |
| 9 | Turn Wi-Fi back on | ESP32 reconnects within 10-20 s. Data posts resume | ☐ |
| 10 | Run for 30 minutes | No crash. `ESP.getFreeHeap()` stable (not decreasing) | ☐ |

---

## 8. Top Risks & Fallbacks

| Risk | Likelihood | Mitigation | Fallback |
|------|-----------|------------|----------|
| Wi-Fi won't connect to venue network | High | Use phone hotspot (known SSID). Test at home first | Demo offline mode only |
| HTTP POST blocks the loop | Medium | Set `http.setTimeout(3000)`. Never use `delay()` for waiting | If HTTP hangs, the 3 s timeout saves the loop |
| Relay clicks on boot (nuisance) | Medium | Set GPIO26 HIGH in `setup()` before `connectWiFi()` | Not harmful, just annoying |
| `millis()` overflow (every ~49 days) | Very Low | Use `unsigned long` and subtraction pattern — handles overflow correctly | Won't happen in a 3-week project |
| Backend rejects sensor data (400) | Medium | Validate JSON matches contract exactly. Log response body on error | Check Serial output. Fix JSON format |
| Free heap decreases over time (memory leak) | Low | Don't use `String` concatenation in tight loops. Print `ESP.getFreeHeap()` periodically | Restart ESP32 between demo runs if needed |

