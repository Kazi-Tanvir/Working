# Module M4: Backend API + Database

> **Owner:** Cloud & Voice Lead (Person A)
> **Backup:** Integration & Testing Lead (Person D)
> **Tier:** MUST — the backend is the central nervous system of Desk Station

---

## 1. Purpose

The backend is an **Express.js REST API** that sits between the ESP32 hardware and every user-facing interface (dashboard, voice, Telegram). It has five jobs:

1. **Receive sensor data** — accept POST requests from the ESP32 every 5 seconds and store them in a database.
2. **Serve dashboard data** — provide endpoints for the Next.js dashboard to fetch the latest and historical sensor readings.
3. **Manage the command queue** — when a user (via dashboard, voice, or Telegram) wants to control the relay or start a timer, the backend creates a "command" row. The ESP32 polls for pending commands, executes them, and acknowledges back.
4. **Handle Vapi tool-call webhooks** — when the Vapi voice AI decides the user wants to "turn the fan on," it POSTs a tool-call to the backend. The backend interprets the call and queues the appropriate command.
5. **Expire stale commands** — if the ESP32 hasn't picked up a command within 60 seconds, mark it `"expired"` so it doesn't fire unexpectedly later.

### Why Express.js?

Express is a minimal Node.js web framework. If you've built any web server in JavaScript, you've probably used Express. The Cloud Lead already has experience with it, so there's no learning curve for the core developer. It's lightweight, well-documented, and has a massive ecosystem of middleware.

---

## 2. Interface Contracts

This module **must** obey every contract defined in [01-interface-contracts.md](./01-interface-contracts.md). Here's a summary:

### 2.1 Endpoints (from §4 of the contracts)

| Method | Path | Direction | Purpose |
|--------|------|-----------|---------|
| `POST` | `/api/sensor-data` | ESP32 → Backend | Store a sensor reading |
| `GET` | `/api/commands?device_id=desk-station-01` | ESP32 ← Backend | Return pending commands |
| `POST` | `/api/commands/ack` | ESP32 → Backend | Mark commands as executed |
| `GET` | `/api/dashboard/current` | Dashboard ← Backend | Latest sensor reading |
| `GET` | `/api/dashboard/history?hours=24` | Dashboard ← Backend | Historical readings (max 500) |
| `POST` | `/api/dashboard/command` | Dashboard → Backend | Queue a new command |
| `GET` | `/api/dashboard/command/:id/status` | Dashboard ← Backend | Check command status |
| `POST` | `/api/vapi/webhook` | Vapi → Backend | Handle voice tool calls |
| `GET` | `/api/health` | Anyone ← Backend | Health check |

### 2.2 Authentication

All endpoints require an `X-API-Key` header matching the `API_KEY` environment variable. Missing or wrong key → `401 Unauthorized`.

> [!NOTE]
> The Vapi webhook endpoint (`/api/vapi/webhook`) does **not** use our API key auth. Vapi sends its own payload format. You can optionally verify Vapi requests by checking a shared secret or Vapi's signature header [VERIFY Vapi's auth mechanism in their docs].

### 2.3 JSON Schemas

See [01-interface-contracts.md §3](./01-interface-contracts.md) for the exact JSON shapes for sensor data, command queue, and command acknowledgement.

### 2.4 Validation Rules

From §3.1 of the contracts:
- `temperature`: must be between -40 and 80 (DHT22 sensor range)
- `humidity`: must be between 0 and 100
- `air_quality_raw`: must be between 0 and 4095
- `air_quality_level`: must be one of `"good"`, `"moderate"`, `"poor"`
- If any field is missing or out of range → return `400` with an error message. **Never** crash the server.

---

## 3. Inputs and Outputs

### Inputs (data flowing INTO this module)

| Source | Data | How |
|--------|------|-----|
| ESP32 | Sensor readings (temp, humidity, air quality, relay state, auto mode) | `POST /api/sensor-data` every 5 s |
| ESP32 | Command acknowledgements | `POST /api/commands/ack` |
| Dashboard | New commands (relay toggle, auto mode toggle) | `POST /api/dashboard/command` |
| Vapi | Voice tool calls (get_sensor_data, set_relay, set_auto_mode, add_todo, get_todos, start_pomodoro) | `POST /api/vapi/webhook` |

### Outputs (data flowing OUT of this module)

| Destination | Data | How |
|-------------|------|-----|
| ESP32 | Pending commands | `GET /api/commands` |
| Dashboard | Latest sensor reading | `GET /api/dashboard/current` |
| Dashboard | Historical readings | `GET /api/dashboard/history` |
| Dashboard | Command status | `GET /api/dashboard/command/:id/status` |
| Vapi | Tool call results (spoken back to user) | Response to `POST /api/vapi/webhook` |

---

## 4. Dependencies

| Dependency | What it provides | Blocked without it? |
|------------|-----------------|---------------------|
| M0 (Repo & Tooling) | Git repo, folder structure, `.gitignore` | No — Cloud Lead can `npm init` immediately |
| Node.js 20 LTS | Runtime | Yes — must install Node.js |
| MySQL (production) | Database on Railway | No — use SQLite locally |
| Railway (production) | Hosting with a public URL | No — develop on localhost, use ngrok for Vapi testing |

### 4.1 Mock / Stub for Others

**For Firmware Lead (Person B):** The `fake-backend.py` script in `/tools/mocks/` simulates this entire backend. It's a Python Flask app that:
- Accepts `POST /api/sensor-data` and prints the data
- Returns canned commands from `GET /api/commands`
- Accepts `POST /api/commands/ack`

The Firmware Lead can develop and test the ESP32 HTTP code without waiting for the real backend.

**For Dashboard Lead (self):** While building the dashboard, the Cloud Lead can scaffold stub endpoints that return hardcoded JSON first, then replace them with real database queries. This lets you design the UI before the database is populated.

**For Voice testing:** The `test-vapi-call.sh` curl script in `/tools/mocks/` sends a fake Vapi tool-call payload to the webhook endpoint. Use it to test the webhook handler without setting up a Vapi account.

---

## 5. Setup Steps (From Zero)

### 5.1 Prerequisites

- **Node.js 20 LTS** — download from [nodejs.org](https://nodejs.org/) or use `nvm`
- **npm** — comes with Node.js
- A terminal (VS Code integrated terminal works great)

### 5.2 Initialise the Project

```bash
# Navigate to the backend folder
cd IoT/backend

# Initialise a new Node.js project
npm init -y

# Install dependencies
npm install express prisma @prisma/client cors dotenv uuid

# Install dev dependencies (optional but recommended)
npm install --save-dev nodemon
```

**What each package does:**

| Package | Purpose |
|---------|---------|
| `express` | Web framework — handles HTTP requests and routing |
| `prisma` | Database toolkit — generates SQL from a schema file |
| `@prisma/client` | The auto-generated database client used in your code |
| `cors` | Middleware that adds CORS headers so the dashboard can call the API from a different domain |
| `dotenv` | Loads environment variables from a `.env` file |
| `uuid` | Generates unique IDs for commands (e.g., `cmd-a1b2c3d4`) |
| `nodemon` | (dev) Auto-restarts the server when you save a file |

### 5.3 Initialise Prisma

```bash
# Creates prisma/ folder with schema.prisma and .env file
npx prisma init
```

This creates:
- `prisma/schema.prisma` — your database schema (replace its contents with the schema below)
- `.env` — contains the `DATABASE_URL` variable

### 5.4 Add Scripts to package.json

```json
{
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "db:migrate": "npx prisma migrate dev",
    "db:push": "npx prisma db push",
    "db:studio": "npx prisma studio",
    "db:generate": "npx prisma generate"
  }
}
```

---

## 6. Prisma Schema

Copy this into `prisma/schema.prisma`. This is identical to the schema in [01-interface-contracts.md §5](./01-interface-contracts.md).

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

// === LOCAL DEVELOPMENT (SQLite) ===
// Uncomment the block below and comment out the MySQL block for local dev.
// datasource db {
//   provider = "sqlite"
//   url      = "file:./dev.db"
// }

// === PRODUCTION (MySQL on Railway) ===
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

### 6.1 Switching Between SQLite and MySQL

**For local development:**
1. Comment out the MySQL `datasource db` block
2. Uncomment the SQLite `datasource db` block
3. In `.env`, you don't need `DATABASE_URL` (SQLite uses a file path in the schema)
4. Run `npx prisma migrate dev --name init`

**For production (Railway):**
1. Use the MySQL `datasource db` block (as shown above)
2. Set `DATABASE_URL` in Railway's environment variables
3. Run `npx prisma migrate deploy`

> [!TIP]
> During development, use `npx prisma db push` instead of `npx prisma migrate dev` if you just want to sync the schema quickly without creating migration files. This is faster for iterating, but `migrate dev` is better for a clean history.

### 6.2 Run Migrations

```bash
# For local dev with SQLite:
npx prisma migrate dev --name init

# This does three things:
# 1. Creates the database (dev.db file for SQLite)
# 2. Creates the tables matching the schema
# 3. Generates the Prisma client code in node_modules

# To view your data in a browser GUI:
npx prisma studio
# Opens at http://localhost:5555
```

---

## 7. Express App Structure

### 7.1 File Layout

```
backend/
├── src/
│   ├── index.js               # Express app entry point
│   ├── routes/
│   │   ├── sensor.js          # POST /api/sensor-data
│   │   ├── command.js         # GET /api/commands, POST /api/commands/ack
│   │   ├── dashboard.js       # GET /api/dashboard/*, POST /api/dashboard/command
│   │   └── vapi.js            # POST /api/vapi/webhook
│   ├── middleware/
│   │   └── auth.js            # API key validation
│   └── lib/
│       └── prisma.js          # Prisma client singleton
├── prisma/
│   └── schema.prisma
├── package.json
├── .env                        # Local env (NEVER commit this)
├── .env.example                # Template for team members
├── Dockerfile                  # For Railway deployment
└── railway.json                # Railway config
```

### 7.2 Prisma Client Singleton

```javascript
// src/lib/prisma.js
//
// Why a singleton? If you create a new PrismaClient() in every file,
// you'll quickly run out of database connections. This file creates
// ONE client and re-uses it everywhere.

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
```

### 7.3 API Key Middleware

```javascript
// src/middleware/auth.js
//
// This middleware checks that every request includes the correct API key
// in the X-API-Key header. If not, it returns 401 Unauthorized.

function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.API_KEY;

  if (!expectedKey) {
    console.error('WARNING: API_KEY environment variable is not set!');
    return res.status(500).json({ error: 'Server misconfigured: API_KEY not set' });
  }

  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized: invalid or missing API key' });
  }

  // Key is valid — continue to the route handler
  next();
}

module.exports = authMiddleware;
```

### 7.4 Main Entry Point (index.js)

```javascript
// src/index.js

// Load .env file FIRST — before anything else reads process.env
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Import route modules
const sensorRoutes = require('./routes/sensor');
const commandRoutes = require('./routes/command');
const dashboardRoutes = require('./routes/dashboard');
const vapiRoutes = require('./routes/vapi');

// Import middleware
const authMiddleware = require('./middleware/auth');

// Import Prisma client (to check DB connectivity on startup)
const prisma = require('./lib/prisma');

const app = express();
const PORT = process.env.PORT || 3001;

// === Middleware ===

// Parse JSON request bodies (Express doesn't do this by default!)
app.use(express.json());

// CORS — allows the Next.js dashboard (on a different domain) to call the API
// In production, replace '*' with your Vercel URL for security
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-API-Key'],
}));

// === Health Check (no auth required) ===
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (e) {
    dbStatus = 'error: ' + e.message;
  }
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    db: dbStatus,
  });
});

// === Routes (auth required) ===

// Apply API key auth to all /api/* routes EXCEPT /api/health and /api/vapi/*
app.use('/api/sensor-data', authMiddleware, sensorRoutes);
app.use('/api/commands', authMiddleware, commandRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

// Vapi webhook — NO API key auth (Vapi sends its own payload format)
// Optionally, add Vapi-specific verification here
app.use('/api/vapi', vapiRoutes);

// === Command Expiry Logic ===
// Runs every 30 seconds: marks commands older than 60 s as "expired"
async function expireStaleCommands() {
  try {
    const cutoff = new Date(Date.now() - 60 * 1000); // 60 seconds ago
    const result = await prisma.command.updateMany({
      where: {
        status: 'pending',
        createdAt: { lt: cutoff },
      },
      data: {
        status: 'expired',
      },
    });
    if (result.count > 0) {
      console.log(`Expired ${result.count} stale command(s)`);
    }
  } catch (error) {
    console.error('Error expiring commands:', error.message);
  }
}

// Run expiry check every 30 seconds
setInterval(expireStaleCommands, 30 * 1000);

// === Start Server ===
app.listen(PORT, () => {
  console.log(`Desk Station API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
```

> [!IMPORTANT]
> `require('dotenv').config()` must be the **first line** in `index.js`. If you import Prisma before loading dotenv, it won't see the `DATABASE_URL` and will crash.

---

## 8. Route Handlers

### 8.1 Sensor Data Route

```javascript
// src/routes/sensor.js

const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// POST /api/sensor-data
// Receives sensor readings from the ESP32 and stores them in the database.
router.post('/', async (req, res) => {
  try {
    const { device_id, timestamp, sensors, relay_state, auto_mode, wifi_rssi, uptime_s } = req.body;

    // --- Validation ---
    if (!device_id || !sensors) {
      return res.status(400).json({ error: 'Missing required fields: device_id, sensors' });
    }

    const { temperature, humidity, air_quality_raw, air_quality_level } = sensors;

    // Temperature range check (DHT22: -40 to 80 °C)
    if (typeof temperature !== 'number' || temperature < -40 || temperature > 80) {
      return res.status(400).json({ error: `Invalid temperature: ${temperature}. Must be -40 to 80.` });
    }

    // Humidity range check (0 to 100 %)
    if (typeof humidity !== 'number' || humidity < 0 || humidity > 100) {
      return res.status(400).json({ error: `Invalid humidity: ${humidity}. Must be 0 to 100.` });
    }

    // Air quality raw range check (0 to 4095 — 12-bit ADC)
    if (typeof air_quality_raw !== 'number' || air_quality_raw < 0 || air_quality_raw > 4095) {
      return res.status(400).json({ error: `Invalid air_quality_raw: ${air_quality_raw}. Must be 0 to 4095.` });
    }

    // Air quality level check
    const validLevels = ['good', 'moderate', 'poor'];
    if (!validLevels.includes(air_quality_level)) {
      return res.status(400).json({ error: `Invalid air_quality_level: ${air_quality_level}. Must be one of: ${validLevels.join(', ')}` });
    }

    // --- Store in database ---
    const reading = await prisma.sensorReading.create({
      data: {
        deviceId: device_id,
        temperature,
        humidity,
        airQualityRaw: air_quality_raw,
        airQualityLevel: air_quality_level,
        relayState: relay_state ?? false,
        autoMode: auto_mode ?? true,
        wifiRssi: wifi_rssi ?? null,
        uptimeS: uptime_s ?? null,
      },
    });

    res.status(201).json({ status: 'ok', id: reading.id });

  } catch (error) {
    console.error('Error storing sensor data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

### 8.2 Command Routes

```javascript
// src/routes/command.js

const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// GET /api/commands?device_id=desk-station-01
// Returns pending commands for the ESP32 to execute.
router.get('/', async (req, res) => {
  try {
    const deviceId = req.query.device_id;

    if (!deviceId) {
      return res.status(400).json({ error: 'Missing query parameter: device_id' });
    }

    // Find all pending commands for this device
    const commands = await prisma.command.findMany({
      where: {
        deviceId,
        status: 'pending',
      },
      orderBy: { createdAt: 'asc' },  // oldest first, so they execute in order
    });

    // Map to the contract format
    const formatted = commands.map(cmd => ({
      id: cmd.id,
      action: cmd.action,
      params: cmd.params,
      created_at: Math.floor(cmd.createdAt.getTime() / 1000),  // Unix epoch seconds
    }));

    res.json({ commands: formatted });

  } catch (error) {
    console.error('Error fetching commands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/commands/ack
// ESP32 acknowledges that it has executed one or more commands.
router.post('/ack', async (req, res) => {
  try {
    const { device_id, acked } = req.body;

    if (!device_id || !Array.isArray(acked) || acked.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid fields: device_id, acked (array of command IDs)' });
    }

    // Update all acknowledged commands
    const result = await prisma.command.updateMany({
      where: {
        id: { in: acked },
        deviceId: device_id,
        status: 'pending',   // Only ACK commands that are still pending (idempotent)
      },
      data: {
        status: 'acked',
        ackedAt: new Date(),
      },
    });

    res.json({ status: 'ok', acked_count: result.count });

  } catch (error) {
    console.error('Error acknowledging commands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

### 8.3 Dashboard Routes

```javascript
// src/routes/dashboard.js

const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { v4: uuidv4 } = require('uuid');

// GET /api/dashboard/current
// Returns the most recent sensor reading. The dashboard polls this every 3 seconds.
router.get('/current', async (req, res) => {
  try {
    const latest = await prisma.sensorReading.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!latest) {
      return res.status(404).json({ error: 'No sensor data yet. Is the ESP32 connected?' });
    }

    res.json({
      id: latest.id,
      device_id: latest.deviceId,
      temperature: latest.temperature,
      humidity: latest.humidity,
      air_quality_raw: latest.airQualityRaw,
      air_quality_level: latest.airQualityLevel,
      relay_state: latest.relayState,
      auto_mode: latest.autoMode,
      wifi_rssi: latest.wifiRssi,
      uptime_s: latest.uptimeS,
      created_at: latest.createdAt.toISOString(),
    });

  } catch (error) {
    console.error('Error fetching current data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dashboard/history?hours=24
// Returns recent sensor readings for the history chart. Default: last 24 hours, max 500 rows.
router.get('/history', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const readings = await prisma.sensorReading.findMany({
      where: {
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,  // Cap at 500 rows to keep responses fast
    });

    res.json({
      readings: readings.map(r => ({
        id: r.id,
        temperature: r.temperature,
        humidity: r.humidity,
        air_quality_raw: r.airQualityRaw,
        air_quality_level: r.airQualityLevel,
        relay_state: r.relayState,
        auto_mode: r.autoMode,
        created_at: r.createdAt.toISOString(),
      })),
    });

  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/dashboard/command
// Dashboard sends a command (e.g., toggle relay). It gets queued for the ESP32.
router.post('/command', async (req, res) => {
  try {
    const { action, params } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Missing required field: action' });
    }

    // Validate action is in our vocabulary
    const validActions = [
      'set_relay', 'set_auto_mode', 'set_threshold',
      'set_rgb', 'buzz', 'start_pomodoro', 'stop_pomodoro', 'display_message',
    ];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        error: `Invalid action: "${action}". Valid actions: ${validActions.join(', ')}`,
      });
    }

    const command = await prisma.command.create({
      data: {
        deviceId: 'desk-station-01',
        action,
        params: params || {},
        source: 'dashboard',
      },
    });

    res.status(201).json({
      status: 'queued',
      command_id: command.id,
    });

  } catch (error) {
    console.error('Error creating command:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dashboard/command/:id/status
// Check the status of a specific command (pending, acked, or expired).
router.get('/command/:id/status', async (req, res) => {
  try {
    const command = await prisma.command.findUnique({
      where: { id: req.params.id },
    });

    if (!command) {
      return res.status(404).json({ error: 'Command not found' });
    }

    res.json({
      id: command.id,
      action: command.action,
      params: command.params,
      source: command.source,
      status: command.status,
      created_at: command.createdAt.toISOString(),
      acked_at: command.ackedAt ? command.ackedAt.toISOString() : null,
    });

  } catch (error) {
    console.error('Error fetching command status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

### 8.4 Vapi Webhook Route

This is the most complex route. See [01-interface-contracts.md §6](./01-interface-contracts.md) and §10 for the full tool definitions and webhook handler.

```javascript
// src/routes/vapi.js

const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// POST /api/vapi/webhook
// Handles tool calls from Vapi. When a user speaks a command, Vapi transcribes it,
// decides which "tool" to call, and POSTs the tool call here. We execute the tool
// and return the result, which Vapi speaks back to the user.
//
// [VERIFY] Exact payload structure — log req.body during development with ngrok.
// The format shown here matches the Vapi Server URL tool-calls format.
router.post('/webhook', async (req, res) => {
  try {
    console.log('Vapi webhook received:', JSON.stringify(req.body, null, 2));

    const { message } = req.body;

    // If it's not a tool-calls message, return empty results
    if (message?.type !== 'tool-calls') {
      return res.json({ results: [] });
    }

    const results = [];

    for (const toolCall of message.toolCalls) {
      const { id, function: fn } = toolCall;
      const name = fn.name;

      // Vapi sends arguments as a stringified JSON string
      const args = JSON.parse(fn.arguments || '{}');

      let result;

      switch (name) {
        // --- MUST: Get current sensor readings ---
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

        // --- MUST: Turn relay on/off ---
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
            message: `Fan has been turned ${args.state ? 'on' : 'off'}. The command has been sent to the device.`,
          };
          break;
        }

        // --- MUST: Enable/disable auto mode ---
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

        // --- SHOULD: Add to-do item ---
        case 'add_todo': {
          await prisma.todoItem.create({
            data: { text: args.text },
          });
          result = {
            success: true,
            message: `Added "${args.text}" to your to-do list.`,
          };
          break;
        }

        // --- SHOULD: Get to-do list ---
        case 'get_todos': {
          const items = await prisma.todoItem.findMany({
            where: { completed: false },
            orderBy: { createdAt: 'desc' },
          });
          if (items.length === 0) {
            result = { message: 'Your to-do list is empty.' };
          } else {
            const list = items.map((item, idx) => `${idx + 1}. ${item.text}`).join(', ');
            result = { message: `You have ${items.length} items: ${list}` };
          }
          break;
        }

        // --- SHOULD: Start Pomodoro timer ---
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
            message: `Pomodoro timer started: ${args.work_minutes || 25} minutes work, ${args.break_minutes || 5} minutes break.`,
          };
          break;
        }

        // --- Unknown tool ---
        default:
          console.warn(`Unknown Vapi tool called: ${name}`);
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

> [!WARNING]
> **Vapi payload format may vary.** The structure above (`message.type === 'tool-calls'`, `message.toolCalls[].function.name`, etc.) is based on the Vapi Server URL configuration. Always log `req.body` during development to verify the actual shape. [VERIFY with Vapi dashboard and docs.]

---

## 9. Command Expiry Logic

Commands are "pending" when created. The ESP32 polls every 5 seconds. If the ESP32 is offline or slow, commands pile up. A command that's 60 seconds old is almost certainly irrelevant (e.g., "turn on the fan" from a minute ago might not reflect the user's current intent).

The expiry logic runs on a `setInterval` in `index.js` (see §7.4 above):

```javascript
// Already in index.js — runs every 30 seconds
async function expireStaleCommands() {
  const cutoff = new Date(Date.now() - 60 * 1000); // 60 seconds ago
  const result = await prisma.command.updateMany({
    where: {
      status: 'pending',
      createdAt: { lt: cutoff },
    },
    data: {
      status: 'expired',
    },
  });
  if (result.count > 0) {
    console.log(`Expired ${result.count} stale command(s)`);
  }
}
setInterval(expireStaleCommands, 30 * 1000);
```

This approach is simple and reliable. An alternative is to check on each `GET /api/commands` call, but the `setInterval` approach means expired commands are cleaned up even when the ESP32 isn't polling.

---

## 10. CORS Configuration

**CORS (Cross-Origin Resource Sharing)** is a browser security feature. When your Next.js dashboard (on `https://desk-station.vercel.app`) tries to call your Express API (on `https://desk-station.up.railway.app`), the browser blocks the request unless the API explicitly allows it.

The `cors` middleware in `index.js` handles this:

```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',       // Allow specific origin or all
  methods: ['GET', 'POST'],                      // HTTP methods allowed
  allowedHeaders: ['Content-Type', 'X-API-Key'], // Headers the client can send
}));
```

- **During development:** `CORS_ORIGIN=*` allows all origins. This is fine for local testing.
- **In production:** Set `CORS_ORIGIN=https://desk-station.vercel.app` (your actual Vercel URL) in Railway's environment variables to lock it down.

---

## 11. Environment Variables

### 11.1 `.env.example` (commit this to Git)

```bash
# .env.example — Copy this to .env and fill in the values
# NEVER commit the actual .env file!

# Database connection string
# For local SQLite: not needed (path is in schema.prisma)
# For Railway MySQL: provided by Railway when you add a MySQL plugin
DATABASE_URL="mysql://user:password@host:port/database"

# API key — shared between ESP32, dashboard, and backend
# Use a random string. All clients must send this in X-API-Key header.
API_KEY="desk-station-secret-key-2026"

# Server port (Railway sets this automatically)
PORT=3001

# CORS origin — set to your Vercel dashboard URL in production
CORS_ORIGIN="*"
```

### 11.2 `.env` (local development — do NOT commit)

```bash
# .env — Local development values

# SQLite doesn't need DATABASE_URL (it's in schema.prisma as file:./dev.db)
# If you're using MySQL locally:
# DATABASE_URL="mysql://root:password@localhost:3306/desk_station"

API_KEY="desk-station-secret-key-2026"
PORT=3001
CORS_ORIGIN="*"
```

> [!CAUTION]
> **Never commit `.env` to Git.** It contains secrets. The `.gitignore` from M0 already excludes it. Only commit `.env.example` as a template.

---

## 12. Railway Deployment

### 12.1 Dockerfile

```dockerfile
# backend/Dockerfile

# Use Node.js 20 LTS Alpine (small image)
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files first (Docker caches this layer if deps haven't changed)
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy application code
COPY src ./src

# Railway injects PORT as an environment variable
EXPOSE ${PORT}

# Run database migration, then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
```

### 12.2 railway.json

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 12.3 Deployment Steps

1. **Create a Railway account** at [railway.app](https://railway.app/) — the free tier gives \$5/month of credits, more than enough for this project.

2. **Create a new project** → "Deploy from GitHub repo" → select your IoT repo → set the **root directory** to `backend`.

3. **Add a MySQL database** → in your Railway project, click "New" → "Database" → "MySQL". Railway gives you a `DATABASE_URL` automatically.

4. **Set environment variables** in Railway's dashboard (Settings → Variables):
   ```
   DATABASE_URL  → (auto-set by Railway MySQL plugin)
   API_KEY       → desk-station-secret-key-2026
   CORS_ORIGIN   → https://your-dashboard.vercel.app
   PORT          → 3001  (Railway usually auto-sets this)
   ```

5. **Deploy** → Railway auto-deploys on every push to `main`. Your API will be at `https://<app-name>.up.railway.app`.

6. **Test** → `curl https://<app-name>.up.railway.app/api/health`

### 12.4 Using ngrok During Development (for Vapi)

Vapi needs a publicly reachable URL to call your webhook. During development, use [ngrok](https://ngrok.com/) to expose your local server:

```bash
# Start your local server
npm run dev     # Running on http://localhost:3001

# In a new terminal, start ngrok
ngrok http 3001
# Output: https://abc123.ngrok-free.app → http://localhost:3001

# Use the ngrok URL as the Vapi server URL:
# https://abc123.ngrok-free.app/api/vapi/webhook
```

> [!NOTE]
> The free tier of ngrok gives you a random URL that changes every restart. For demo day, use the Railway URL instead — it's permanent.

---

## 13. Task List

| # | Task | Time Est. | Done When |
|---|------|-----------|-----------|
| 1 | `npm init`, install all dependencies | ~30 min | `node -e "require('express')"` runs without error |
| 2 | Create Prisma schema, run `migrate dev` | ~30 min | `npx prisma studio` opens and shows empty tables |
| 3 | Scaffold Express app (`index.js`, folder structure, middleware) | ~30 min | `npm run dev` starts, `curl localhost:3001/api/health` returns `200` |
| 4 | `POST /api/sensor-data` route with validation | ~1 h | `curl -X POST -H "Content-Type: application/json" -H "X-API-Key: ..." -d '{"device_id":"desk-station-01","sensors":{"temperature":25.5,"humidity":62,"air_quality_raw":1050,"air_quality_level":"good"},"relay_state":false,"auto_mode":true}' localhost:3001/api/sensor-data` returns `201` |
| 5 | `GET /api/commands` + `POST /api/commands/ack` routes | ~1 h | `curl` GET returns `{"commands":[]}`. After creating a command, GET returns it. ACK marks it acked |
| 6 | `GET /api/dashboard/current` + `/history` routes | ~1 h | After posting sensor data, `curl localhost:3001/api/dashboard/current` returns the reading |
| 7 | `POST /api/dashboard/command` route | ~30 min | `curl -X POST ... -d '{"action":"set_relay","params":{"state":true}}' localhost:3001/api/dashboard/command` returns `201` with command_id |
| 8 | `POST /api/vapi/webhook` route (all tool handlers) | ~2 h | `test-vapi-call.sh` returns correct tool results for each tool |
| 9 | API key middleware | ~30 min | Request without `X-API-Key` returns `401`. Request with wrong key returns `401` |
| 10 | Command expiry logic (setInterval) | ~30 min | Create a command, wait 60 s, check status → shows `"expired"` |
| 11 | Test all endpoints with curl or Postman | ~1 h | Every endpoint returns correct status codes and shapes for valid and invalid inputs |
| 12 | Deploy to Railway (Dockerfile, env vars, MySQL) | ~1 h | `curl https://<app>.up.railway.app/api/health` returns `200` |
| 13 | Test with ngrok for Vapi webhook development | ~30 min | Vapi tool call reaches local server through ngrok tunnel |

**Total estimated time: ~10 hours**

---

## 14. Files and Folder Locations

| File / Folder | Purpose |
|--------------|---------|
| `backend/src/index.js` | Express app entry point, middleware setup, command expiry |
| `backend/src/routes/sensor.js` | `POST /api/sensor-data` — stores ESP32 readings |
| `backend/src/routes/command.js` | `GET /api/commands` + `POST /api/commands/ack` |
| `backend/src/routes/dashboard.js` | Dashboard endpoints (current, history, command) |
| `backend/src/routes/vapi.js` | Vapi webhook handler |
| `backend/src/middleware/auth.js` | API key validation middleware |
| `backend/src/lib/prisma.js` | Prisma client singleton |
| `backend/prisma/schema.prisma` | Database schema |
| `backend/.env.example` | Environment variable template |
| `backend/.env` | Local environment variables (NOT committed) |
| `backend/Dockerfile` | Docker image for Railway deployment |
| `backend/railway.json` | Railway deploy configuration |
| `backend/package.json` | Node.js project manifest and scripts |
| `tools/mocks/fake-esp32.py` | Simulates ESP32 for testing the backend |
| `tools/mocks/test-vapi-call.sh` | Simulates Vapi tool calls for testing webhook |

---

## 15. Acceptance Tests

### Test 1: Sensor Data Storage

```bash
# POST valid sensor data
curl -X POST http://localhost:3001/api/sensor-data \
  -H "Content-Type: application/json" \
  -H "X-API-Key: desk-station-secret-key-2026" \
  -d '{
    "device_id": "desk-station-01",
    "timestamp": 1700000000,
    "sensors": {
      "temperature": 25.5,
      "humidity": 62.0,
      "air_quality_raw": 1050,
      "air_quality_level": "good"
    },
    "relay_state": false,
    "auto_mode": true,
    "wifi_rssi": -45,
    "uptime_s": 3600
  }'

# Expected: 201 {"status":"ok","id":1}
```

**PASS** if status code is 201 and response contains `"status": "ok"`.

### Test 2: Command Queue (Empty)

```bash
curl -H "X-API-Key: desk-station-secret-key-2026" \
  "http://localhost:3001/api/commands?device_id=desk-station-01"

# Expected: 200 {"commands":[]}
```

**PASS** if status code is 200 and `commands` is an empty array.

### Test 3: Dashboard Command + Command Pickup

```bash
# Create a command
curl -X POST http://localhost:3001/api/dashboard/command \
  -H "Content-Type: application/json" \
  -H "X-API-Key: desk-station-secret-key-2026" \
  -d '{"action": "set_relay", "params": {"state": true}}'

# Expected: 201 {"status":"queued","command_id":"<uuid>"}

# Poll commands (ESP32 would do this)
curl -H "X-API-Key: desk-station-secret-key-2026" \
  "http://localhost:3001/api/commands?device_id=desk-station-01"

# Expected: 200 {"commands":[{"id":"<uuid>","action":"set_relay","params":{"state":true},...}]}
```

**PASS** if the queued command appears in the GET response.

### Test 4: Dashboard Current Reading

```bash
curl -H "X-API-Key: desk-station-secret-key-2026" \
  "http://localhost:3001/api/dashboard/current"

# Expected: 200 with the sensor reading posted in Test 1
```

**PASS** if temperature is 25.5, humidity is 62.0.

### Test 5: Authentication Rejection

```bash
# No API key
curl http://localhost:3001/api/dashboard/current
# Expected: 401 {"error":"Unauthorized: invalid or missing API key"}

# Wrong API key
curl -H "X-API-Key: wrong-key" http://localhost:3001/api/dashboard/current
# Expected: 401
```

**PASS** if both return 401.

### Test 6: fake-esp32.py Works Against Real Backend

```bash
# Start the backend
cd backend && npm run dev

# In another terminal, run the mock ESP32
cd tools/mocks && python fake-esp32.py

# Check that sensor data appears:
curl -H "X-API-Key: desk-station-secret-key-2026" \
  "http://localhost:3001/api/dashboard/current"
```

**PASS** if current reading shows randomised data from the mock script.

### Test 7: Railway Deployment

```bash
curl https://<your-app>.up.railway.app/api/health
# Expected: 200 {"status":"ok","uptime":...,"db":"connected"}
```

**PASS** if health check returns 200 with `"db": "connected"`.

---

## 16. Top Risks and Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | **Prisma migration fails** (schema mismatch, driver error) | Medium | High — can't store data | Use SQLite locally (zero-config). Only switch to MySQL on Railway. If MySQL migration fails, use `prisma db push` as a quick fix |
| 2 | **Railway free tier limits** (runs out of credits, DB storage full) | Low | High — API goes down | Delete old sensor readings with a cleanup query (`DELETE FROM sensor_readings WHERE created_at < NOW() - INTERVAL 7 DAY`). If Railway limits are hit, deploy to [Render](https://render.com/) as an alternative (also has a free tier) |
| 3 | **CORS errors from dashboard** | High | Medium — dashboard can't load data | Configure the `cors` package with the exact Vercel URL in `CORS_ORIGIN`. Test early by opening the dashboard and checking the browser console for CORS errors |
| 4 | **Vapi payload format changes** | Medium | High — voice commands break | Log `req.body` during development. Pin the Vapi SDK version. Have the `test-vapi-call.sh` script to test the handler independently |
| 5 | **Database connection drops on Railway** | Low | Medium — 503 errors | Prisma auto-reconnects. Add retry logic or a connection pool. The health check endpoint helps diagnose |
| 6 | **Cloud Lead gets stuck on Vapi webhook** (most complex route) | Medium | High — voice demo fails | Start with the simpler routes first (sensor, command, dashboard). The webhook is last. Use `test-vapi-call.sh` to develop the handler without Vapi. In the worst case, the typed fallback input in the dashboard still works |

### Fallback Plan

If the backend cannot be deployed to Railway in time:
1. **Run Express locally on the Cloud Lead's laptop** during the demo
2. **Use ngrok** to expose it publicly for Vapi
3. The dashboard can point to the ngrok URL
4. This is fragile but works for a 3-minute demo

---

> [!IMPORTANT]
> **Data cleanup:** The ESP32 sends data every 5 seconds. That's ~17,000 rows per day. After a week, you'll have >100,000 rows. Add a cleanup query to the expiry interval or a separate cron job:
> ```javascript
> // Delete readings older than 7 days
> await prisma.sensorReading.deleteMany({
>   where: { createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
> });
> ```
