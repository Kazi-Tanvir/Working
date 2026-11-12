# Module M5 — Dashboard

> **Owner:** Cloud Lead (A) · **Backup:** Integration Lead (D)

---

## 1. Purpose

A Next.js web application that shows live sensor data (temperature, humidity, air quality) as gauges, a relay on/off toggle, auto-mode toggle, a 24-hour history chart, and an embedded Vapi voice widget. The dashboard polls the Express backend every 3 seconds using SWR. It is the **second most impressive** demo element after voice — judges will see it on the laptop screen.

---

## 2. Inputs & Outputs

| Direction | What | From/To |
|-----------|------|---------|
| **Input** | Sensor data + command status via REST | ← M4 (Express API) |
| **Output** | Relay / auto-mode commands via REST | → M4 → ESP32 |
| **Output** | Visual display for judges | → Demo |

---

## 3. Dependencies & Stubs

| Dependency | Blocking? | Workaround |
|-----------|-----------|------------|
| M4 (Backend API) | Partially | Can develop UI components with hardcoded mock data first. Then switch to real API |
| M6 (Voice) | No | VoicePanel is an independent component, added last |

**Stub:** Create a file `src/lib/mock-data.ts` with hardcoded sensor readings for UI development before the backend is ready.

---

## 4. Task List

| # | Task | Hours | Done When |
|---|------|-------|-----------|
| 1 | Create Next.js app: `npx create-next-app@latest dashboard --typescript --tailwind --app --src-dir` | 0.5 | App runs on localhost:3000, shows default page |
| 2 | Install dependencies: `npm install swr recharts` | 0.15 | Packages in package.json |
| 3 | Create API helper `src/lib/api.ts` | 0.25 | fetchAPI function works with env vars |
| 4 | Build SensorGauge component (temp, humidity, air quality cards) | 1.5 | Three cards show values, colour-coded by severity |
| 5 | Build RelayToggle component (on/off switch + auto-mode checkbox) | 1.0 | Toggle sends POST to backend. Shows pending/confirmed state |
| 6 | Build HistoryChart component (24h line chart with recharts) | 1.5 | Line chart renders temperature over time. X-axis = time, Y-axis = °C |
| 7 | Build StatusBar component (device online/offline, last seen, Wi-Fi RSSI) | 0.5 | Shows green "Online" when data is fresh, red "Offline" when stale > 30 s |
| 8 | Assemble main page layout (responsive grid) | 1.0 | All components laid out, looks good on 13" laptop |
| 9 | Add SWR polling (refreshInterval: 3000) | 0.5 | Data auto-refreshes every 3 s without page reload |
| 10 | Add VoicePanel placeholder (integrated in M6) | 0.5 | Mic button visible in corner |
| 11 | Add .env.local.example, configure for local + production | 0.25 | Env vars documented |
| 12 | Deploy to Vercel | 0.5 | Live at *.vercel.app, shows data from Railway backend |
| 13 | Cross-browser test (Chrome + Firefox) | 0.25 | Both browsers render correctly |
| | **Total** | **~8.5 h** | |

---

## 5. Files & Folder Locations

```
dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main dashboard page
│   │   ├── layout.tsx            # Root layout with metadata
│   │   └── globals.css           # Tailwind imports
│   ├── components/
│   │   ├── SensorGauge.tsx       # Temp/Humidity/AQ cards
│   │   ├── RelayToggle.tsx       # Fan ON/OFF switch
│   │   ├── AutoModeToggle.tsx    # Auto-threshold checkbox
│   │   ├── HistoryChart.tsx      # 24h line chart
│   │   ├── StatusBar.tsx         # Online/offline indicator
│   │   ├── VoicePanel.tsx        # Vapi Web SDK (from M6)
│   │   └── TodoList.tsx          # SHOULD tier: to-do display
│   └── lib/
│       ├── api.ts                # Fetch helper with API key
│       └── mock-data.ts          # Hardcoded data for dev without backend
├── public/
│   └── favicon.ico
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
├── .env.local.example            # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_API_KEY
└── vercel.json                   # Optional: rewrites/redirects
```

---

## 6. Key Code

### 6.1 .env.local.example

```env
# Copy to .env.local and fill in values. NEVER commit .env.local!
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_KEY=desk-station-secret-key-2026
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your-vapi-public-key-here
```

### 6.2 src/lib/api.ts

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

export async function fetchAPI(path: string) {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'X-API-Key': API_KEY },
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
    return res.json();
}

export async function postAPI(path: string, body: object) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY,
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
    return res.json();
}
```

### 6.3 SensorGauge Component

```tsx
'use client';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';

function getAQColor(level: string) {
    switch (level) {
        case 'good': return 'bg-green-100 text-green-800 border-green-300';
        case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case 'poor': return 'bg-red-100 text-red-800 border-red-300';
        default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
}

export default function SensorGauge() {
    const { data, error, isLoading } = useSWR(
        '/api/dashboard/current',
        (url) => fetchAPI(url),
        { refreshInterval: 3000 }  // Poll every 3 seconds
    );

    if (isLoading) return (
        <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="p-6 bg-gray-50 rounded-xl animate-pulse h-32" />
            ))}
        </div>
    );

    if (error) return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
            ⏳ Waiting for device data...
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Temperature */}
            <div className="p-6 bg-white rounded-xl shadow-sm border">
                <p className="text-sm text-gray-500 mb-1">🌡️ Temperature</p>
                <p className="text-4xl font-bold text-gray-900">
                    {data.temperature.toFixed(1)}°C
                </p>
                {data.temperature > 30 && (
                    <p className="text-xs text-red-500 mt-1">⚠️ Above threshold</p>
                )}
            </div>

            {/* Humidity */}
            <div className="p-6 bg-white rounded-xl shadow-sm border">
                <p className="text-sm text-gray-500 mb-1">💧 Humidity</p>
                <p className="text-4xl font-bold text-gray-900">
                    {data.humidity.toFixed(0)}%
                </p>
            </div>

            {/* Air Quality */}
            <div className={`p-6 rounded-xl shadow-sm border ${getAQColor(data.airQualityLevel)}`}>
                <p className="text-sm opacity-75 mb-1">🌬️ Air Quality</p>
                <p className="text-4xl font-bold capitalize">
                    {data.airQualityLevel}
                </p>
                <p className="text-xs opacity-60 mt-1">Raw: {data.airQualityRaw}</p>
            </div>
        </div>
    );
}
```

### 6.4 RelayToggle Component

```tsx
'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { fetchAPI, postAPI } from '@/lib/api';

export default function RelayToggle() {
    const { data, mutate } = useSWR(
        '/api/dashboard/current',
        (url) => fetchAPI(url),
        { refreshInterval: 3000 }
    );
    const [pending, setPending] = useState(false);

    const toggle = async () => {
        if (!data || pending) return;
        setPending(true);
        try {
            await postAPI('/api/dashboard/command', {
                action: 'set_relay',
                params: { state: !data.relayState },
            });
            // Optimistic update
            mutate({ ...data, relayState: !data.relayState }, false);
        } catch (err) {
            console.error('Failed to toggle relay:', err);
        }
        // Clear pending after a few seconds (ESP32 should ACK by then)
        setTimeout(() => setPending(false), 5000);
    };

    if (!data) return null;

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">Fan Control</p>
                    <p className="text-2xl font-bold">
                        {data.relayState ? '🟢 ON' : '⚪ OFF'}
                    </p>
                    {pending && <p className="text-xs text-yellow-500">Sending...</p>}
                </div>
                <button
                    onClick={toggle}
                    disabled={pending}
                    className={`w-16 h-8 rounded-full transition-colors relative ${
                        data.relayState ? 'bg-green-500' : 'bg-gray-300'
                    } ${pending ? 'opacity-50' : ''}`}
                >
                    <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                        data.relayState ? 'translate-x-9' : 'translate-x-1'
                    }`} />
                </button>
            </div>
            <div className="mt-3 text-sm text-gray-500">
                Auto Mode: {data.autoMode ? 'ON (> 30°C)' : 'OFF (manual)'}
            </div>
        </div>
    );
}
```

### 6.5 HistoryChart Component

```tsx
'use client';
import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function HistoryChart() {
    const { data, error } = useSWR(
        '/api/dashboard/history?hours=1',  // Last 1 hour for demo
        (url) => fetchAPI(url),
        { refreshInterval: 30000 }  // Refresh chart every 30 s
    );

    if (!data?.readings?.length) {
        return (
            <div className="p-6 bg-white rounded-xl shadow-sm border">
                <p className="text-sm text-gray-500">📈 History</p>
                <p className="text-center text-gray-400 py-8">Collecting data...</p>
            </div>
        );
    }

    // Format timestamps for chart
    const chartData = data.readings.reverse().map((r: any) => ({
        time: new Date(r.createdAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        temperature: r.temperature,
        humidity: r.humidity,
        airQuality: r.airQualityRaw,
    }));

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500 mb-4">📈 Sensor History (Last Hour)</p>
            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ef4444" name="Temp (°C)" dot={false} />
                    <Line yAxisId="left" type="monotone" dataKey="humidity" stroke="#3b82f6" name="Humidity (%)" dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="airQuality" stroke="#22c55e" name="Air Quality (raw)" dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
```

### 6.6 Main Page Layout

```tsx
// src/app/page.tsx
import SensorGauge from '@/components/SensorGauge';
import RelayToggle from '@/components/RelayToggle';
import HistoryChart from '@/components/HistoryChart';
import StatusBar from '@/components/StatusBar';

export default function Home() {
    return (
        <main className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">
                        🖥️ Desk Station
                    </h1>
                    <StatusBar />
                </div>

                {/* Sensor Gauges */}
                <SensorGauge />

                {/* Controls Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <RelayToggle />
                    {/* VoicePanel added here in M6 */}
                </div>

                {/* History Chart */}
                <HistoryChart />
            </div>
        </main>
    );
}
```

### 6.7 Vercel Deployment Steps

```bash
# 1. Push dashboard/ to GitHub (it's already part of the monorepo)

# 2. Go to https://vercel.com → "Add New Project" → Import from GitHub

# 3. Set Root Directory to "dashboard"

# 4. Set environment variables in Vercel dashboard:
#    NEXT_PUBLIC_API_URL = https://your-app.up.railway.app
#    NEXT_PUBLIC_API_KEY = desk-station-secret-key-2026
#    NEXT_PUBLIC_VAPI_PUBLIC_KEY = your-vapi-public-key

# 5. Deploy. Vercel auto-detects Next.js and builds.

# 6. Visit the generated URL (*.vercel.app)
```

---

## 7. Acceptance Test

| Step | Action | Expected | Pass? |
|------|--------|----------|-------|
| 1 | `npm run dev` in dashboard/ folder | Runs on localhost:3000 | ☐ |
| 2 | Backend running + fake-esp32.py sending data | Dashboard shows temperature, humidity, air quality | ☐ |
| 3 | Wait 10 s without refreshing page | Values update automatically (SWR polling) | ☐ |
| 4 | Click relay toggle | Toggle switches, "Sending..." appears briefly | ☐ |
| 5 | Check backend logs | Command created with status "pending" | ☐ |
| 6 | Let fake-esp32 run for 5+ minutes | History chart shows data points | ☐ |
| 7 | Stop fake-esp32 for 30 s | Status bar shows "Offline" or "Waiting..." | ☐ |
| 8 | Open in Firefox | Same layout, no visual bugs | ☐ |
| 9 | Deploy to Vercel | *.vercel.app shows data from Railway backend | ☐ |

---

## 8. Top Risks & Fallbacks

| Risk | Likelihood | Mitigation | Fallback |
|------|-----------|------------|----------|
| CORS errors from Vercel → Railway | High | Configure `cors` package in backend with Vercel domain | Add wildcard `*` for demo (not production) |
| SWR not refreshing | Low | Verify `refreshInterval` prop is set | Add manual refresh button |
| Recharts bundle too large | Low | Tree-shaking is automatic with Next.js | Use a simpler chart (e.g., a plain `<canvas>`) |
| Vercel build fails | Low | Check build logs. Most issues are TypeScript errors | Run `npm run build` locally first |
| Dashboard looks bad on venue projector | Medium | Design for 1366×768 minimum. Use large fonts | Zoom browser to 150% |

