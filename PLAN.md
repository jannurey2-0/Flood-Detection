# Automated Flood Detection and Flood Control System — Project Plan

A three-part system for a Philippine barangay:

1. **Weather & Advisory Web App** (Barangay Hall) — 5-day forecast + flood/rainfall alerts
2. **River Monitoring Station** — live water level sensing, reports to the web app
3. **Automated Flood Barrier** — 12V linear actuator raises the barrier when water crosses a critical threshold

> **Scope framing (read this first):** A small 12V linear actuator cannot hold back real flood water. This plan designs the system as a **functional prototype / scale model** — full electronics, software, and control logic running end-to-end on a scaled flood channel. That is the standard approach for capstone/community projects and is fully demonstrable. Real deployment would require civil/structural engineering (the water force math is in Section 5.1).

---

## 1. System Architecture

```
[River Station — ESP32]                 [Server / Cloud]              [Barangay Hall — any browser]
  JSN-SR04T ultrasonic  ─┐
  Float switch (failsafe)├──► Wi-Fi POST /readings ──► API ──► Postgres ──► Next.js Dashboard
  2-ch relay ─ actuator  ┘    poll /commands every 5s      │            ├─ live water level gauge + chart
                             (Open-Meteo fetch, 10-min cache)│            ├─ 5-day forecast cards
  Buzzer + status LEDs                                    └─ alerts ────┤
                                                                                          └─ Telegram / SMS alerts
```

**Golden rule:** the barrier decision happens **on the ESP32, locally**. The internet can die mid-storm — the station must still deploy the barrier on its own. The cloud is for monitoring, history, weather, and remote manual override only.

---

## 2. Subsystem A — Weather & Advisory Web App

### 2.1 Weather data source

| Option | Verdict | Why |
|---|---|---|
| **Open-Meteo** ✅ recommended | Use this | Free, **no API key**, no signup, generous limits, daily forecasts up to 16 days, includes precipitation (mm), rain probability, and precipitation probability. Perfect for a barangay project. |
| OpenWeatherMap | Alternative | Free tier works (5-day/3-hour forecast) but needs an API key and has call limits. |
| PAGASA | Supplement only | The official source for PH warnings, but no public API. Have the dashboard link to PAGASA advisories; never scrape. |

Fetch server-side (never from the browser) and cache for 10–15 minutes so you stay well within Open-Meteo's limits.

**Forecast endpoint example:**
```
https://api.open-meteo.com/v1/forecast
  ?latitude=14.XX&longitude=121.XX
  &daily=precipitation_sum,precipitation_probability_max,rain_sum,weather_code
  &hourly=precipitation
  &forecast_days=5&timezone=Asia%2FManila
```

### 2.2 Recommended stack

| Layer | Choice | Justification |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | One codebase for UI + API routes; you're already a dev; huge ecosystem; deploys free on Vercel. |
| Database | **Supabase (Postgres)** | Free tier, real Postgres, **Realtime subscriptions** = live water-level updates pushed to the dashboard without polling. |
| Charts | **Recharts** | Simple, React-native. |
| Hosting | **Vercel + Supabase cloud** | Both free tier, zero server maintenance. If the barangay insists on fully offline, an alternative is a mini-PC running Node + SQLite in the hall — more maintenance, only do it if required. |

### 2.3 Dashboard features

**MVP (build these first):**
- Live water level — gauge + live-updating line chart (last 24h)
- Station health — last-seen timestamp, Wi-Fi signal, battery voltage
- 5-day forecast cards (rainfall mm, rain probability, condition icon)
- Alert banner levels (see Section 7)
- Barrier status: UP / DOWN / MOVING / FAULT, with manual UP/DOWN buttons (confirmation dialog + audit log)

**Later / nice-to-have:**
- Historical data + flood event replay
- Threshold settings page (admin only)
- Alert history with acknowledgment
- Multi-station support

### 2.4 Alert channels (recommended order)

1. **In-app banner + audible alarm** at the hall PC (free, instant)
2. **Telegram bot** messages to barangay officials' group — free, reliable, everyone in PH has Telegram; sending a message is one HTTPS call from the server (or even from the ESP32 directly)
3. **SMS via a GSM module (SIM800L + cheap SIM)** at the station — for when internet is down during a storm; costs prepaid load, use only for critical alerts

---

## 3. Subsystem B — River Monitoring Station (Sensing)

### 3.1 Water level sensor — options

| Option | Verdict | Why |
|---|---|---|
| **JSN-SR04T waterproof ultrasonic** ✅ recommended | Use this | Non-contact (nothing touches the dirty flood water), waterproof probe, ~₱300–600 on Shopee, range 25 cm – 4.5 m. Mount it on a bracket/gantry at a fixed known height, pointing down at the water; level = mount height − measured distance. |
| Float switch array | ✅ add 1–2 as backup | Dirt-cheap (~₱80 each), extremely reliable, no calibration. Put one at the critical height as a **cross-check/failsafe** for the ultrasonic. |
| HC-SR04 (standard ultrasonic) | Bench only | Not weatherproof. Good for desk testing before the JSN-SR04T arrives. |
| Submersible pressure transducer | Skip for now | Most accurate continuous reading but ₱1,500+ and needs an ADC board. Overkill for v1. |

**Key gotchas for ultrasonic:**
- **Blind zone:** JSN-SR04T cannot read anything closer than ~25 cm — mount the sensor at least 25 cm above the highest expected water level (plus the max wave height).
- **Beam cone:** it "sees" a cone ~45° wide. Keep it away from walls/pipes; make sure the cone always lands on water (or the dry channel bed when water is absent — that's fine, you'll just read "very low").
- **Noise filtering:** take 5 readings, use the **median**, publish every 2–5 s internally; report to server every 30 s.
- Foam, heavy rain on the surface, and debris can cause bad readings — this is exactly why the float-switch cross-check exists.

### 3.2 Calibration

```
water_level_cm = mount_height_cm − measured_distance_cm
```
- Measure `mount_height_cm` precisely (from sensor face to the channel bed / zero-level reference) with a tape.
- During commissioning, place water at known depths (mark a ruler on the channel wall) and verify sensor readings; adjust the offset constant in firmware.
- Log both raw distance and computed level — you'll want the raw value when debugging mounting issues.

---

## 4. Subsystem C — Automated Flood Barrier (Actuation)

### 4.1 How much force does water actually exert?

Hydrostatic force on a vertical panel:

```
F ≈ 4,900 × h² × w   (News; h = water depth in m, w = panel width in m)
```

Examples:
- Scale model: 20 cm of water on a 30 cm-wide panel → ~59 N → a 100–250 N mini actuator handles it ✅
- Real deployment: 0.8 m of water on a 3 m-wide barrier → ~9,400 N → **no 12V actuator survives this** ❌ (that's a hydraulic/civil structure project)

This is why v1 is a scale model. Size your model panel so the math works out.

### 4.2 Recommended mechanism — vertical lift panel

- A panel sits **flush in a slot across the channel** (like a road surface); guide rails on both sides.
- The **actuator sits vertically underneath the panel** and pushes it up to deploy.
- Use an actuator with an **acme lead screw** — these are **self-locking when unpowered**, so:
  - Power cut mid-flood → barrier stays UP (fail-safe) ✅
  - Actuator/mount failure → panel drops DOWN → deployed (fail-safe) ✅
  - Gravity holds the panel flush in normal times; the actuator doesn't fight gravity constantly.
- Seal the panel edges with rubber gasket strips; add drainage to the slot (or it becomes a muddy well).

### 4.3 Actuator spec (what to order on Shopee PH)

| Spec | Recommendation | Notes |
|---|---|---|
| Voltage | 12V DC | as planned |
| Stroke | 100–150 mm | must be ≥ channel depth you want to block |
| Force | 150–250 N (mini class) | check against Section 4.1 math for your panel size |
| Built-in limit switches | **Yes — non-negotiable** | Actuator stops itself at full extend/retract so you can't burn the motor |
| Feedback (optional) | Hall-effect pulse or potentiometer variant | Pricier; v1 can use two external micro limit switches instead (cheaper and easier to debug) |
| Budget | ₱1,800–3,500 | Search "12V mini linear actuator 100mm/150mm" |

**Position detection for v1:** two micro limit switches — one at fully-deployed, one at fully-retracted. The ESP32 knows exactly three states: DOWN (bottom switch), MOVING (neither), UP (top switch). Simple, debuggable, honest.

### 4.4 Motor driver

| Option | Verdict | Why |
|---|---|---|
| **2-channel 10A relay module** ✅ recommended for v1 | Use this | Two SPDT relays wired to reverse polarity = extend/retract. Dead simple, isolated, cheap (~₱80–150). Works because the actuator's own limit switches stop travel. |
| BTS7960 H-bridge (~₱200) | Alternative | Enables PWM speed control and current sensing (stall detection), no moving parts. Choose this if your actuator lacks limit switches, or later when you want stall alerts. |

**Relay wiring rules (important):**
- Relays reverse polarity by crossing the two SPDT outputs. **Never energize both relays at once** — enforce in code with a mandatory 200 ms dead-time between direction changes, and physically label the wiring.
- Buy a relay module whose trigger works at **3.3 V logic** (ESP32 is 3.3 V, not 5 V). Most opto-isolated modules triggered LOW work fine — verify in reviews before ordering.
- Give the actuator its own **12 V feed directly from the PSU** — never route actuator current through the breadboard/perfboard.

### 4.5 Power budget

| Item | Draw | Notes |
|---|---|---|
| ESP32 | ~0.2 A @ 5 V | Feed from a small buck converter off the 12 V rail |
| Actuator | 2–5 A running, up to ~8 A stall | This dominates sizing |
| **PSU** | **12 V 5 A minimum, 12 V 6 A comfortable** | ~₱300–500 |
| Backup | 12 V SLA or LiFePO4 battery + charging board, OR a small UPS for the station | Power outage during a storm is *the* expected scenario — station must survive it and report low-battery |

---

## 5. Connectivity — how the station talks to the server

Decision rule based on the real distance between the river bank and the nearest usable Wi-Fi (do this in the site survey, Section 10 Phase 0):

| Option | Range | Cost | Complexity | When to choose |
|---|---|---|---|---|
| **Wi-Fi (station joins a router/hotspot)** ✅ default | ~30–50 m indoor, less through walls | ₱0 | Lowest | River is near the hall / a household willing to share Wi-Fi. **Start here for the prototype regardless** — the bench demo runs on your home Wi-Fi. |
| ESP-NOW (2nd ESP32 at the hall as gateway) | 100–300 m line-of-sight | +₱300 (one more ESP32) | Medium | Clear path between river and hall, no internet needed at the river. |
| LoRa (RA-01/SX1278 + ESP32 pair) | 1–3+ km | +₱600–1,000 | Medium-high | River is far from any Wi-Fi. Low bandwidth — perfect for level readings. |
| GSM (SIM800L + prepaid SIM) | Anywhere with signal | ₱300 + load | Medium | Use as the *alert/backup* channel (SMS when internet is down) more than as the primary data link. |

v1 plan: **Wi-Fi now**, design the firmware so the transport is one small module you can swap for LoRa/ESP-NOW later.

---

## 6. Software Architecture

### 6.1 Data model (Supabase / Postgres)

```sql
readings(
  id, station_id, water_level_cm, raw_distance_cm,
  battery_v, rssi, created_at
)

barrier_events(
  id, station_id, action,        -- DEPLOY | RETRACT | STOP | FAULT
  source,                        -- AUTO_THRESHOLD | MANUAL_DASHBOARD | MANUAL_SWITCH | FAILSAFE
  actor, created_at
)

alerts(
  id, station_id, level,         -- ADVISORY | CRITICAL | FAULT
  message, acknowledged_by, created_at
)

thresholds(key, value, unit, updated_at)   -- e.g. advisory_cm=15, critical_cm=25, retract_cm=10
```

### 6.2 API (Next.js route handlers)

| Endpoint | Who | Purpose |
|---|---|---|
| `POST /api/stations/:id/readings` | ESP32 (header `X-Device-Key`) | Ingest readings; triggers server-side alert evaluation |
| `GET  /api/stations/:id/commands` | ESP32, polls every 5 s | Picks up manual UP/DOWN commands from the dashboard (simple, NAT-friendly — no MQTT server needed for v1) |
| `POST /api/stations/:id/barrier` | Dashboard user (logged in) | Issue manual command with confirmation; audit-logged |
| `GET  /api/weather` | Dashboard | Open-Meteo proxy with 10-min cache |

### 6.3 Firmware outline (ESP32, Arduino framework)

- **Dev setup:** PlatformIO in VS Code (you're a dev — you'll outgrow Arduino IDE fast; it also gives you unit tests and proper library management). Arduino IDE 2.x is fine too if you prefer simpler.
- **Libraries:** `WiFiManager` (captive-portal Wi-Fi setup — no hardcoded passwords), `Preferences` (NVS for thresholds + last state so a reboot doesn't lose its mind), `ArduinoOTA` (over-the-air firmware updates once it's mounted at the river), `HTTPClient`.
- **Loop discipline (non-blocking, no `delay()`):**
  - every 2 s: read ultrasonic (median of 5), read float switches
  - control logic (Section 7) — runs every reading
  - every 30 s: POST reading to server
  - every 5 s: poll `/commands` for manual overrides
  - hardware watchdog enabled
- **Actuator control:** interlocked relay set, 200 ms dead-time on direction change, **movement timeout** (if the expected limit switch doesn't trigger within stroke-time + 50%, stop and raise FAULT — this is your stall/jam detector).

### 6.4 Dashboard pages

1. `/` — Dashboard: level gauge, live chart, barrier status + controls, alert banner, forecast cards
2. `/history` — charts of past readings + flood events + barrier events
3. `/settings` — thresholds, alert recipients, device key (admin-only)

---

## 7. Control Logic & Safety

### 7.1 Alert levels (calibrate to your channel; use barangay-familiar terms)

| Level | Water level (example) | Action |
|---|---|---|
| **NORMAL** | below 15 cm | — |
| **ADVISORY** (gutter-deep) | ≥ 15 cm | Dashboard banner + Telegram alert: "monitoring" |
| **CRITICAL** (knee-deep) | ≥ 25 cm | Buzzer, Telegram + SMS, **barrier auto-deploys** |
| **RETRACT** | back below 10 cm **for 30 continuous minutes** | Barrier allowed to retract (hysteresis + delay prevents flapping on waves) |

Thresholds must be **configurable** (stored in NVS + synced to server) — every river is different and you will tune them in the field.

### 7.2 Rules that make it trustworthy

1. **Debounce:** require 3 consecutive readings above critical before deploying (one bad ultrasonic echo must never deploy the barrier).
2. **Cross-check:** at CRITICAL depth, the float switch should also be triggered. If ultrasonic says critical but float says dry → FAULT alert, do not deploy on sensor alone; buzz for manual attention.
3. **Local autonomy:** threshold logic runs on the ESP32. Losing Wi-Fi changes *reporting*, never *protection*.
4. **Manual override always wins:** a physical toggle switch at the station (AUTO / UP / DOWN) overrides everything — for maintenance and emergencies. Dashboard commands are second in line, automatic logic third.
5. **Fail-safe on sensor loss:** if readings stop making sense (timeout, impossible values), don't silently continue — raise FAULT, keep the barrier in its current state, alert loudly.
6. **State persistence:** barrier state + thresholds in NVS; on brownout + reboot, resume safely (if water still high → ensure deployed).
7. **Retract needs more evidence than deploy:** deploy fast on clear signal; retract only after sustained low water (30 min) — asymmetric by design. Optionally require a human "confirm retract" tap on the dashboard for v1 (safest for demos).

---

## 8. Bill of Materials (Shopee PH estimates)

| Item | Qty | Est. price (₱) |
|---|---|---|
| ESP32 DevKit (WROOM-32) | 2 (1 spare / gateway) | 500 |
| JSN-SR04T waterproof ultrasonic | 1 | 400 |
| Float switch | 2 | 160 |
| 2-channel 10 A relay module (3.3 V-trigger) | 1 | 120 |
| Micro limit switches | 2 | 100 |
| 12V mini linear actuator, 100–150 mm stroke, w/ limit switches, 150–250 N | 1 | 2,500 |
| 12 V 6 A PSU | 1 | 400 |
| Buck converter (12 V → 5 V for ESP32) | 2 | 120 |
| IP66 enclosure + cable glands | 1 | 450 |
| Perfboard, jumper wires, connectors, spade terminals, fuse + holder | — | 600 |
| Plywood/acrylic + rubber gasket + rails (scale flood channel & barrier) | — | 1,200 |
| Buzzer, status LED strip, misc hardware | — | 300 |
| **Total estimate** | | **≈ ₱6,900** (range ₱6,000–9,000) |

Tools you'll need: soldering iron, multimeter, hand drill, hot glue/epoxy, epoxy for cable glands.

**Order in Week 1** — Shopee shipping is your critical path. Order the actuator and ultrasonic sensor first (longest ship times).

---

## 9. Build Phases & Timeline (~14 weeks)

| Phase | Weeks | Deliverable |
|---|---|---|
| **0. Site survey & ordering** | 1 | Visit the river: measure realistic water depths, distance to nearest Wi-Fi/power, photo-document the bank. Finalize channel dimensions + order all parts. |
| **1. Web app MVP** (no hardware needed) | 2–4 | Next.js + Supabase deployed: live 5-day forecast, dashboard skeleton, auth, alert banner logic with fake data. |
| **2. Sensing prototype** | 3–5 (parallel) | ESP32 + JSN-SR04T over a bucket/tub → readings land in Supabase → live chart works end-to-end. Calibrate against a ruler. |
| **3. Barrier mechanics** | 5–8 | Build the scale channel + lift panel; actuator + relays + limit switches wired; reliably deploy/retract on command. |
| **4. Control logic & safety** | 8–10 | Thresholds, debounce, hysteresis, failsafes (Section 7) implemented and unit-tested on the bench. |
| **5. Integration & alerts** | 10–11 | Full flow: raise water → ADVISORY alert → CRITICAL → barrier deploys → dashboard shows it live → Telegram/SMS sent. Manual override works. |
| **6. Hardening & testing** | 11–13 | Enclosure, cable management, 24 h soak test, failure-mode drills (Section 9.1). |
| **7. Documentation & demo** | 13–14 | Demo script, photos/video, this becomes your thesis/report material. |

### 9.1 Failure-mode test checklist (run every one of these on video)

- [ ] Raise water slowly past critical → deploys, no flapping when waves bob around the threshold
- [ ] Kill Wi-Fi mid-test → barrier still deploys; dashboard shows "station offline" + stale-data warning
- [ ] Cut mains power mid-deploy → barrier holds position (self-locking); station reboots and resumes safely
- [ ] Unplug ultrasonic mid-test → FAULT alert within seconds, no silent failure
- [ ] Trigger manual override during auto-deploy → switch wins
- [ ] Simulated sensor noise (wave your hand under the sensor) → debounce prevents spurious deploy
- [ ] 24 h continuous run → no memory leaks, no stuck states, database sane

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Expectation that this protects a real riverbank | Frame as scale model / proof of concept from day one; publish the force math (Section 4.1) in your report |
| Ultrasonic fooled by foam/debris/rain | Median filter + float-switch cross-check + debounce |
| Station unreachable during storm (the exact time you need it) | Local autonomy, battery backup, GSM SMS backup channel |
| Actuator jams/stalls | Movement timeout → FAULT + stop; manual override for recovery |
| Water ingress in enclosure | IP66 box, proper glands, mount electronics above expected splash, silica gel |
| Alert fatigue (too many false alarms) | Only 2 alert levels + debouncing + acknowledgment flow |
| Barangay adopts it without maintenance ownership | Handover doc: monthly checklist (clean sensor cone, exercise the barrier, test alerts) |

**Also:** coordinate threshold levels and alert wording with the barangay captain / DRRM officer early — aligning with how PAGASA and the MDRRMO phrase advisories makes the system credible, and they're your stakeholders.

---

## 11. Next Steps (this week)

1. Site survey — photos, distances (river → hall/Wi-Fi), typical and flood-season water depths
2. Order parts (Section 8) — actuator + ultrasonic first
3. Create the Next.js + Supabase project and get the Open-Meteo 5-day forecast rendering for your barangay's coordinates — Phase 1 needs zero hardware, so it can start immediately
4. Sketch the scale channel: width, depth, panel size → verify the force math (Section 4.1) against your chosen actuator
