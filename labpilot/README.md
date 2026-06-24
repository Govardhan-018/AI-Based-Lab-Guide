# LabPilot — Unified AI Laboratory Learning OS

A single desktop application that merges the two former projects:

- **SenseBridge** (camera + voice + AI lab assistant) → now runs in-browser inside the app
- **LabPilot** (dashboards, progress, analytics) → the shell everything lives in

Teachers create experiments and assign them to students by ID. Students log in,
run the assigned experiment with a live **camera feed, voice assistant, and AI tutor**,
and the system **scores** them automatically. Teachers see completion, mistakes,
questions asked, and full analytics. **All data is stored as local JSON files.**

Built with **Next.js + Electron**. No external database.

---

## Running it

```bash
cd labpilot
npm install
```

### Desktop app (Electron) — the real product

```bash
npm run app        # builds Next.js, then launches the Electron desktop window
```

On first run Electron downloads its binary (one time). Data is stored at
`%APPDATA%/labpilot/data` (Windows) / `~/Library/Application Support/labpilot/data` (macOS).

### Browser dev mode — fastest for development

```bash
npm run dev        # http://localhost:3000  (data stored in ./data)
```

### Electron against the dev server (hot reload)

```bash
npm run dev            # terminal 1
npm run electron:dev   # terminal 2 — opens the desktop window pointing at the dev server
```

---

## Demo accounts

| Role     | ID        | Password   |
|----------|-----------|------------|
| Teacher  | `teacher` | `teach123` |
| Student  | `alice`   | `pass123`  |
| Student  | `bob`     | `pass123`  |
| Student  | `carol`   | `pass123`  |

`alice` starts with two assigned experiments.

---

## End-to-end flow

1. **Teacher logs in** → Subjects → open a subject → **+ Add Experiment**
   (multi-step builder: theory, materials, safety, per-step instructions, hints,
   common mistakes, verification type) → **Publish**.
2. Teacher clicks **Assign →** on an experiment and picks a student by ID.
3. **Student logs in** → sees the assigned experiment on their dashboard → **Start**.
4. The **lab session** opens full-screen: live camera, step-by-step panel,
   🔊 text-to-speech, 🤖 AI assistant (type or 🎤 voice via Groq Whisper),
   🚨 emergency alert. The student reveals hints / logs mistakes as they go.
5. On finish, **scores are computed** (understanding / safety / engagement / overall)
   and **XP awarded**; the result is saved.
6. **Teacher** sees it in real time on the dashboard, and afterwards in
   **Students → [student]** (per-step mistakes, hints, time, questions asked) and
   **Analytics** (completion + average score charts, all from real sessions).

---

## Voice & AI

Set `GROQ_API_KEY` in `labpilot/.env.local` (already present for this prototype).

- **AI tutor** → Groq `llama-3.1-8b-instant`, context-injected with the current step.
- **Speech-to-text** → records mic audio and transcribes via Groq `whisper-large-v3-turbo`
  (works inside Electron, unlike the browser SpeechRecognition API).
- **Text-to-speech** → the browser/Electron `speechSynthesis` API reads each step aloud.

---

## Data model (local JSON)

Stored in the data directory, one file per collection:

| File               | Contents                                                        |
|--------------------|-----------------------------------------------------------------|
| `users.json`       | Teachers + students, with XP / level / streak                   |
| `subjects.json`    | Subject catalog                                                 |
| `experiments.json` | Experiments + their steps (created by teachers)                 |
| `assignments.json` | Which experiment is assigned to which student                   |
| `sessions.json`    | Every run: step results, mistakes, hints, chat, scores, XP      |

Files seed themselves with demo content on first read. Delete the data directory
to reset to a clean state.

## Scoring algorithm

`src/lib/scoring.ts`:

- **Understanding** — step completion ratio, minus mistakes and heavy hint reliance.
- **Safety** — starts at 100, each safety alert costs points.
- **Engagement** — completion + questions asked + a sensible pace (not rushed, not stalled).
- **Overall** — weighted 45 % understanding / 30 % safety / 25 % engagement.
- **XP** — per completed step + score bonus, multiplied by difficulty; rolls up into levels and streaks.

---

## Key paths

```
labpilot/
├── electron/main.js                 # boots Next.js + opens the desktop window
├── src/lib/db.ts                    # JSON file persistence + seed data
├── src/lib/scoring.ts               # scoring + leveling
├── src/lib/auth.ts                  # client login state
├── src/app/api/                     # auth, experiments, assignments, sessions, chat, stt
├── src/app/page.tsx                 # login
├── src/app/lab/[experimentId]/      # full-screen lab session (camera/voice/AI)
├── src/components/lab/              # camera-feed, ai-chat-panel, step-panel, lab-session
├── src/app/student/                 # student dashboard, subjects, progress
└── src/app/teacher/                 # teacher dashboard, subjects, builder, students, analytics
```
