# Module M6 — Voice Agent

> **Owner:** Cloud Lead (A) · **Backup:** Firmware Lead (B)

---

## 1. Purpose

Browser-based voice control using the **Vapi Web SDK**. The user speaks a command ("turn the fan on"), Vapi transcribes it, identifies the intent, calls the matching tool, the tool handler on the Express backend queues a command for the ESP32, and Vapi speaks the result back. This is the **most impressive demo feature** and the most fragile — so it has three fallback layers.

### What is Vapi?

Vapi is a voice AI platform (SaaS). You configure a voice assistant in their dashboard, give it tools (functions it can call), and embed a small SDK in your web page. When the user speaks, Vapi handles: audio capture → speech-to-text → intent/tool matching → calling your backend → text-to-speech for the reply. You don't build any of this yourself — you just write the tool handler on your backend.

---

## 2. Inputs & Outputs

| Direction | What | From/To |
|-----------|------|---------|
| **Input** | User's voice via browser microphone | ← User |
| **Input** | Tool call from Vapi (HTTP POST) | ← Vapi servers |
| **Output** | Spoken response via browser speaker | → User |
| **Output** | Command row created in database | → M4 → ESP32 |

---

## 3. Dependencies & Stubs

| Dependency | Blocking? | Workaround |
|-----------|-----------|------------|
| M4 (Backend deployed with public URL) | **Yes** for Vapi tool calls | Use `test-vapi-call.sh` (curl) to test webhook handler locally via ngrok. Develop handler before connecting Vapi |
| M5 (Dashboard for VoicePanel embed) | No — can test Vapi in a standalone HTML page first | Create a simple test page with just the Vapi SDK |
| Vapi account (free tier) | **Yes** | Sign up at [vapi.ai](https://vapi.ai) on Day 1 |

**Stub:** The `test-vapi-call.sh` script simulates what Vapi sends to the backend, so you can develop and test the webhook handler without configuring Vapi at all.

```bash
#!/bin/bash
# tools/mocks/test-vapi-call.sh
# Simulates a Vapi tool call to the backend
# Usage: ./test-vapi-call.sh [set_relay|get_sensor_data]

BACKEND_URL="${1:-http://localhost:3001}"
ACTION="${2:-get_sensor_data}"

if [ "$ACTION" = "set_relay" ]; then
    ARGS='{"state": true}'
elif [ "$ACTION" = "get_sensor_data" ]; then
    ARGS='{}'
else
    ARGS='{}'
fi

curl -X POST "$BACKEND_URL/api/vapi/webhook" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: desk-station-secret-key-2026" \
  -d "{
    \"message\": {
      \"type\": \"tool-calls\",
      \"toolCalls\": [{
        \"id\": \"call_test_$(date +%s)\",
        \"function\": {
          \"name\": \"$ACTION\",
          \"arguments\": \"$(echo $ARGS | sed 's/"/\\\\"/g')\"
        }
      }]
    }
  }"

echo ""
```

---

## 4. Task List

| # | Task | Hours | Done When |
|---|------|-------|-----------|
| 1 | Create Vapi account. Explore dashboard. Read [Vapi docs on tool calling](https://docs.vapi.ai) [VERIFY URL] | 0.5 | Account created, docs read |
| 2 | Create a Vapi assistant in dashboard. Set name, system prompt, voice | 0.5 | Assistant visible in Vapi dashboard |
| 3 | Add tool definitions to assistant (get_sensor_data, set_relay, set_auto_mode) | 0.5 | Tools listed in assistant config |
| 4 | Set Server URL in Vapi assistant config to ngrok URL (for dev) or Railway URL (for prod) | 0.25 | URL configured |
| 5 | Test webhook handler with `test-vapi-call.sh` curl script | 0.5 | Backend returns correct JSON for each tool |
| 6 | Install Vapi Web SDK in dashboard: `npm install @vapi-ai/web` | 0.15 | Package in package.json |
| 7 | Build VoicePanel component with start/stop/push-to-talk buttons | 1.5 | Mic button visible, starts/stops Vapi session |
| 8 | Test end-to-end: speak → Vapi → tool call → backend → command → ESP32 → relay | 1.0 | "Turn the fan on" toggles relay within 5 s |
| 9 | Test voice query: "What's the temperature?" → spoken reply | 0.5 | Hear temperature value spoken back |
| 10 | Build typed command fallback input | 1.0 | Text field with "Send" button, same commands work as text |
| 11 | Record fallback demo video (screen + audio capture) | 0.5 | 1-minute video of voice demo working |
| 12 | Add SHOULD-tier tools (add_todo, get_todos, start_pomodoro) | 0.5 | Voice "add item to list" works |
| | **Total** | **~7.5 h** | |

---

## 5. Files & Folder Locations

```
dashboard/src/components/
├── VoicePanel.tsx        # Vapi Web SDK integration
└── TypedCommand.tsx      # Typed fallback for voice

tools/mocks/
├── test-vapi-call.sh     # Curl script to test webhook

backend/src/routes/
└── vapi.js               # Webhook handler (already in M4)
```

---

## 6. Key Code

### 6.1 Vapi Assistant System Prompt

Configure this in the Vapi dashboard under your assistant's settings:

```
You are Desk Station, a smart study desk assistant. You help the user monitor their study environment and control desk devices.

You can:
- Check sensor readings (temperature, humidity, air quality)
- Turn the fan on or off
- Enable or disable automatic fan control
- Manage a study to-do list
- Start a Pomodoro study timer

Be brief and friendly. When reporting sensor data, say the values naturally: "The temperature is 25.5 degrees Celsius, humidity is 62 percent, and the air quality is good."

When turning the fan on or off, confirm the action: "Done, I've turned the fan on."

If asked about something you can't do, say: "I can't do that yet, but you can try the dashboard."
```

### 6.2 Vapi Tool Configuration (in Vapi Dashboard)

Add these tools in the Vapi assistant's "Tools" section. Set "Type" to "function" and "Server URL" to your Express backend:

**Tool 1: get_sensor_data**
- Name: `get_sensor_data`
- Description: `Get the current temperature, humidity, and air quality from the desk sensors.`
- Parameters: (none — empty object)

**Tool 2: set_relay**
- Name: `set_relay`
- Description: `Turn the fan on or off. Use when the user wants to control the fan.`
- Parameters:
  - `state` (boolean, required): `true to turn ON, false to turn OFF`

**Tool 3: set_auto_mode**
- Name: `set_auto_mode`
- Description: `Enable or disable automatic fan control based on temperature.`
- Parameters:
  - `enabled` (boolean, required): `true to enable, false to disable`

### 6.3 VoicePanel Component

```tsx
// dashboard/src/components/VoicePanel.tsx
'use client';
import { useState, useEffect, useRef } from 'react';

// Vapi Web SDK — import after npm install @vapi-ai/web
import Vapi from '@vapi-ai/web';

const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';
const VAPI_ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || '';
// [VERIFY] Check Vapi docs for exact SDK usage and constructor options

export default function VoicePanel() {
    const [isActive, setIsActive] = useState(false);
    const [status, setStatus] = useState<string>('Click mic to start');
    const [transcript, setTranscript] = useState<string>('');
    const vapiRef = useRef<any>(null);

    useEffect(() => {
        // Initialize Vapi client
        const vapi = new Vapi(VAPI_PUBLIC_KEY);

        vapi.on('call-start', () => {
            setStatus('Listening...');
            setIsActive(true);
        });

        vapi.on('call-end', () => {
            setStatus('Click mic to start');
            setIsActive(false);
        });

        vapi.on('speech-start', () => {
            setStatus('Speaking...');
        });

        vapi.on('speech-end', () => {
            setStatus('Processing...');
        });

        vapi.on('message', (msg: any) => {
            // [VERIFY] Exact event names and payload shapes from Vapi Web SDK docs
            if (msg.type === 'transcript' && msg.transcriptType === 'final') {
                setTranscript(msg.transcript);
            }
        });

        vapi.on('error', (err: any) => {
            console.error('Vapi error:', err);
            setStatus('Error — try again');
            setIsActive(false);
        });

        vapiRef.current = vapi;

        return () => {
            vapi.stop();
        };
    }, []);

    const toggleVoice = async () => {
        if (isActive) {
            vapiRef.current?.stop();
        } else {
            try {
                setStatus('Connecting...');
                await vapiRef.current?.start(VAPI_ASSISTANT_ID);
            } catch (err) {
                console.error('Failed to start Vapi:', err);
                setStatus('Mic permission denied?');
            }
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500 mb-3">🎤 Voice Control</p>

            <div className="flex items-center gap-4">
                <button
                    onClick={toggleVoice}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all ${
                        isActive
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                >
                    {isActive ? '⏹' : '🎤'}
                </button>

                <div>
                    <p className="text-sm font-medium">{status}</p>
                    {transcript && (
                        <p className="text-xs text-gray-400 mt-1">"{transcript}"</p>
                    )}
                </div>
            </div>

            <p className="text-xs text-gray-400 mt-3">
                Try: "What's the temperature?" or "Turn the fan on"
            </p>
        </div>
    );
}
```

### 6.4 TypedCommand Fallback

```tsx
// dashboard/src/components/TypedCommand.tsx
'use client';
import { useState } from 'react';
import { postAPI } from '@/lib/api';

const COMMAND_MAP: Record<string, { action: string; params: object }> = {
    'fan on':      { action: 'set_relay', params: { state: true } },
    'fan off':     { action: 'set_relay', params: { state: false } },
    'auto on':     { action: 'set_auto_mode', params: { enabled: true } },
    'auto off':    { action: 'set_auto_mode', params: { enabled: false } },
    'red':         { action: 'set_rgb', params: { r: 255, g: 0, b: 0 } },
    'green':       { action: 'set_rgb', params: { r: 0, g: 255, b: 0 } },
    'blue':        { action: 'set_rgb', params: { r: 0, g: 0, b: 255 } },
    'buzz':        { action: 'buzz', params: { duration_ms: 200, count: 3 } },
};

export default function TypedCommand() {
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');

    const send = async () => {
        const cmd = input.toLowerCase().trim();
        const match = COMMAND_MAP[cmd];
        if (match) {
            try {
                await postAPI('/api/dashboard/command', match);
                setResult(`✅ Sent: ${match.action}`);
            } catch (err) {
                setResult('❌ Failed to send');
            }
        } else {
            setResult(`❓ Unknown: "${cmd}". Try: fan on, fan off, auto on, auto off`);
        }
        setInput('');
    };

    return (
        <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-400 mb-2">💬 Typed Command (fallback)</p>
            <div className="flex gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && send()}
                    placeholder="fan on / fan off / auto on..."
                    className="flex-1 px-3 py-1 text-sm border rounded"
                />
                <button onClick={send} className="px-3 py-1 text-sm bg-blue-500 text-white rounded">
                    Send
                </button>
            </div>
            {result && <p className="text-xs mt-1">{result}</p>}
        </div>
    );
}
```

---

## 7. Acceptance Test

| Step | Action | Expected | Pass? |
|------|--------|----------|-------|
| 1 | Open dashboard with VoicePanel visible | Mic button appears | ☐ |
| 2 | Click mic button | Browser asks for mic permission. Status: "Connecting..." then "Listening..." | ☐ |
| 3 | Say "What's the temperature?" | Hear spoken reply with temperature value | ☐ |
| 4 | Say "Turn the fan on" | Hear confirmation. Relay clicks within 5 s | ☐ |
| 5 | Say "Turn the fan off" | Relay clicks off. Hear confirmation | ☐ |
| 6 | Click mic button again | Voice session stops. Status: "Click mic to start" | ☐ |
| 7 | Type "fan on" in typed command fallback | Relay toggles. Shows "✅ Sent: set_relay" | ☐ |
| 8 | Test in noisy environment (play music) | Push-to-talk still works at 30 cm distance | ☐ |
| 9 | Check fallback video exists | 1-min screen recording of working voice demo | ☐ |

---

## 8. Top Risks & Fallbacks

| Risk | Likelihood | Mitigation | Fallback |
|------|-----------|------------|----------|
| Venue noise kills voice recognition | **High** | Use push-to-talk (click mic, speak close, click stop). Train team to speak clearly | Typed command fallback. Pre-recorded video |
| Browser denies mic permission | Medium | Use Chrome (most permissive). Test beforehand. Use HTTPS (Vercel provides it) | Typed command fallback |
| Vapi free tier limit hit before demo | Medium | Check usage 2 days before. Don't waste calls during testing | Pre-recorded video of voice demo |
| Vapi webhook format changes | Low | Log `req.body` during development. Hardcode expected format | Adjust handler. Use test-vapi-call.sh to verify |
| Vapi latency > 5 s | Medium | Acceptable for demo — judges understand AI takes time | Warn judges: "It takes a few seconds to process" |
| Network issue blocks Vapi | Medium | Vapi needs internet. Use phone hotspot as reliable connection | Typed commands work via local network. Physical buttons always work |

### Fallback Ladder (detailed)

```
Level 1: Voice works perfectly → Full demo as scripted
Level 2: Voice flaky → Switch to push-to-talk (click mic, speak, click stop)
Level 3: Push-to-talk fails → Use typed command input on dashboard
Level 4: Dashboard fails → Physical buttons + OLED (still impressive!)
Level 5: Everything fails → Play pre-recorded demo video on laptop
```

> [!IMPORTANT]
> **Record the demo video during Week 3** when everything works. Screen-capture with audio (use OBS Studio or Windows Game Bar). This is your insurance policy. Even if nothing else works, you can show judges the video and explain the architecture.

