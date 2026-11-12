# Module M2 — Firmware: Sensors + OLED

> **Owner:** Firmware Lead (B) · **Backup:** Hardware Lead (C)

---

## 1. Purpose

Read the DHT22 (temperature + humidity) and MQ-135 (air quality via ADC), classify air quality into levels, and display all readings live on the OLED — refreshing every 2 seconds. This module runs entirely offline with **no Wi-Fi required**. It is the visual centrepiece of the project: judges will look at the OLED first.

---

## 2. Inputs & Outputs

| Direction | What | From/To |
|-----------|------|---------|
| **Input** | Wired hardware assembly | ← M1 (Hardware) |
| **Input** | Pin map and thresholds from `config.h` | ← Interface contracts |
| **Output** | `SensorData` struct, updated every 2 s | → M3 (HTTP posting, auto-threshold) |
| **Output** | OLED showing live readings | → Demo (visual proof) |

---

## 3. Dependencies & Stubs

| Dependency | Blocking? | Workaround |
|-----------|-----------|------------|
| M1 (Hardware wired) | Partially — need at least ESP32 + DHT22 + OLED on breadboard | Start with just ESP32 + DHT22 on breadboard (3 wires). Add OLED next. Add MQ-135 last |
| M0 (Repo) | No — can work locally first | Create a local Arduino sketch. Push to repo later |

**Stub for other modules:** This module produces a standalone sketch (`test-sensors-oled.ino`) that other team members can flash to verify their hardware is working.

---

## 4. Task List

| # | Task | Hours | Done When |
|---|------|-------|-----------|
| 1 | Install Arduino IDE 2.x + ESP32 board support | 0.75 | Board "ESP32 Dev Module" appears in board selector. Empty sketch uploads and Serial Monitor shows no crash |
| 2 | Blink LED exercise (GPIO2) | 0.25 | Built-in LED blinks every 500 ms |
| 3 | Install libraries: `Adafruit DHT sensor library`, `Adafruit Unified Sensor`, `Adafruit SSD1306`, `Adafruit GFX`, `ArduinoJson` | 0.25 | All five appear in Library Manager as "Installed" |
| 4 | Read DHT22 to Serial Monitor | 1.0 | Serial prints temperature and humidity every 2 s. Values are plausible (not NaN) |
| 5 | Add NaN error handling | 0.25 | If DHT returns NaN, Serial prints "Sensor error" and last-known-good values are used |
| 6 | Read MQ-135 ADC to Serial Monitor | 0.75 | `analogRead(34)` prints values. Values change when breathing on sensor |
| 7 | Add air quality classification | 0.5 | Serial prints "good", "moderate", or "poor" based on thresholds |
| 8 | Initialize OLED, display "Hello World" | 0.5 | Text visible on OLED screen |
| 9 | Build OLED display layout: 4 info lines | 1.5 | OLED shows temp, humidity, air quality level, and status line |
| 10 | Combine everything: sensors → struct → OLED, non-blocking with `millis()` | 1.5 | OLED refreshes every 2 s with live sensor data. No `delay()` in code |
| 11 | Test edge cases: unplug DHT22 → OLED shows "?", blow on MQ-135 → level changes | 0.5 | Graceful degradation, no crash |
| | **Total** | **~7.75 h** | |

---

## 5. Files & Folder Locations

```
firmware/
├── desk-station/
│   ├── desk-station.ino      # Main sketch (M2 + M3 combined later)
│   ├── config.h               # Pin definitions, thresholds
│   ├── sensors.h              # SensorData struct + readSensors()
│   ├── sensors.cpp            # Sensor reading implementation
│   ├── display.h              # OLED functions
│   └── display.cpp            # OLED drawing implementation
└── tests/
    └── test-sensors-oled/
        └── test-sensors-oled.ino  # Standalone test sketch (M2 only)
```

---

## 6. Key Code

### 6.1 Arduino IDE Setup Steps

```
1. Download Arduino IDE 2.x from https://www.arduino.cc/en/software
2. Open Arduino IDE
3. File → Preferences → Additional Board Manager URLs:
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
4. Tools → Board → Board Manager → Search "esp32" → Install "esp32 by Espressif Systems"
5. Tools → Board → ESP32 Arduino → "ESP32 Dev Module"
6. Plug ESP32 via USB. Tools → Port → select the COM port that appears
   - Windows: COM3, COM4, etc.
   - Mac: /dev/cu.usbserial-*
   - Linux: /dev/ttyUSB0
7. If no port appears: install CP2102 or CH340 USB driver [VERIFY which chip your board uses]
   - CP2102: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers
   - CH340: https://sparks.gogo.co.nz/ch340.html
8. Tools → Upload Speed → 115200
9. Sketch → Upload (Ctrl+U)
```

### 6.2 Library Installation

```
Sketch → Include Library → Manage Libraries (Ctrl+Shift+I)
Search and install:
  1. "DHT sensor library" by Adafruit (installs "Adafruit Unified Sensor" as dependency)
  2. "Adafruit SSD1306" by Adafruit (installs "Adafruit GFX Library" as dependency)
  3. "ArduinoJson" by Benoît Blanchon (choose v7.x)
```

### 6.3 sensors.h

```cpp
#ifndef SENSORS_H
#define SENSORS_H

#include <Arduino.h>

struct SensorData {
    float temperature;        // Celsius, 1 decimal
    float humidity;           // Percent, 1 decimal
    int   airQualityRaw;      // ADC value 0–4095
    String airQualityLevel;   // "good", "moderate", "poor"
    bool  relayState;         // true = ON
    bool  autoMode;           // true = auto-threshold active
    bool  sensorError;        // true = DHT22 returned NaN this cycle
};

extern SensorData sensorData;

void setupSensors();
void readSensors();

#endif
```

### 6.4 sensors.cpp

```cpp
#include "sensors.h"
#include "config.h"
#include <DHT.h>

DHT dht(PIN_DHT22, DHT22);
SensorData sensorData;

// Store last known good values for error recovery
float lastGoodTemp = 25.0;
float lastGoodHum  = 50.0;

void setupSensors() {
    dht.begin();
    pinMode(PIN_MQ135, INPUT);  // GPIO34 is input-only anyway
    // Initialize with safe defaults
    sensorData.temperature = 25.0;
    sensorData.humidity = 50.0;
    sensorData.airQualityRaw = 0;
    sensorData.airQualityLevel = "good";
    sensorData.relayState = false;
    sensorData.autoMode = true;
    sensorData.sensorError = false;
}

void readSensors() {
    // --- DHT22 ---
    float t = dht.readTemperature();   // Celsius
    float h = dht.readHumidity();      // Percent

    if (isnan(t) || isnan(h)) {
        // Sensor error! Use last known good values
        sensorData.sensorError = true;
        sensorData.temperature = lastGoodTemp;
        sensorData.humidity = lastGoodHum;
        Serial.println("WARNING: DHT22 returned NaN, using last good values");
    } else {
        sensorData.sensorError = false;
        sensorData.temperature = t;
        sensorData.humidity = h;
        lastGoodTemp = t;
        lastGoodHum = h;
    }

    // --- MQ-135 (ADC) ---
    // Read multiple times and average for stability
    long sum = 0;
    for (int i = 0; i < 10; i++) {
        sum += analogRead(PIN_MQ135);
        delayMicroseconds(100);  // Tiny delay between ADC reads is OK
    }
    sensorData.airQualityRaw = sum / 10;

    // Classify air quality based on configurable thresholds
    if (sensorData.airQualityRaw < AQ_GOOD_MAX) {
        sensorData.airQualityLevel = "good";
    } else if (sensorData.airQualityRaw < AQ_MODERATE_MAX) {
        sensorData.airQualityLevel = "moderate";
    } else {
        sensorData.airQualityLevel = "poor";
    }

    // Debug output
    Serial.printf("T: %.1f°C  H: %.1f%%  AQ: %d (%s)\n",
        sensorData.temperature, sensorData.humidity,
        sensorData.airQualityRaw, sensorData.airQualityLevel.c_str());
}
```

### 6.5 display.h / display.cpp

```cpp
// display.h
#ifndef DISPLAY_H
#define DISPLAY_H

void setupDisplay();
void updateDisplay();
void displayMessage(int line, const char* msg);

#endif
```

```cpp
// display.cpp
#include "display.h"
#include "config.h"
#include "sensors.h"
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// OLED is 128 pixels wide, 64 pixels tall
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_ADDR 0x3C  // [VERIFY] Run I2C scanner if OLED not detected. May be 0x3D

Adafruit_SSD1306 oled(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// Store a custom status message (line 5)
String statusMsg = "";

void setupDisplay() {
    Wire.begin(PIN_OLED_SDA, PIN_OLED_SCL);

    if (!oled.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
        Serial.println("ERROR: OLED not found! Check wiring and I2C address.");
        // Don't halt — continue without display
        return;
    }

    oled.clearDisplay();
    oled.setTextSize(1);        // 6x8 pixels per character → 21 chars × 8 lines
    oled.setTextColor(SSD1306_WHITE);
    oled.setCursor(0, 0);
    oled.println("Desk Station v1.0");
    oled.println("Starting...");
    oled.display();
}

void updateDisplay() {
    oled.clearDisplay();
    oled.setTextSize(1);
    oled.setTextColor(SSD1306_WHITE);

    // Line 0: Temperature + Humidity
    oled.setCursor(0, 0);
    if (sensorData.sensorError) {
        oled.printf("T: ??.?C    H: ??%%");
    } else {
        oled.printf("T: %.1fC    H: %.0f%%", sensorData.temperature, sensorData.humidity);
    }

    // Line 1: Air Quality
    oled.setCursor(0, 10);
    oled.printf("Air: %d %s", sensorData.airQualityRaw, sensorData.airQualityLevel.c_str());

    // Line 2: Relay + Auto mode
    oled.setCursor(0, 20);
    oled.printf("Fan: %s  Auto: %s",
        sensorData.relayState ? "ON " : "OFF",
        sensorData.autoMode   ? "ON " : "OFF");

    // Line 3: Wi-Fi status
    oled.setCursor(0, 30);
    if (WiFi.status() == WL_CONNECTED) {
        oled.printf("WiFi: OK  RSSI:%d", WiFi.RSSI());
    } else {
        oled.print("WiFi: OFFLINE");
    }

    // Line 5: Status message (last command, etc.)
    if (statusMsg.length() > 0) {
        oled.setCursor(0, 46);
        oled.print(statusMsg.substring(0, 21));  // Truncate to screen width
    }

    // Line 7: Footer
    oled.setCursor(0, 56);
    oled.printf("Up: %lum", millis() / 60000);

    oled.display();
}

void displayMessage(int line, const char* msg) {
    statusMsg = String(msg);
    // Will appear on next updateDisplay() call
}
```

### 6.6 I2C Scanner Sketch (if OLED not detected)

```cpp
// Upload this if the OLED doesn't work. It scans all I2C addresses.
#include <Wire.h>

void setup() {
    Serial.begin(115200);
    Wire.begin(21, 22);  // SDA, SCL
    Serial.println("I2C Scanner starting...");

    for (byte addr = 1; addr < 127; addr++) {
        Wire.beginTransmission(addr);
        if (Wire.endTransmission() == 0) {
            Serial.printf("Found device at address: 0x%02X\n", addr);
        }
    }
    Serial.println("Scan complete.");
}

void loop() {}
```

---

## 7. Acceptance Test

| Step | Action | Expected | Pass? |
|------|--------|----------|-------|
| 1 | Flash `test-sensors-oled.ino` | Compiles and uploads without error | ☐ |
| 2 | Open Serial Monitor (115200 baud) | Temperature and humidity values print every 2 s | ☐ |
| 3 | Check OLED display | Shows temp, humidity, air quality, fan status | ☐ |
| 4 | Warm the DHT22 with your hand (or blow warm air) | Temperature reading increases on OLED and Serial | ☐ |
| 5 | Breathe on MQ-135 (after 5+ min warm-up) | Air quality raw value increases, level may change | ☐ |
| 6 | Unplug DHT22 data wire while running | OLED shows "T: ??.?C H: ??%" — no crash, no reboot | ☐ |
| 7 | Reconnect DHT22 | Readings resume within 2–4 seconds | ☐ |
| 8 | Check no `delay()` in code | Grep for `delay(` — only `delayMicroseconds` in ADC averaging is OK | ☐ |
| 9 | Run for 10 minutes straight | No crash, no frozen display, no memory leak (print `ESP.getFreeHeap()`) | ☐ |

---

## 8. Top Risks & Fallbacks

| Risk | Likelihood | Mitigation | Fallback |
|------|-----------|------------|----------|
| DHT22 always returns NaN | Medium | Check 10 kΩ pull-up, try GPIO2 instead of GPIO4, check VCC is 3.3V not 5V (some modules need 5V) | Use a different DHT22 module. Worst case: hardcode temperature for demo |
| OLED not detected (blank screen) | Medium | Run I2C scanner sketch. Try address 0x3D. Check SDA/SCL not swapped | Print to Serial as backup. Show Serial Monitor on laptop during demo |
| MQ-135 reads 0 constantly | Medium | Check voltage divider. Check VCC is 5V. Check AOUT pin (not DOUT). Check GPIO34 is the right pin | Show "Air: N/A" on OLED. Still demo temp + humidity |
| ESP32 ADC non-linearity | Low | Use relative thresholds, not absolute ppm. Average 10 readings | Acceptable — we only need good/moderate/poor classification |
| Library version conflict | Low | Pin library versions in documentation | Uninstall and reinstall specific versions |

