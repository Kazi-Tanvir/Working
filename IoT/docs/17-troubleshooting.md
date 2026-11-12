# Troubleshooting Playbook

The 15 most likely failures during development and showcase day, written as **Symptom → Cause → Fix → Escalation**.

---

### Problem 1: ESP32 not detected by computer (no COM / serial port)
- **Cause:** Missing USB-to-UART driver (CP2102 or CH340), or using a **charge-only USB cable** (very common with phone cables).
- **Fix:**
  1. Swap to a known **data** USB cable.
  2. Check your ESP32 board's USB chip (near the USB port):
     - Square chip (`CP2102`): install Silicon Labs VCP driver.
     - Rectangular chip (`CH340`): install CH340 driver.
  3. On Linux/Ubuntu: run `sudo usermod -a -G dialout $USER`, then **log out and log back in**.
- **If fix doesn't work:** Try plugging into another team member's laptop to isolate cable/board vs OS driver.

### Problem 2: `A fatal error occurred: Failed to connect to ESP32` when uploading
- **Cause:** ESP32 did not enter bootloader/flash mode automatically, or Serial Monitor is holding the COM port open.
- **Fix:**
  1. Close any open Serial Monitor tab or Python script using that port.
  2. Click **Upload** in Arduino IDE; when `Connecting........_____.....` appears, **hold down the `BOOT` button** on the ESP32 for 2 seconds, then release.
  3. Lower **Tools → Upload Speed** to `115200`.
- **If fix doesn't work:** Unplug all sensors from `GPIO0`, `GPIO2`, `GPIO12`, `GPIO15` (strapping pins) and try flashing again.

### Problem 3: DHT22 returns `NaN` for temperature and humidity
- **Cause:** Loose data wire, missing 10 kΩ pull-up resistor (on bare 4-pin sensors), wrong GPIO in `config.h`, or polling faster than every 2 seconds.
- **Fix:**
  1. Verify wiring: `VCC → 3.3V` (some boards prefer `5V` [VERIFY your module]), `GND → GND`, `DATA → GPIO4`.
  2. If using a bare 4-pin DHT22 (not a 3-pin breakout module), solder/place a **10 kΩ resistor between DATA and VCC**.
  3. Ensure `SENSOR_INTERVAL >= 2000` ms.
- **If fix doesn't work:** Test DHT22 alone with Exercise 3 sketch on a spare GPIO (e.g., `GPIO19`). If still `NaN`, swap sensor.

### Problem 4: MQ-135 ADC reads `0` constantly
- **Cause:** Voltage divider resistors swapped or shorted to GND, `GPIO34` wired to `DOUT` instead of `AOUT`, or missing common GND between MQ-135 and ESP32.
- **Fix:**
  1. Confirm wire comes from **`AOUT`** (not `DOUT`).
  2. Measure voltage at the divider junction (`R1 = 1 kΩ` from AOUT, `R2 = 1.5 kΩ` to GND) with a multimeter — should be ~0.5–2.5 V in air.
  3. Verify MQ-135 `VCC` is connected to **5V** (not 3.3V) so the internal heater turns on.
- **If fix doesn't work:** Disconnect `GPIO34` and test `analogRead(34)` connected to ESP32 `3V3` pin (should read ~4095) to confirm the ADC pin itself isn't dead.

### Problem 5: MQ-135 ADC reads `4095` (or ~3723+) constantly
- **Cause:** Missing ground leg (`R2 = 1.5 kΩ`) on the voltage divider (feeding full 5 V into GPIO34!), or sensor was just exposed to heavy gas/alcohol.
- **Fix:**
  1. **Unplug USB immediately** if `R2` to GND is disconnected — check voltage at junction with multimeter! It must be **≤ 3.0 V**.
  2. Confirm `R1 = 1 kΩ` and `R2 = 1.5 kΩ` using multimeter resistance mode.
- **If fix doesn't work:** Test on the spare ESP32 if `GPIO34` was exposed to 5 V and stops responding.

### Problem 6: OLED stays completely blank
- **Cause:** Wrong I2C address (`0x3C` vs `0x3D`), `SDA`/`SCL` swapped, or `VCC`/`GND` reversed.
- **Fix:**
  1. Check `SDA → GPIO21`, `SCL → GPIO22`, `VCC → 3.3V`, `GND → GND`.
  2. Run the **I2C Scanner sketch** (in `04-module-M2-sensors-oled.md`). If it prints `0x3D`, update `#define OLED_ADDR 0x3D` in `display.cpp`.
- **If fix doesn't work:** Check continuity on perfboard header pins; try `oled.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)` after adding `delay(100)` in `setupDisplay()`.

### Problem 7: OLED shows garbled pixels or cut-off text
- **Cause:** Library configured for `128x32` instead of `128x64`, loose `SDA`/`SCL` wire causing I2C noise, or `oled.clearDisplay()` missing before redraw.
- **Fix:**
  1. Ensure `Adafruit_SSD1306 oled(128, 64, &Wire, -1);` matches your physical module (`128×64`).
  2. Confirm `oled.clearDisplay()` runs at the start of `updateDisplay()` and `oled.display()` runs at the end.
- **If fix doesn't work:** Lower I2C clock speed with `Wire.setClock(100000);` right after `Wire.begin(...)`.

### Problem 8: Relay LED blinks, or GPIO toggles, but relay doesn't click / fan doesn't spin
- **Cause:** Relay module powered from `3.3V` instead of `5V` (coil needs 5V to pull in), active-LOW vs active-HIGH mismatch, or load wired to `NC` instead of `NO`.
- **Fix:**
  1. Move relay `VCC` to the **5V rail** (keeps optocoupler + coil powered properly).
  2. If the relay is ON when it should be OFF (inverted), swap `LOW` and `HIGH` in `setRelay()` in `relay.cpp`.
  3. Verify fan positive wire goes through `COM` and `NO` (Normally Open) terminals, and fan negative goes directly to `GND`.
- **If fix doesn't work:** Touch relay `IN` pin briefly to `GND` (for active-LOW) or `5V` (for active-HIGH) to verify the relay hardware independently of the ESP32.

### Problem 9: Wi-Fi connects, but HTTP POST fails (`-1` connection refused / timeout)
- **Cause:** Wrong `BACKEND_URL`, backend server isn't running, ESP32 and laptop are on different Wi-Fi networks (during local dev), or Windows Firewall blocks port `3001`.
- **Fix:**
  1. For local dev: verify laptop IP (`ipconfig` on Windows / `ifconfig` on Mac/Linux) and ensure ESP32 is on the **same hotspot/Wi-Fi**. Test `http://<LAPTOP_IP>:3001/api/health` from your phone browser first.
  2. On Windows, allow Node.js / port `3001` through Windows Defender Firewall.
  3. For Railway: verify `BACKEND_URL` starts with `https://` and has **no trailing slash**. Note: ESP32 `HTTPClient` needs `http.begin("https://...")`; if SSL cert fails on ESP32 Arduino core, use `WiFiClientSecure` with `client.setInsecure()` for demo purposes [VERIFY].
- **If fix doesn't work:** Point `BACKEND_URL` to `fake-backend.py` locally to isolate firmware vs Railway.

### Problem 10: HTTP POST or GET returns `401 Unauthorized`
- **Cause:** `X-API-Key` header in `config.h` does not match `API_KEY` in backend `.env` / Railway environment variables.
- **Fix:**
  1. Compare `API_KEY` in `firmware/desk-station/config.h` character-for-character with `API_KEY` on Railway/backend `.env`.
  2. Check for trailing spaces or quotes.
- **If fix doesn't work:** Log `req.headers['x-api-key']` temporarily in backend auth middleware to see what is arriving.

### Problem 11: HTTP POST returns `400 Bad Request`
- **Cause:** JSON payload does not match schema in `01-interface-contracts.md` §3.1 (e.g., `NaN` sent as `temperature`, missing `device_id`, or `air_quality_level` invalid).
- **Fix:**
  1. Print the serialized JSON `body` to Serial Monitor (`Serial.println(body);`) before `http.POST(body)`.
  2. Ensure `sensorData.sensorError` prevents sending `NaN` (ArduinoJson serializes `NaN` as `null`, which fails numeric validation).
- **If fix doesn't work:** Test the exact printed JSON string with `curl -X POST` against the backend to read the full 400 validation error message.

### Problem 12: Dashboard shows `"Waiting for device..."` or `"Connecting..."` forever
- **Cause:** `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_API_KEY` missing in `.env.local` / Vercel settings, CORS blocking the Vercel origin, or ESP32 hasn't posted any data yet.
- **Fix:**
  1. Open Chrome DevTools (`F12`) → **Network** & **Console** tabs. Look for CORS errors or `401`/`404` responses.
  2. Verify `cors()` in `backend/src/index.js` allows your `localhost:3000` and `*.vercel.app` origins.
  3. Run `fake-esp32.py` for 10 seconds to seed at least one reading in the database.
- **If fix doesn't work:** Test `curl -H "X-API-Key: ..." https://<railway-url>/api/dashboard/current` directly from terminal.

### Problem 13: Voice command not recognized or Vapi doesn't trigger the relay
- **Cause:** Background noise, browser mic muted/wrong input device, Vapi Assistant Server URL still pointing to an expired `ngrok` URL instead of Railway, or tool parameter mismatch.
- **Fix:**
  1. Check Vapi Dashboard → **Server URL** points to `https://<your-app>.up.railway.app/api/vapi/webhook`.
  2. Check Railway logs while speaking — see if `/api/vapi/webhook` is even being hit.
  3. Switch to **push-to-talk**, hold mic 20–30 cm away, speak clearly: *"Turn the fan on."*
- **If fix doesn't work:** Use the **Typed Command** input right below the VoicePanel so the demo keeps moving smoothly.

### Problem 14: ESP32 crashes and reboots repeatedly (`Guru Meditation Error` / `Brownout detector`)
- **Cause:** `Brownout detector was triggered` = insufficient power (weak USB port/cable); `Guru Meditation Error` = null pointer, stack overflow, or invalid memory access in firmware.
- **Fix:**
  1. Read the first 3 lines of the Serial Monitor crash message:
     - If `Brownout detector`: plug into a **5V 2A wall charger** or better USB cable.
     - If `LoadProhibited` / `StoreProhibited`: check array bounds, OLED pointer initialization, or `WiFiClientSecure` stack usage.
- **If fix doesn't work:** Flash the last known good commit from Git (`dev` branch) onto the spare ESP32.

### Problem 15: ESP32 works for 10–30 minutes then freezes or stops sending HTTP requests
- **Cause:** Heap fragmentation from frequent `String` allocations, unclosed `HTTPClient` (`http.end()` missed on an error path), or blocking network call without timeout.
- **Fix:**
  1. Verify `http.end()` is called on **every** exit path in `postSensorData()` and `pollCommands()`.
  2. Verify `http.setTimeout(3000)` is set before every `POST`/`GET`.
  3. Log `ESP.getFreeHeap()` every 60 seconds during soak test to confirm memory isn't leaking.
- **If fix doesn't work:** Add `ESP.restart()` if `http` fails 20 times consecutively (self-healing watchdog), and power-cycle between judge waves.

