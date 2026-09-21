<p align="center">
  <img src="https://img.icons8.com/fluency/96/calendar.png" alt="Fetcher Logo" width="96" />
</p>

<h1 align="center">Fetcher — UVSQ CELCAT Calendar</h1>

<p align="center">
  <strong>Auto-updating university calendar you can subscribe to — 100% free, no server needed.</strong>
</p>

<p align="center">
  <a href="https://github.com/AbdelkarimDouadjia/Fetcher/actions/workflows/update-calendar.yml">
    <img src="https://github.com/AbdelkarimDouadjia/Fetcher/actions/workflows/update-calendar.yml/badge.svg" alt="Update Calendar" />
  </a>
  <img src="https://img.shields.io/badge/python-3.12-blue?logo=python&logoColor=white" alt="Python 3.12" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License" />
  <img src="https://img.shields.io/badge/CELCAT-UVSQ-purple" alt="CELCAT UVSQ" />
</p>

---

## What is this?

**Fetcher** downloads every event published for the [M2 AMIS CELCAT timetable](https://edt.uvsq.fr/cal?vt=agendaDay&dt=2026-09-21&et=group&fid0=M2%20AMIS) and generates a clean `.ics` calendar file that you can subscribe to from **Google Calendar, iPhone, Outlook, or any calendar app**.

A GitHub Actions cron job **automatically refreshes** the calendar every 6 hours — so when a class is moved, a room changes, or a session is cancelled, your calendar updates by itself. No server, no hosting costs, **just GitHub**.

### What you get

| Feature | Description |
|---|---|
| **Auto-update** | Calendar refreshes every 6 hours via GitHub Actions |
| **Complete M2 calendar** | All M2 AMIS modules and non-module events |
| **Exam detection** | Exams, midterms, and defenses always included |
| **Room & location** | Full room info (e.g. `AMPHI B - DESCARTES`, `G207 - GERMAIN`) |
| **Reminders** | Built-in 30 min + 1 day before alarms |
| **Stable UIDs** | Events update in-place — no duplicates |
| **100% free** | GitHub Actions + GitHub Pages, no paid service |

---

## Quick Start (5 minutes)

### 1. Fork this repository

Click the **Fork** button at the top-right of this page, or use the CLI:

```bash
git clone https://github.com/AbdelkarimDouadjia/Fetcher.git
cd Fetcher
```

### 2. Check the M2 calendar configuration

The repository is already configured for the exact `M2 AMIS` calendar from **September 21, 2026 through October 31, 2027**:

```json
{
  "programmeSearchTerm": "M2 AMIS",
  "federationIds": ["M2 AMIS"],
  "startDate": "2026-09-21",
  "endDate": "2027-10-31",
  "includeAllEvents": true,
  "modules": []
}
```

You do **not** need to list modules. With `includeAllEvents` enabled, classes, exams, projects, rentrée events, and other M2 AMIS entries are all included.

**What you may update later:**

| Field | Where to find it |
|---|---|
| `startDate` | Change this when the calendar should begin (`YYYY-MM-DD`) |
| `endDate` | Change this when you want to extend or shorten the calendar (`YYYY-MM-DD`) |
| `federationIds` | Keep `M2 AMIS` unless UVSQ renames the CELCAT group |
| `includeAllEvents` | Keep `true` to include every event and every module |

### 3. Enable GitHub Pages

1. Go to your fork's **Settings** → **Pages**
2. Under **Source**, select: **main** branch, **`/ (root)`** folder
3. Click **Save**
4. Wait ~1 minute for the first deployment

### 4. Enable GitHub Actions

1. Go to **Settings** → **Actions** → **General**
2. Select **"Allow all actions and reusable workflows"**
3. Click **Save**

### 5. Run the workflow (first time)

1. Go to the **Actions** tab
2. Click **"Update Calendar"** on the left
3. Click **"Run workflow"** → **"Run workflow"**
4. Wait for the green ✓ (takes ~30 seconds)

### 6. Subscribe to your calendar

Your calendar URL is:

```
https://<your-username>.github.io/Fetcher/calendar.ics
```

**Subscribe** (auto-updating — recommended):

| App | How to subscribe |
|---|---|
| **Google Calendar** | Other calendars **(+)** → **From URL** → paste the link |
| **iPhone / iPad** | **Settings** → **Calendar** → **Accounts** → **Add** → **Other** → **Subscribed Calendars** → paste the link |
| **Outlook** | **Add calendar** → **Subscribe from web** → paste the link |
| **Samsung / Android** | Open the URL in your browser → it will offer to add to Calendar |

> Your calendar app will check for updates every 12–24 hours automatically.

---

## How It Works

```
┌─────────────────┐     every 6h      ┌──────────────┐
│  GitHub Actions  │ ───────────────► │  CELCAT UVSQ  │
│  (cron job)      │ ◄─────────────── │  edt.uvsq.fr  │
│                  │   raw events      │               │
└────────┬────────┘                   └───────────────┘
         │
         │ keep all M2 AMIS events
         ▼
┌─────────────────┐     git push      ┌──────────────┐
│  generate.py     │ ───────────────► │  GitHub Pages  │
│  → calendar.ics  │                  │  (static host) │
└─────────────────┘                   └───────┬───────┘
                                              │
                               https://...github.io/Fetcher/calendar.ics
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │  Your Calendar    │
                                    │  (Google/iPhone/  │
                                    │   Outlook/etc.)   │
                                    └──────────────────┘
```

1. **GitHub Actions** runs `generate.py` every 6 hours (or on manual trigger)
2. `generate.py` reads your `calendar-config.json`, connects to CELCAT, fetches all events
3. Every M2 AMIS event is kept, including entries without a module code
4. A fresh `calendar.ics` is generated and committed back to the repo
5. **GitHub Pages** serves it as a public URL
6. Your calendar app fetches the URL periodically and stays up to date

---

## Project Structure

```
Fetcher/
├── calendar-config.json    ← M2 group, date range, and all-events setting
├── calendar.ics            ← Generated calendar (auto-updated)
├── generate.py             ← Standalone generator script
├── requirements.txt        ← Python dependencies
├── index.html              ← Main web app (GitHub Pages)
├── app.js                  ← Web app logic (static)
├── style.css               ← Web app styles (Awwwards design)
├── docs.html               ← Setup & documentation guide
├── .github/
│   └── workflows/
│       └── update-calendar.yml  ← GitHub Actions cron workflow
├── web/                    ← Flask web app (optional, for local use)
│   ├── app.py
│   ├── celcat_client.py
│   ├── event_filter.py
│   ├── ics_generator.py
│   ├── static/
│   │   ├── app.js
│   │   └── style.css
│   └── templates/
│       ├── index.html
│       └── guide.html
├── celcat_client.py        ← CLI version
├── config.py               ← CLI config
├── event_filter.py         ← CLI filter
├── ics_generator.py        ← CLI generator
└── main.py                 ← CLI entry point
```

---

## Updating Your Config

When a new semester starts or your enrollment changes:

1. Edit `calendar-config.json` (directly on GitHub: click the file → pencil icon ✏️ → edit → commit)
2. Update `startDate` and `endDate`; leave `includeAllEvents` as `true`
3. The next workflow run (within 6 hours) will pick up your changes
4. Or trigger it manually: **Actions** → **Update Calendar** → **Run workflow**

---

## Local Usage (Optional)

### Flask web app

```bash
cd web
pip install -r requirements.txt
python -m flask run --port 5000
```

Open `http://localhost:5000` — a visual interface where you can pick modules, generate, subscribe, or update an existing `.ics`.

### Generate script (same as GitHub Actions)

```bash
pip install requests beautifulsoup4
python generate.py
```

Reads `calendar-config.json` and writes `calendar.ics`.

> `generate.py` is the canonical M2 AMIS generator. The older `main.py` / `config.py` CLI is retained for legacy personalized M1 setups.

---

## FAQ

<details>
<summary><strong>Can I use this for a different programme?</strong></summary>

Yes. Change `programmeSearchTerm` and `federationIds` in `calendar-config.json`. Both workflows read that same configuration.
</details>

<details>
<summary><strong>How often does my calendar update?</strong></summary>

- **GitHub Actions** runs every 6 hours and pushes a new `calendar.ics`
- **Your calendar app** (Google, iPhone, etc.) re-fetches the subscription URL every 12–24 hours
- So in the worst case, changes appear within ~30 hours
</details>

<details>
<summary><strong>Will I get duplicate events?</strong></summary>

No. Each event has a stable UID based on the CELCAT event ID. When your calendar app fetches the updated file, it replaces existing events — no duplicates.
</details>

<details>
<summary><strong>Can I share my calendar URL with classmates?</strong></summary>

Yes. This calendar contains all events for the common `M2 AMIS` CELCAT resource, so classmates using that same timetable can subscribe to the same URL.
</details>

<details>
<summary><strong>The workflow failed — what do I do?</strong></summary>

Usually it's a temporary CELCAT server issue. Go to **Actions** and re-run the failed workflow. If it keeps failing, check that your module codes are correct in `calendar-config.json`.
</details>

<details>
<summary><strong>Is this free?</strong></summary>

Yes, 100% free. GitHub Actions gives unlimited minutes for public repos, and GitHub Pages is free static hosting.
</details>

---

## Contributing

Found a bug? Want to add support for other programmes? PRs are welcome!

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## License

MIT — free to use, modify, and distribute.

---

<p align="center">
  Made with ☕ for UVSQ M2 AMIS students<br/>
  <sub>Not affiliated with UVSQ or CELCAT.</sub>
</p>
