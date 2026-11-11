# Module M0: Repo, Tooling & Conventions

> **Owner:** Integration & Testing Lead (Person D)
> **Backup:** Cloud & Voice Lead (Person A)
> **Status:** 🟡 Not Started
> **Estimated Total:** ~5.5 hours (4.75 h core + 0.75 h optional)

---

## 1. Purpose

This module sets up the **shared foundation** that every other module depends on. Before anyone writes a single line of firmware or backend code, M0 provides:

- A GitHub repository with a clear branching strategy
- The folder structure matching the project architecture
- A `.gitignore` that covers Arduino, Node.js, and Python artifacts
- Mock scripts (`fake-esp32.py` and `fake-backend.py`) so the Firmware Lead and Cloud Lead can develop in parallel **without waiting for each other**
- Shared `.env.example` files so credentials stay out of Git
- A README that orients anyone opening the repo for the first time

> [!IMPORTANT]
> M0 is on the critical path. The repo and mock scripts must be ready by **end of Day 1** (November 12) so everyone can push code on Day 2. Prioritise the repo, folder structure, and mock scripts. The README and CI can come later.

---

## 2. Inputs & Outputs

### 2.1 Inputs

| Source | What | Format |
|--------|------|--------|
| `01-interface-contracts.md` §3 | JSON schemas for sensor data and commands | JSONC examples |
| `01-interface-contracts.md` §4 | REST API endpoint definitions | Table |
| `00-overview.md` §7 | Canonical folder structure | Text tree |
| Team members | GitHub usernames | Slack / WhatsApp |

### 2.2 Outputs

| Artifact | Consumed By | Location |
|----------|-------------|----------|
| GitHub repo (remote) | Everyone | `github.com/<org>/IoT` |
| Folder skeleton | Every module | Root of repo |
| `.gitignore` | Everyone | `/IoT/.gitignore` |
| `fake-esp32.py` | Cloud Lead (M4 backend dev) | `/tools/mocks/fake-esp32.py` |
| `fake-backend.py` | Firmware Lead (M3 firmware dev) | `/tools/mocks/fake-backend.py` |
| `.env.example` files | Everyone | Root, `/backend/`, `/dashboard/` |
| `README.md` | Everyone (and showcase judges) | Root |

### 2.3 Interface Contract

This module **must** produce mock scripts that conform to the JSON schemas defined in `01-interface-contracts.md` §3. Specifically:

- `fake-esp32.py` must POST data matching the **Sensor Data Payload** schema (§3.1) to `POST /api/sensor-data`.
- `fake-esp32.py` must GET from `GET /api/commands?device_id=desk-station-01` and print received commands.
- `fake-backend.py` must accept `POST /api/sensor-data`, validate the payload shape, and return `201`.
- `fake-backend.py` must respond to `GET /api/commands?device_id=desk-station-01` with the **Command Queue Response** schema (§3.2).
- Both scripts must send/accept the `X-API-Key` header.

---

## 3. Dependencies

| Depends On | Why | Blocked Without It? |
|------------|-----|---------------------|
| Nothing | M0 is the first module — it has no dependencies | — |

### 3.1 Who Depends on M0

| Module | What They Need From M0 |
|--------|----------------------|
| M1 (Hardware) | Repo access to commit wiring diagrams |
| M2 (Sensors) | Repo to push firmware code |
| M3 (Wi-Fi/HTTP) | `fake-backend.py` to develop HTTP code without the real backend |
| M4 (Backend) | `fake-esp32.py` to develop API endpoints without a real ESP32 |
| M5 (Dashboard) | Repo, folder structure |
| All | `.gitignore`, branching rules |

### 3.2 Mock/Stub for Others

M0 **creates** the mocks; it does not consume any. The two mock scripts are detailed in §4 (Task List) with full source code.

---

## 4. Task List

### Task 0.1 — Create GitHub Repository

| Detail | Value |
|--------|-------|
| **Estimate** | 30 minutes |
| **Done when** | Repo exists on GitHub, all 4 team members have push access, `main` branch has an initial commit with `README.md` |

**Steps:**

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `IoT` (or `desk-station` — agree with the team)
3. Visibility: **Private** (switch to Public after showcase if desired)
4. Initialise with a README: **Yes**
5. Add `.gitignore`: Select **None** (we'll write our own)
6. Click **Create repository**
7. Go to **Settings → Collaborators → Add people** and add all team members by GitHub username
8. Each team member clones:

```bash
git clone https://github.com/<org>/IoT.git
cd IoT
```

### Task 0.2 — Set Up Branch Strategy

| Detail | Value |
|--------|-------|
| **Estimate** | included in Task 0.1 |
| **Done when** | `main` and `dev` branches exist; everyone knows the branching rules |

**Branching model (simplified Git Flow):**

```
main         ← Stable releases only. Never commit directly.
  └── dev    ← Integration branch. All feature branches merge here.
       ├── feature/m1-hardware
       ├── feature/m2-sensors
       ├── feature/m3-wifi-relay
       ├── feature/m4-backend
       ├── feature/m5-dashboard
       └── feature/m6-voice
```

**Rules:**
- **Never push directly to `main`** — only merge from `dev` when a milestone is stable
- **Never push directly to `dev`** — always create a feature branch and merge via Pull Request (or direct merge if the team is small and trusts each other)
- Feature branches are named `feature/<module>-<short-description>` (e.g., `feature/m2-dht22-read`)
- Delete feature branches after merging

**Git commands to set up:**

```bash
# After cloning, create the dev branch
git checkout -b dev
git push -u origin dev

# Each team member starts a feature branch from dev
git checkout dev
git pull origin dev
git checkout -b feature/m2-sensors
# ... work ...
git add .
git commit -m "M2: read DHT22 temperature to Serial"
git push -u origin feature/m2-sensors

# When feature is done, merge to dev
git checkout dev
git pull origin dev
git merge feature/m2-sensors
git push origin dev

# Delete the feature branch (optional, keeps things clean)
git branch -d feature/m2-sensors
git push origin --delete feature/m2-sensors
```

> [!TIP]
> If the team is unfamiliar with branches, the Integration Lead should do a **15-minute live demo** on Day 1: create a branch, make a change, merge it back, show what happens with a merge conflict.

### Task 0.3 — Write `.gitignore`

| Detail | Value |
|--------|-------|
| **Estimate** | 15 minutes |
| **Done when** | `.gitignore` is in the repo root and covers Arduino, Node.js, Python, OS, and editor files |

**`.gitignore` content:**

```gitignore
# ============================================
# Desk Station .gitignore
# Covers: Arduino/PlatformIO, Node.js, Python, OS, Editors
# ============================================

# --- Arduino IDE ---
*.elf
*.hex
*.bin
*.map
build/
# Arduino IDE preferences (user-specific)
*.development

# --- PlatformIO ---
.pio/
.pioenvs/
.piolibdeps/
.vscode/.browse.c_cpp.db*
.vscode/c_cpp_properties.json
.vscode/launch.json
.vscode/ipch

# --- Node.js ---
node_modules/
dist/
.next/
out/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# --- Python ---
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
.env/
*.egg-info/
.eggs/

# --- Environment / Secrets ---
.env
.env.local
.env.*.local
*.pem
*.key

# --- Database files ---
*.db
*.db-journal
prisma/dev.db
prisma/dev.db-journal

# --- OS files ---
.DS_Store
Thumbs.db
ehthumbs.db
Desktop.ini

# --- Editors ---
.vscode/settings.json
.idea/
*.swp
*.swo
*~

# --- Misc ---
*.log
coverage/
.nyc_output/
```

### Task 0.4 — Scaffold Folder Structure

| Detail | Value |
|--------|-------|
| **Estimate** | 30 minutes |
| **Done when** | All directories from `00-overview.md` §7 exist with placeholder `README.md` files, committed to `dev` |

**Commands (run from repo root):**

```bash
# Create all directories
mkdir -p firmware/desk-station
mkdir -p backend/src/routes
mkdir -p backend/src/middleware
mkdir -p backend/src/lib
mkdir -p backend/prisma
mkdir -p dashboard/src/app
mkdir -p dashboard/src/components
mkdir -p dashboard/src/lib
mkdir -p tools/mocks
mkdir -p tools/scripts
mkdir -p hardware
mkdir -p docs

# Create placeholder files so Git tracks empty-ish directories
echo "# Firmware" > firmware/README.md
echo "# Backend API" > backend/README.md
echo "# Dashboard" > dashboard/README.md
echo "# Tools & Mocks" > tools/README.md
echo "# Hardware Docs" > hardware/README.md
echo "# Documentation" > docs/README.md

# Create .env.example files (never commit real .env!)
cat > .env.example << 'EOF'
# Root-level environment variables
# Copy this file to .env and fill in your values
API_KEY=desk-station-secret-key-2026
EOF

cat > backend/.env.example << 'EOF'
# Backend environment variables
# Copy this file to backend/.env and fill in your values
PORT=3001
DATABASE_URL="file:./dev.db"
API_KEY=desk-station-secret-key-2026
VAPI_SECRET=your-vapi-secret-here
EOF

cat > dashboard/.env.local.example << 'EOF'
# Dashboard environment variables
# Copy this file to dashboard/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_KEY=desk-station-secret-key-2026
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your-vapi-public-key-here
EOF
```

> [!NOTE]
> **Why `.env.example`?** These template files are committed to Git so everyone knows which environment variables are needed. The actual `.env` files containing real credentials are in `.gitignore` and **never** committed.

### Task 0.5 — Write `fake-esp32.py`

| Detail | Value |
|--------|-------|
| **Estimate** | 1.5 hours |
| **Done when** | Running `python fake-esp32.py` sends random sensor data to `localhost:3001` every 5 seconds, and prints any commands received from the backend |

**Purpose:** The Cloud Lead (Person A) needs fake sensor data to develop the backend (M4) without a real ESP32. This script simulates an ESP32 by:
1. POSTing random sensor data to `POST /api/sensor-data` every 5 seconds
2. GETting pending commands from `GET /api/commands` every 5 seconds
3. ACKing commands via `POST /api/commands/ack`

**File:** `tools/mocks/fake-esp32.py`

```python
#!/usr/bin/env python3
"""
fake-esp32.py — Simulates the ESP32 Desk Station for backend development.

Sends random sensor data to the backend every 5 seconds and polls for commands.
Conforms to the JSON schemas in 01-interface-contracts.md §3.

Usage:
    pip install requests
    python fake-esp32.py

Environment variables (optional):
    BACKEND_URL  — Backend base URL (default: http://localhost:3001)
    API_KEY      — API key for authentication (default: desk-station-secret-key-2026)
    DEVICE_ID    — Device identifier (default: desk-station-01)
    INTERVAL     — Seconds between cycles (default: 5)
"""

import os
import sys
import time
import random
import json

try:
    import requests
except ImportError:
    print("ERROR: 'requests' library not found.")
    print("Install it with:  pip install requests")
    sys.exit(1)

# --- Configuration (from environment or defaults) ---
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:3001")
API_KEY = os.environ.get("API_KEY", "desk-station-secret-key-2026")
DEVICE_ID = os.environ.get("DEVICE_ID", "desk-station-01")
INTERVAL = int(os.environ.get("INTERVAL", "5"))

# --- Headers ---
HEADERS = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
}

# --- Simulated state ---
relay_state = False
auto_mode = True
boot_time = time.time()

# --- Air quality classification (matches config.h thresholds) ---
AQ_GOOD_MAX = 1200
AQ_MODERATE_MAX = 2200


def classify_air_quality(raw_adc: int) -> str:
    """Classify air quality from raw ADC value, matching firmware thresholds."""
    if raw_adc < AQ_GOOD_MAX:
        return "good"
    elif raw_adc < AQ_MODERATE_MAX:
        return "moderate"
    else:
        return "poor"


def generate_sensor_data() -> dict:
    """Generate a random but realistic sensor payload matching §3.1 schema."""
    global relay_state, auto_mode

    temperature = round(random.uniform(22.0, 35.0), 1)
    humidity = round(random.uniform(40.0, 80.0), 1)
    air_quality_raw = random.randint(200, 3000)
    air_quality_level = classify_air_quality(air_quality_raw)
    uptime_s = int(time.time() - boot_time)

    # Simulate auto-threshold behaviour
    if auto_mode:
        if temperature > 30.0:
            relay_state = True
        elif temperature < 28.0:
            relay_state = False

    return {
        "device_id": DEVICE_ID,
        "timestamp": int(time.time()),
        "sensors": {
            "temperature": temperature,
            "humidity": humidity,
            "air_quality_raw": air_quality_raw,
            "air_quality_level": air_quality_level,
        },
        "relay_state": relay_state,
        "auto_mode": auto_mode,
        "wifi_rssi": random.randint(-70, -30),
        "uptime_s": uptime_s,
    }


def post_sensor_data(data: dict) -> bool:
    """POST sensor data to the backend. Returns True on success."""
    url = f"{BACKEND_URL}/api/sensor-data"
    try:
        resp = requests.post(url, json=data, headers=HEADERS, timeout=3)
        if resp.status_code == 201:
            print(f"  ✅ POST sensor data → 201 OK")
            return True
        else:
            print(f"  ❌ POST sensor data → {resp.status_code}: {resp.text[:100]}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"  ❌ POST failed: Cannot connect to {url}")
        print(f"     Is the backend running? Try: python fake-backend.py")
        return False
    except requests.exceptions.Timeout:
        print(f"  ❌ POST failed: Timeout after 3 seconds")
        return False


def poll_commands() -> list:
    """GET pending commands from the backend. Returns list of command objects."""
    url = f"{BACKEND_URL}/api/commands?device_id={DEVICE_ID}"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=3)
        if resp.status_code == 200:
            data = resp.json()
            commands = data.get("commands", [])
            if commands:
                print(f"  📥 Received {len(commands)} command(s):")
                for cmd in commands:
                    print(f"     → {cmd['action']}: {json.dumps(cmd.get('params', {}))}")
            else:
                print(f"  📭 No pending commands")
            return commands
        else:
            print(f"  ❌ GET commands → {resp.status_code}")
            return []
    except requests.exceptions.ConnectionError:
        print(f"  ❌ GET commands failed: Cannot connect")
        return []
    except requests.exceptions.Timeout:
        print(f"  ❌ GET commands failed: Timeout")
        return []


def execute_command(cmd: dict):
    """Simulate executing a command (updates local state)."""
    global relay_state, auto_mode

    action = cmd.get("action", "")
    params = cmd.get("params", {})

    if action == "set_relay":
        relay_state = params.get("state", False)
        auto_mode = False  # Manual override disables auto
        print(f"     🔧 Relay set to {'ON' if relay_state else 'OFF'} (auto mode disabled)")
    elif action == "set_auto_mode":
        auto_mode = params.get("enabled", True)
        print(f"     🔧 Auto mode {'enabled' if auto_mode else 'disabled'}")
    else:
        print(f"     ⚠️  Unknown action '{action}' — ignored")


def ack_commands(command_ids: list):
    """POST command acknowledgements to the backend."""
    if not command_ids:
        return

    url = f"{BACKEND_URL}/api/commands/ack"
    payload = {
        "device_id": DEVICE_ID,
        "acked": command_ids,
    }
    try:
        resp = requests.post(url, json=payload, headers=HEADERS, timeout=3)
        if resp.status_code == 200:
            print(f"  ✅ ACKed {len(command_ids)} command(s)")
        else:
            print(f"  ❌ ACK failed: {resp.status_code}")
    except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
        print(f"  ❌ ACK failed: Connection error")


def main():
    """Main loop — mimics the ESP32's non-blocking HTTP cycle."""
    print("=" * 60)
    print("  fake-esp32.py — ESP32 Simulator for Desk Station")
    print("=" * 60)
    print(f"  Backend URL : {BACKEND_URL}")
    print(f"  API Key     : {API_KEY[:10]}...")
    print(f"  Device ID   : {DEVICE_ID}")
    print(f"  Interval    : {INTERVAL}s")
    print("=" * 60)
    print("  Press Ctrl+C to stop\n")

    cycle = 0
    while True:
        cycle += 1
        print(f"\n--- Cycle {cycle} [{time.strftime('%H:%M:%S')}] ---")

        # Step 1: Generate and send sensor data
        data = generate_sensor_data()
        print(f"  📡 Temp={data['sensors']['temperature']}°C  "
              f"Hum={data['sensors']['humidity']}%  "
              f"AQ={data['sensors']['air_quality_raw']} ({data['sensors']['air_quality_level']})  "
              f"Relay={'ON' if data['relay_state'] else 'OFF'}  "
              f"Auto={'ON' if data['auto_mode'] else 'OFF'}")
        post_sensor_data(data)

        # Step 2: Poll for commands
        commands = poll_commands()

        # Step 3: Execute and ACK commands
        ack_ids = []
        for cmd in commands:
            execute_command(cmd)
            ack_ids.append(cmd.get("id", ""))
        ack_commands(ack_ids)

        # Wait for next cycle
        time.sleep(INTERVAL)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n  Stopped. Goodbye!")
        sys.exit(0)
```

### Task 0.6 — Write `fake-backend.py`

| Detail | Value |
|--------|-------|
| **Estimate** | 1.5 hours |
| **Done when** | Running `python fake-backend.py` starts a Flask server on port 3001 that accepts sensor POSTs, serves canned commands on GET, and handles ACKs |

**Purpose:** The Firmware Lead (Person B) needs a backend to test HTTP POST/GET code (M3) before the real Express backend is ready. This Flask app simulates the backend's three ESP32-facing endpoints.

**File:** `tools/mocks/fake-backend.py`

```python
#!/usr/bin/env python3
"""
fake-backend.py — Simulates the Express backend for firmware development.

A minimal Flask server that:
  - Accepts POST /api/sensor-data (prints received data, returns 201)
  - Serves GET /api/commands (returns a configurable canned command)
  - Accepts POST /api/commands/ack (marks commands as done)
  - Serves GET /api/health (health check)

Conforms to the REST API in 01-interface-contracts.md §4.

Usage:
    pip install flask
    python fake-backend.py

Environment variables (optional):
    PORT     — Port to listen on (default: 3001)
    API_KEY  — Expected API key (default: desk-station-secret-key-2026)
"""

import os
import sys
import json
import uuid
import time
from datetime import datetime

try:
    from flask import Flask, request, jsonify
except ImportError:
    print("ERROR: 'flask' library not found.")
    print("Install it with:  pip install flask")
    sys.exit(1)

# --- Configuration ---
PORT = int(os.environ.get("PORT", "3001"))
API_KEY = os.environ.get("API_KEY", "desk-station-secret-key-2026")

app = Flask(__name__)

# --- In-memory storage ---
sensor_readings = []          # List of received sensor payloads
pending_commands = []          # List of commands waiting to be picked up
acked_command_ids = set()      # Set of acknowledged command IDs
reading_count = 0


def check_api_key():
    """Validate the X-API-Key header. Returns an error response or None."""
    key = request.headers.get("X-API-Key", "")
    if key != API_KEY:
        return jsonify({"error": "Unauthorized. Invalid or missing X-API-Key."}), 401
    return None


# ------------------------------------------------------------------
# Endpoints matching 01-interface-contracts.md §4.1 (ESP32 endpoints)
# ------------------------------------------------------------------

@app.route("/api/sensor-data", methods=["POST"])
def receive_sensor_data():
    """Accept sensor data from ESP32 (or fake-esp32.py)."""
    auth_error = check_api_key()
    if auth_error:
        return auth_error

    global reading_count
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    # Basic validation (matches §3.1 rules)
    sensors = data.get("sensors", {})
    temp = sensors.get("temperature")
    humidity = sensors.get("humidity")

    if temp is not None and (temp < -40 or temp > 80):
        return jsonify({"error": f"temperature {temp} out of range [-40, 80]"}), 400
    if humidity is not None and (humidity < 0 or humidity > 100):
        return jsonify({"error": f"humidity {humidity} out of range [0, 100]"}), 400

    aq_level = sensors.get("air_quality_level", "")
    if aq_level and aq_level not in ("good", "moderate", "poor"):
        return jsonify({"error": f"air_quality_level must be good|moderate|poor"}), 400

    # Store reading
    reading_count += 1
    data["_received_at"] = datetime.now().isoformat()
    data["_id"] = reading_count
    sensor_readings.append(data)

    # Keep only last 100 readings in memory
    if len(sensor_readings) > 100:
        sensor_readings.pop(0)

    # Print to console for visibility
    print(f"\n📥 POST /api/sensor-data (#{reading_count})")
    print(f"   Temp={temp}°C  Hum={humidity}%  "
          f"AQ={sensors.get('air_quality_raw')} ({aq_level})  "
          f"Relay={'ON' if data.get('relay_state') else 'OFF'}  "
          f"Auto={'ON' if data.get('auto_mode') else 'OFF'}")

    return jsonify({"status": "ok", "id": reading_count}), 201


@app.route("/api/commands", methods=["GET"])
def get_commands():
    """Return pending commands for the ESP32."""
    auth_error = check_api_key()
    if auth_error:
        return auth_error

    device_id = request.args.get("device_id", "desk-station-01")

    # Filter: only pending, not yet acked, for the right device, and not expired
    now = time.time()
    active = [
        cmd for cmd in pending_commands
        if cmd.get("_device_id") == device_id
        and cmd["id"] not in acked_command_ids
        and (now - cmd.get("_created_ts", now)) < 60  # Expire after 60s
    ]

    # Build response (strip internal fields)
    response_cmds = []
    for cmd in active:
        response_cmds.append({
            "id": cmd["id"],
            "action": cmd["action"],
            "params": cmd["params"],
            "created_at": cmd["created_at"],
        })

    if active:
        print(f"\n📤 GET /api/commands → returning {len(active)} command(s)")
    return jsonify({"commands": response_cmds}), 200


@app.route("/api/commands/ack", methods=["POST"])
def ack_commands():
    """Acknowledge that commands have been executed by the ESP32."""
    auth_error = check_api_key()
    if auth_error:
        return auth_error

    data = request.get_json(silent=True)
    if not data or "acked" not in data:
        return jsonify({"error": "Missing 'acked' array in body"}), 400

    acked = data.get("acked", [])
    for cmd_id in acked:
        acked_command_ids.add(cmd_id)
    print(f"\n✅ ACK received for {len(acked)} command(s): {acked}")

    return jsonify({"status": "ok", "acked_count": len(acked)}), 200


# ------------------------------------------------------------------
# Dashboard-like endpoints (simplified for testing)
# ------------------------------------------------------------------

@app.route("/api/dashboard/current", methods=["GET"])
def dashboard_current():
    """Return the latest sensor reading (for dashboard testing)."""
    auth_error = check_api_key()
    if auth_error:
        return auth_error

    if not sensor_readings:
        return jsonify({"error": "No sensor data yet"}), 404

    return jsonify(sensor_readings[-1]), 200


@app.route("/api/dashboard/command", methods=["POST"])
def dashboard_command():
    """Queue a command from the dashboard UI."""
    auth_error = check_api_key()
    if auth_error:
        return auth_error

    data = request.get_json(silent=True)
    if not data or "action" not in data:
        return jsonify({"error": "Missing 'action' field"}), 400

    cmd_id = f"cmd-{uuid.uuid4().hex[:8]}"
    cmd = {
        "id": cmd_id,
        "action": data["action"],
        "params": data.get("params", {}),
        "created_at": int(time.time()),
        "_device_id": data.get("device_id", "desk-station-01"),
        "_created_ts": time.time(),
    }
    pending_commands.append(cmd)
    print(f"\n📝 Queued command: {cmd['action']} {json.dumps(cmd['params'])} (id={cmd_id})")

    return jsonify({"status": "queued", "command_id": cmd_id}), 201


# ------------------------------------------------------------------
# Admin: inject a test command from the terminal
# ------------------------------------------------------------------

@app.route("/api/test/inject-command", methods=["POST"])
def inject_command():
    """
    Test helper: inject a command manually.
    POST /api/test/inject-command
    Body: { "action": "set_relay", "params": { "state": true } }
    """
    data = request.get_json(silent=True)
    if not data or "action" not in data:
        return jsonify({"error": "Provide 'action' and optional 'params'"}), 400

    cmd_id = f"cmd-{uuid.uuid4().hex[:8]}"
    cmd = {
        "id": cmd_id,
        "action": data["action"],
        "params": data.get("params", {}),
        "created_at": int(time.time()),
        "_device_id": data.get("device_id", "desk-station-01"),
        "_created_ts": time.time(),
    }
    pending_commands.append(cmd)
    print(f"\n🧪 TEST: Injected command: {cmd['action']} {json.dumps(cmd['params'])}")

    return jsonify({"status": "injected", "command_id": cmd_id}), 201


# ------------------------------------------------------------------
# Health check
# ------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "uptime": int(time.time() - app_start_time),
        "db": "in-memory (mock)",
        "readings_count": reading_count,
        "pending_commands": len([c for c in pending_commands if c["id"] not in acked_command_ids]),
    }), 200


# ------------------------------------------------------------------
# Startup
# ------------------------------------------------------------------

app_start_time = time.time()

if __name__ == "__main__":
    print("=" * 60)
    print("  fake-backend.py — Backend Simulator for Desk Station")
    print("=" * 60)
    print(f"  Listening on  : http://localhost:{PORT}")
    print(f"  API Key       : {API_KEY[:10]}...")
    print(f"  Health check  : http://localhost:{PORT}/api/health")
    print("=" * 60)
    print(f"  TIP: To inject a test command, run:")
    print(f"    curl -X POST http://localhost:{PORT}/api/test/inject-command \\")
    print(f'      -H "Content-Type: application/json" \\')
    print(f'      -d \'{{"action":"set_relay","params":{{"state":true}}}}\'')
    print("=" * 60)
    print()

    app.run(host="0.0.0.0", port=PORT, debug=True)
```

### Task 0.7 — Set Up CI Lint Check (Optional)

| Detail | Value |
|--------|-------|
| **Estimate** | 30 minutes (skip if time is tight) |
| **Done when** | A GitHub Action runs `eslint` on backend/dashboard code on every PR to `dev` |

**File:** `.github/workflows/lint.yml`

```yaml
name: Lint
on:
  pull_request:
    branches: [dev, main]

jobs:
  lint-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd backend && npm ci
      - run: cd backend && npx eslint src/

  lint-dashboard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd dashboard && npm ci
      - run: cd dashboard && npx eslint src/
```

> [!NOTE]
> This is a SHOULD-tier task. If the team is short on time, skip CI and rely on manual code review. The mock scripts are far more important.

### Task 0.8 — Write Root `README.md`

| Detail | Value |
|--------|-------|
| **Estimate** | 30 minutes |
| **Done when** | README explains what the project is, how to run locally, and links to docs |

Include sections: Project Summary (copy from overview), Quick Start (clone, install, run mocks), Folder Structure (copy from overview), Team Members, and links to docs.

---

## 5. Files & Folder Locations

| File | Path | Created By |
|------|------|-----------|
| `.gitignore` | `/IoT/.gitignore` | This module |
| Root `.env.example` | `/IoT/.env.example` | This module |
| Backend `.env.example` | `/IoT/backend/.env.example` | This module |
| Dashboard `.env.local.example` | `/IoT/dashboard/.env.local.example` | This module |
| `fake-esp32.py` | `/IoT/tools/mocks/fake-esp32.py` | This module |
| `fake-backend.py` | `/IoT/tools/mocks/fake-backend.py` | This module |
| `README.md` | `/IoT/README.md` | This module |
| CI workflow (optional) | `/IoT/.github/workflows/lint.yml` | This module |
| Folder structure | All directories in §7 of `00-overview.md` | This module |

---

## 6. Acceptance Test

### Test Procedure (End-to-End Mock Test)

This test verifies that the mock scripts work correctly and simulate the ESP32↔Backend interface.

**Prerequisites:**
- Python 3.8+ installed
- `pip install requests flask`

**Steps:**

| # | Action | Expected Result | Pass / Fail |
|---|--------|----------------|-------------|
| 1 | Open Terminal 1 and run: `cd tools/mocks && python fake-backend.py` | Flask starts on port 3001. Console shows startup banner | ☐ |
| 2 | Open Terminal 2 and run: `cd tools/mocks && python fake-esp32.py` | Script starts sending data. Console shows "POST sensor data → 201 OK" every 5s | ☐ |
| 3 | Check Terminal 1 | Shows received sensor data printed on each POST (Temp, Hum, AQ values) | ☐ |
| 4 | In Terminal 3 run: `curl -X POST http://localhost:3001/api/test/inject-command -H "Content-Type: application/json" -d '{"action":"set_relay","params":{"state":true}}'` | Returns `{"status":"injected","command_id":"cmd-..."}` | ☐ |
| 5 | Wait for next fake-esp32 cycle (~5s) | Terminal 2 shows "Received 1 command(s): → set_relay: {\"state\": true}" followed by "Relay set to ON" | ☐ |
| 6 | Open browser: `http://localhost:3001/api/health` | Shows JSON with `"status": "ok"` and reading count > 0 | ☐ |
| 7 | Open browser: `http://localhost:3001/api/dashboard/current` (with API key in header or use curl: `curl -H "X-API-Key: desk-station-secret-key-2026" http://localhost:3001/api/dashboard/current`) | Shows latest sensor reading JSON | ☐ |

### Repository Access Test

| # | Action | Expected Result | Pass / Fail |
|---|--------|----------------|-------------|
| 8 | Each team member runs `git clone <repo-url>` on their machine | Repo clones successfully | ☐ |
| 9 | Each team member creates a test branch: `git checkout -b test/<name>` | Branch created | ☐ |
| 10 | Each member creates a file, commits, pushes: `echo "test" > test-<name>.txt && git add . && git commit -m "test" && git push -u origin test/<name>` | Push succeeds | ☐ |
| 11 | Delete test branches | Clean state | ☐ |

> **Pass criterion:** All steps 1–10 pass for all 4 team members.

---

## 7. Top Risks & Fallbacks

| # | Risk | Likelihood | Impact | Mitigation / Fallback |
|---|------|-----------|--------|----------------------|
| 1 | Team unfamiliar with Git branching — merge conflicts, accidental pushes to `main` | Medium | Medium | Integration Lead gives a 15-min Git tutorial on Day 1. Set up GitHub branch protection rules on `main` (require PR) |
| 2 | `pip install flask` or `pip install requests` fails due to Python version or environment issues | Low | Low | Ensure everyone has Python 3.8+. Use `python -m pip install` or create a `venv`. Provide step-by-step install instructions in `tools/mocks/README.md` |
| 3 | Port 3001 already in use on someone's machine | Low | Low | Set `PORT=3002` environment variable: `PORT=3002 python fake-backend.py` |
| 4 | Mock scripts drift out of sync with real API contract after changes | Medium | High | Any change to `01-interface-contracts.md` §3 must be reflected in both mock scripts. Add a checklist item to every PR that touches the contract |
| 5 | Team wastes time on CI/linting instead of core features | Low | Medium | CI is marked optional (Task 0.7). Skip it if Day 1 runs long. Focus on mock scripts first |
| 6 | `.env` file accidentally committed with real credentials | Medium | High | `.gitignore` already covers `.env`. Double-check with `git status` before every commit. Consider adding a pre-commit hook [VERIFY if team wants this] |

---

## 8. ESP32 Arduino IDE / PlatformIO Setup Guide

This section helps the Firmware Lead (Person B) get the development environment ready.

### Option A: Arduino IDE 2.x (Simpler)

1. **Download:** [arduino.cc/en/software](https://www.arduino.cc/en/software) → Install Arduino IDE 2.x
2. **Add ESP32 board support:**
   - Go to **File → Preferences**
   - In "Additional Boards Manager URLs", paste:
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Click OK
   - Go to **Tools → Board → Boards Manager**
   - Search for **"esp32"** by Espressif Systems
   - Click **Install** (this downloads ~300 MB, may take a few minutes)
3. **Select your board:**
   - **Tools → Board → esp32 → "ESP32 Dev Module"** (or "DOIT ESP32 DEVKIT V1" if listed)
4. **Select port:**
   - Plug in ESP32 via USB
   - **Tools → Port** → Select the COM port that appears (e.g., COM3 on Windows, `/dev/ttyUSB0` on Linux)
   - If no port appears, install the USB-UART driver: [CP2102 driver](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers) or [CH340 driver](http://www.wch-ic.com/downloads/CH341SER_ZIP.html) [VERIFY which chip your board uses — check the small chip near the USB port]
5. **Test with Blink:**
   - **File → Examples → 01.Basics → Blink**
   - Change `LED_BUILTIN` to `2` (ESP32 built-in LED is GPIO2)
   - Click **Upload** (→ icon)
   - The blue LED on the ESP32 should blink

### Option B: PlatformIO in VS Code (Better for Teams)

1. **Install VS Code** if not already installed
2. **Install PlatformIO extension:** search "PlatformIO IDE" in VS Code Extensions
3. **Open the project:** File → Open Folder → select `firmware/`
4. **`platformio.ini`** should contain:

```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200
lib_deps =
    adafruit/DHT sensor library@^1.4.6
    adafruit/Adafruit Unified Sensor@^1.1.14
    adafruit/Adafruit SSD1306@^2.5.9
    adafruit/Adafruit GFX Library@^1.11.9
    bblanchon/ArduinoJson@^7.0.0
```

5. Click the **✓ checkmark** (Build) to compile, then **→ arrow** (Upload) to flash

> [!TIP]
> PlatformIO manages libraries via `platformio.ini` — no manual library installation needed. For team collaboration, this is much better than Arduino IDE where each person has to install libraries manually.

---

## 9. Node.js Project Scaffolding Guide

This section helps the Cloud Lead (Person A) initialise the backend and dashboard projects.

### Backend (Express.js)

```bash
cd backend
npm init -y
npm install express prisma @prisma/client cors dotenv
npm install -D eslint nodemon

# Initialise Prisma
npx prisma init --datasource-provider sqlite

# Add start scripts to package.json:
# "scripts": {
#   "dev": "nodemon src/index.js",
#   "start": "node src/index.js",
#   "db:migrate": "npx prisma migrate dev",
#   "db:studio": "npx prisma studio"
# }
```

### Dashboard (Next.js)

```bash
cd dashboard
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
npm install swr recharts
# shadcn/ui (optional, for nice components):
npx shadcn-ui@latest init
```

---

## Summary Table

| Task | Time | Priority | Done? |
|------|------|----------|-------|
| 0.1 Create GitHub repo | 30 min | 🔴 Critical | ☐ |
| 0.2 Branch strategy + tutorial | incl. | 🔴 Critical | ☐ |
| 0.3 Write `.gitignore` | 15 min | 🔴 Critical | ☐ |
| 0.4 Scaffold folders | 30 min | 🔴 Critical | ☐ |
| 0.5 Write `fake-esp32.py` | 1.5 h | 🔴 Critical | ☐ |
| 0.6 Write `fake-backend.py` | 1.5 h | 🔴 Critical | ☐ |
| 0.7 CI lint check | 30 min | 🟡 Optional | ☐ |
| 0.8 Write `README.md` | 30 min | 🟢 Normal | ☐ |
| **Total (core)** | **4.75 h** | | |
| **Total (with optional)** | **5.5 h** | | |
