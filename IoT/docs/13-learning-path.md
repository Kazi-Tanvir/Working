# Beginner Learning Path

> **When:** Days 1–3 (Nov 12–14). **Who:** Everyone does Exercises 0–3. Then specialise.

These micro-exercises teach the core skills needed for the project. Each one builds on the previous. Do them in order. **Do not skip ahead** — each exercise has a pass criterion that proves you understand the concept.

---

## Prerequisites

- A laptop (Windows, Mac, or Linux)
- ESP32 DevKit V1 + USB cable
- A phone with hotspot capability (for Wi-Fi exercises)

---

## Exercise 0: Install Arduino IDE + ESP32 Support (30 min)

**Concept:** The Arduino IDE is the program you use to write code for the ESP32 and upload it.

**Steps:**

1. Download **Arduino IDE 2.x** from https://www.arduino.cc/en/software
2. Install and open it
3. Go to **File → Preferences**
4. In "Additional Board Manager URLs", paste:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
5. Go to **Tools → Board → Board Manager**
6. Search "**esp32**" → Install "**esp32 by Espressif Systems**" (latest version)
7. Plug in ESP32 via USB
8. Go to **Tools → Board → ESP32 Arduino → "ESP32 Dev Module"**
9. Go to **Tools → Port** → Select the COM port that appeared (Windows: COM3/COM4, Mac: /dev/cu.usbserial-*, Linux: /dev/ttyUSB0)
10. If no port appears:
    - **Windows:** Install [CP2102 driver](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers) or [CH340 driver](https://sparks.gogo.co.nz/ch340.html) depending on your board's USB chip [VERIFY which one]
    - **Mac:** Same drivers, may need security permission
    - **Linux:** `sudo usermod -a -G dialout $USER` then log out/in

**Pass criterion:** Board "ESP32 Dev Module" selected, COM port visible. Upload an empty sketch (just `void setup() {} void loop() {}`) without errors.

---

## Exercise 1: Blink LED (15 min)

**Concept:** Every Arduino program has `setup()` (runs once) and `loop()` (runs forever). `digitalWrite()` turns a pin HIGH or LOW. GPIO2 is the ESP32's built-in LED.

**Code:**
```cpp
void setup() {
    pinMode(2, OUTPUT);  // GPIO2 = built-in LED
}

void loop() {
    digitalWrite(2, HIGH);  // LED on
    delay(500);             // Wait 500 ms
    digitalWrite(2, LOW);   // LED off
    delay(500);             // Wait 500 ms
}
```

**Pass criterion:** Blue LED on ESP32 board blinks every 500 ms.

---

## Exercise 2: Serial Print (10 min)

**Concept:** `Serial` lets the ESP32 send text to your computer, visible in the Serial Monitor. Essential for debugging — you'll use it constantly.

**Code:**
```cpp
void setup() {
    Serial.begin(115200);  // Start serial at 115200 baud
    Serial.println("Hello from ESP32!");
}

void loop() {
    Serial.println("Still alive...");
    delay(1000);
}
```

**Steps:** Upload → Open Serial Monitor (magnifying glass icon, top right) → Set baud to **115200** (dropdown at bottom).

**Pass criterion:** "Hello from ESP32!" appears once, then "Still alive..." repeats every second.

---

## Exercise 3: Read DHT22 (45 min)

**Concept:** The DHT22 measures temperature and humidity. It sends data on a single digital pin. The Adafruit library handles the communication protocol.

**Wiring:**
```
DHT22 module:
  VCC  → ESP32 3V3 pin
  GND  → ESP32 GND pin
  DATA → ESP32 GPIO4

If bare DHT22 (no breakout board):
  Add 10 kΩ resistor between DATA and VCC
```

**Library install:** Sketch → Manage Libraries → Search "DHT sensor library" by Adafruit → Install (also installs "Adafruit Unified Sensor")

**Code:**
```cpp
#include <DHT.h>

#define DHTPIN 4
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

void setup() {
    Serial.begin(115200);
    dht.begin();
    Serial.println("DHT22 test starting...");
}

void loop() {
    float temp = dht.readTemperature();
    float hum = dht.readHumidity();

    if (isnan(temp) || isnan(hum)) {
        Serial.println("ERROR: Failed to read DHT22!");
    } else {
        Serial.printf("Temperature: %.1f °C   Humidity: %.1f %%\n", temp, hum);
    }

    delay(2000);  // DHT22 needs at least 2 seconds between reads
}
```

**Pass criterion:** Serial Monitor shows temperature (~20–35 °C depending on room) and humidity (~40–80%) every 2 seconds. Values are NOT "nan".

**Troubleshooting if NaN:**
- Check wiring: VCC to 3V3, GND to GND, DATA to GPIO4
- Try adding a 10 kΩ pull-up resistor between DATA and VCC
- Try a different GPIO (e.g., GPIO15)
- Try VCC to 5V instead of 3.3V (some modules need 5V)

---

## Exercise 4: Read MQ-135 Analog (30 min + warm-up wait)

**Concept:** `analogRead()` reads a voltage (0–3.3V) and returns a number (0–4095). The MQ-135 outputs an analog voltage proportional to gas concentration. We use a voltage divider to scale 5V output to 3V.

> [!WARNING]
> **Do NOT connect MQ-135 AOUT directly to ESP32 without the voltage divider.** MQ-135 outputs up to 5V, which will damage the ESP32 (max 3.3V input).

**Wiring:**
```
MQ-135:
  VCC  → 5V rail
  GND  → GND rail
  AOUT → [1 kΩ resistor] → junction → GPIO34
                             junction → [1.5 kΩ resistor] → GND
```

**Test voltage divider FIRST:** With MQ-135 powered but GPIO34 NOT connected, measure voltage at the junction with a multimeter. It must read ≤ 3.0V. Only then connect to GPIO34.

**Code:**
```cpp
#define MQ135_PIN 34

void setup() {
    Serial.begin(115200);
    // GPIO34 is input-only, no need for pinMode
    Serial.println("MQ-135 test. Note: sensor needs 20+ min warm-up!");
}

void loop() {
    int raw = analogRead(MQ135_PIN);
    float voltage = raw * (3.3 / 4095.0);
    Serial.printf("ADC: %d   Voltage: %.2fV\n", raw, voltage);
    delay(1000);
}
```

**Pass criterion:** Values appear in Serial Monitor. When you breathe on the sensor (after 5+ min warm-up), the ADC value increases noticeably.

---

## Exercise 5: OLED Hello World (30 min)

**Concept:** The OLED is a tiny screen that communicates via I2C (a two-wire protocol: SDA for data, SCL for clock). The SSD1306 library handles drawing text and graphics.

**Wiring:**
```
OLED:
  VCC → ESP32 3V3
  GND → ESP32 GND
  SDA → GPIO21
  SCL → GPIO22
```

**Library install:** Search "Adafruit SSD1306" → Install (also installs "Adafruit GFX Library")

**Code:**
```cpp
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 display(128, 64, &Wire, -1);

void setup() {
    Serial.begin(115200);
    Wire.begin(21, 22);  // SDA=21, SCL=22

    if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
        Serial.println("OLED not found! Check wiring.");
        while (true);  // Halt
    }

    display.clearDisplay();
    display.setTextSize(2);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(10, 20);
    display.println("Hello!");
    display.display();
}

void loop() {}
```

**Pass criterion:** "Hello!" appears on the OLED screen.

**Troubleshooting if blank:** Run the I2C scanner (code in M2 docs). If it finds 0x3D instead of 0x3C, change the address in the code.

---

## Exercise 6: Button Input (15 min)

**Concept:** A button connects a GPIO to GND when pressed. The internal pull-up resistor keeps the pin HIGH when the button is not pressed. So: HIGH = not pressed, LOW = pressed.

**Wiring:** One leg of button → GPIO13. Other leg → GND.

**Code:**
```cpp
#define BUTTON_PIN 13

void setup() {
    Serial.begin(115200);
    pinMode(BUTTON_PIN, INPUT_PULLUP);  // Enable internal pull-up
}

void loop() {
    int state = digitalRead(BUTTON_PIN);
    Serial.println(state);  // 1 = not pressed, 0 = pressed
    delay(100);
}
```

**Pass criterion:** Serial shows 1 normally, 0 when button is held down.

---

## Exercise 7: Relay Toggle (15 min)

**Wiring:** Relay IN → GPIO26. Relay VCC → 5V. Relay GND → GND.

**Code:**
```cpp
#define RELAY_PIN 26

void setup() {
    pinMode(RELAY_PIN, OUTPUT);
    digitalWrite(RELAY_PIN, HIGH);  // Start with relay OFF
}

void loop() {
    digitalWrite(RELAY_PIN, LOW);   // Relay ON (active LOW)
    delay(2000);
    digitalWrite(RELAY_PIN, HIGH);  // Relay OFF
    delay(2000);
}
```

**Pass criterion:** Hear relay click every 2 seconds. LED on relay board blinks.

---

## Exercise 8: Button Toggles Relay — With Debounce (30 min)

**Concept:** Mechanical buttons "bounce" — a single press can register as multiple rapid presses. Debouncing ignores changes that happen within 50 ms of the last change.

**Code:**
```cpp
#define BUTTON_PIN 13
#define RELAY_PIN 26
#define DEBOUNCE_MS 50

bool relayState = false;
bool lastButtonState = HIGH;
unsigned long lastPressTime = 0;

void setup() {
    Serial.begin(115200);
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    pinMode(RELAY_PIN, OUTPUT);
    digitalWrite(RELAY_PIN, HIGH);
}

void loop() {
    bool currentState = digitalRead(BUTTON_PIN);

    if (currentState == LOW && lastButtonState == HIGH) {
        if (millis() - lastPressTime > DEBOUNCE_MS) {
            lastPressTime = millis();
            relayState = !relayState;
            digitalWrite(RELAY_PIN, relayState ? LOW : HIGH);
            Serial.printf("Relay: %s\n", relayState ? "ON" : "OFF");
        }
    }

    lastButtonState = currentState;
    delay(10);
}
```

**Pass criterion:** Each button press toggles the relay exactly once. No double-toggling.

---

## Exercise 9: Wi-Fi Connect (30 min)

**Concept:** The ESP32 has built-in Wi-Fi. `WiFi.begin()` connects as a client (station mode). Use your phone hotspot as a reliable, portable Wi-Fi network.

**Code:**
```cpp
#include <WiFi.h>

const char* ssid = "YourPhoneHotspot";
const char* password = "YourPassword";

void setup() {
    Serial.begin(115200);
    WiFi.begin(ssid, password);
    Serial.print("Connecting to Wi-Fi");

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println();
    Serial.print("Connected! IP: ");
    Serial.println(WiFi.localIP());
}

void loop() {}
```

**Pass criterion:** IP address printed (e.g., `192.168.43.xxx`).

---

## Exercise 10: HTTP POST (45 min)

**Concept:** HTTP POST sends data to a server. We'll POST JSON to the fake-backend (or httpbin.org for testing).

**Pre-req:** Start `fake-backend.py` on your laptop. Note your laptop's IP on the same Wi-Fi network.

**Code:**
```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "YourHotspot";
const char* password = "YourPassword";
const char* serverUrl = "http://192.168.43.100:3001/api/sensor-data";  // Your laptop IP

void setup() {
    Serial.begin(115200);
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) delay(500);
    Serial.println("Connected!");
}

void loop() {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(serverUrl);
        http.addHeader("Content-Type", "application/json");
        http.addHeader("X-API-Key", "desk-station-secret-key-2026");

        String json = "{\"device_id\":\"test\",\"sensors\":{\"temperature\":25.5}}";
        int code = http.POST(json);

        Serial.printf("POST response: %d\n", code);
        http.end();
    }
    delay(5000);
}
```

**Pass criterion:** Serial shows "POST response: 201" (or 200). Fake-backend prints the received data.

---

## Exercise 11: HTTP GET + JSON Parse (45 min)

**Library install:** Search "ArduinoJson" by Benoît Blanchon → Install (v7.x)

**Code:**
```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ... Wi-Fi setup same as Exercise 10 ...

void loop() {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin("http://192.168.43.100:3001/api/commands?device_id=desk-station-01");
        http.addHeader("X-API-Key", "desk-station-secret-key-2026");

        int code = http.GET();
        if (code == 200) {
            String payload = http.getString();
            Serial.println("Response: " + payload);

            JsonDocument doc;
            deserializeJson(doc, payload);
            JsonArray cmds = doc["commands"].as<JsonArray>();
            for (JsonObject cmd : cmds) {
                Serial.printf("Command: %s\n", cmd["action"].as<const char*>());
            }
        }
        http.end();
    }
    delay(5000);
}
```

**Pass criterion:** Serial prints command action received from fake-backend.

---

## Exercise 12: Full Mini-Integration (1 hour)

Combine Exercises 3 + 5 + 8 + 10 + 11: Read DHT22 → display on OLED → POST to server → GET command → toggle relay. Use `millis()` for non-blocking timing.

**Pass criterion:** The complete data cycle runs: sensor reads appear on OLED and at the server, and a command from the server toggles the relay. No `delay()` calls except the DHT22 minimum read interval (handled by millis check).

---

## Who Does What

| Exercise | All 4 | Firmware Lead (B) | Hardware Lead (C) | Cloud Lead (A) | Integration Lead (D) |
|----------|-------|-------------------|-------------------|----------------|----------------------|
| 0: Install Arduino IDE | ✅ | ✅ | ✅ | ✅ | ✅ |
| 1: Blink LED | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2: Serial Print | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3: Read DHT22 | ✅ | ✅ | ✅ | Optional | ✅ |
| 4: Read MQ-135 | | ✅ | ✅ | | |
| 5: OLED Hello | | ✅ | ✅ | | |
| 6: Button Input | | ✅ | ✅ | | |
| 7: Relay Toggle | | ✅ | ✅ | | |
| 8: Button + Relay | | ✅ | ✅ | | |
| 9: Wi-Fi Connect | | ✅ | | | ✅ |
| 10: HTTP POST | | ✅ | | | ✅ |
| 11: HTTP GET + JSON | | ✅ | | | |
| 12: Full Integration | | ✅ | | | |

**Cloud Lead (A)** skips hardware exercises after #3 and focuses on setting up the Express backend (M4) and the fake-backend stub in parallel.

