# Teamwork Rules & Workflow

Four beginners working in parallel for 3 weeks succeed on **clear rules and zero hidden assumptions**. Follow these 10 rules from Day 1.

---

## 1. Git Branching Workflow

```
main   (always clean & working — demo-ready only)
 └── dev   (integration branch — everyone merges finished features here)
      ├── feature/M1-pin-map
      ├── feature/M2-dht22-oled
      ├── feature/M4-sensor-endpoint
      └── feature/M5-dashboard-ui
```

- **Never push directly to `main`.** Only the Integration Lead (D) merges `dev → main` after a passing Gate or integration test.
- Always create a branch off `dev`:
  ```bash
  git checkout dev
  git pull origin dev
  git checkout -b feature/M2-dht22-oled
  ```
- Keep branches small and merge every 1–2 days to avoid painful merge conflicts.

## 2. Branch & Commit Naming

- **Branch format:** `feature/M<number>-<short-kebab-desc>` (e.g., `feature/M3-button-debounce`).
- **Commit format:** `[M<number>] Short imperative description`
  - Good: `[M2] Add DHT22 NaN fallback to last known good value`
  - Bad: `fixed stuff`, `asdf`, `update`

## 3. Pull Requests & Testing Before Merge

Every PR into `dev` requires:
1. **1 review** from another team member (ideally Integration Lead or Backup Owner).
2. **A 1-line test note** in the PR description proving it was actually run:
   - Example: *"Tested on ESP32: DHT22 prints 26.4°C to Serial and OLED refreshes every 2 s."*
   - Example: *"Tested: `curl POST /api/sensor-data` returns 201 and row appears in Prisma Studio."*

## 4. Single Source of Truth for Pins

- `hardware/pin-map.md` (mirroring `01-interface-contracts.md` §1) is the **only source of truth** for wiring.
- **If you change a wire/GPIO:**
  1. Agree with both Firmware Lead (B) and Hardware Lead (C) first.
  2. Update `hardware/pin-map.md` and `firmware/desk-station/config.h` in the same commit.
  3. Post the change in the team group chat with `@all`.

## 5. Secrets Hygiene (Zero Tolerance)

- **NEVER commit** `.env`, `.env.local`, `config.h` with real Wi-Fi passwords/keys, Vapi private keys, or Telegram bot tokens.
- Keep `firmware/desk-station/config.example.h`, `backend/.env.example`, and `dashboard/.env.local.example` committed with placeholder values.
- Add `config.h` (or keep credentials in a separate gitignored `secrets.h` included by `config.h`) to `.gitignore` before the first push.

## 6. Daily 10-Minute Sync

Every evening at a fixed time (e.g., **10:00 PM** via WhatsApp/Messenger text or 10-min voice call), every member posts **3 lines**:
```text
Done today: <what you finished & tested>
Blocked on: <anything stopping you, or "None">
Plan next:  <next task from schedule>
```

## 7. The "1-Hour Blocked" Rule (Prevent Bottlenecks)

- **Never struggle silently for more than 1 hour.** If a library won't compile, a sensor returns `NaN`, or an API gives `500`, post the exact error + photo/screenshot in group chat immediately.
- Use the **mock scripts** (`fake-esp32.py`, `fake-backend.py`, `test-vapi-call.sh`) so nobody ever sits idle waiting for another person's module.
- **Backup coverage:** If any owner has an exam or falls behind, their **Backup Owner** picks up the next task on `dev`.

## 8. Cross-OS Compatibility (Mac + Ubuntu + 2× Windows)

- **Line endings:** Add `* text=auto eol=lf` in `.gitattributes` so Windows CRLF vs Mac/Linux LF doesn't create fake git diffs.
- **Database:** Use **SQLite** locally so nobody struggles installing MySQL across 3 different OSes; use **MySQL** via `DATABASE_URL` on Railway.
- **Node & Python:** Pin Node.js `20 LTS` and Python `3.10+`; never commit `node_modules/`, `.venv/`, or `__pycache__/`.

## 9. Code Formatting

- **Arduino/C++:** Press `Ctrl+T` (`Cmd+T` on Mac) in Arduino IDE before committing.
- **Backend / Dashboard JS/TS:** Use Prettier / ESLint defaults (`npx prettier --write .` or editor format-on-save).

## 10. Document Surprises Immediately

Whenever hardware behaves unexpectedly (e.g., *"Our OLED uses address `0x3D` instead of `0x3C`"*, *"Our relay is active HIGH"*), write a 1-line note in `hardware/assembly-notes.md` immediately so nobody repeats the same debugging twice.

