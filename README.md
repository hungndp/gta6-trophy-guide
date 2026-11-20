# gta6-trophy-guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/hungndp/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/hungndp/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Vice City Trophy Atlas v2** — an offline GTA VI (PS5) trophy guide and tracker for all 55 trophies, rebuilt around one idea: credibility you can audit. Every guide is numbered steps, and every step carries inline citations to the sources that back it.

What's inside:

- **Audit strip** — the header recomputes the guide's own evidence live from the data: 55/55 official name, description and grade · tier split · every claim cited · how many claims are backed by 2+ sources · source count · disputes shown both ways · missable and at-risk counts · read date.
- **Per-step citations** — 304 guide steps across 11 dated sources (Exophase for the official list, PSNProfiles, PowerPyx, Push Square, TrueTrophies, IGN Wiki and more), each trophy with a "Sources for this guide" block showing how many steps each source backs.
- **SOURCES DIFFER panels** — where the guides genuinely disagree (missable windows, collectible totals, platinum hours and difficulty, whether strands lock), both positions are shown side by side with their citations, plus an explicit "Our call" verdict.
- **Missable Watch** — the roadmap carries a sidebar listing every missable and at-risk trophy with its last-chance chapter, so nothing gets locked out on the way to the platinum.
- **Tracker** — checkboxes for all 55 trophies plus per-collectible counters with steppers (stunts, meditation spots, card sets, WAiNK locations, vaults and more), all persisted in the browser, with JSON export/import.
- **Roadmap** — seven stages from the opening chapters to the 100% checklist, with platinum summary stats (difficulty, hours, playthroughs, zero online trophies).
- **Filters & spoiler shield** — filter by Story, Missable, Collectibles, Activities, Online, PSN-hidden, Disputed or Not earned; the shield hides PSN-hidden trophy names and details until you earn them.

Fully offline: no network calls, no build step — just open the app.

## Run it

```sh
node main.ts            # copies app/ + screenshots/ to /output and writes dossier.json
# or preview the guide itself:
python3 -m http.server 8080 --directory app   # then open http://localhost:8080
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=ebjdb2tv&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
