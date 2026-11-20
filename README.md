# gta6-trophy-guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/hungndp/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/hungndp/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Vice City Trophy Atlas v4** — an offline GTA VI (PS5) trophy guide and tracker for all 55 trophies, rebuilt around one idea: credibility you can audit. Every guide is numbered steps, and every step carries inline citations to the sources that back it.

What's inside:

- **Audit strip** — the header recomputes the guide's own evidence live from the data: 55/55 official name, description and grade · tier split · every claim cited · how many claims are backed by 2+ sources · source count · disputes shown both ways · missable and at-risk counts · read date.
- **Per-step citations** — 355 guide steps across 13 dated sources (Exophase for the official list, PSNProfiles, PowerPyx, Push Square, TrueTrophies, IGN Wiki, GTABase, KeenGamer and more), 335 of them backed by 2+ sources, each trophy with a "Sources for this guide" block showing how many steps each source backs and in how many of the 55 guides it appears.
- **SOURCES DIFFER panels** — 17 disputes where the guides genuinely disagree (missable windows, collectible totals, platinum hours and difficulty, whether strands lock), both positions shown side by side with their citations, plus an explicit "Our call" verdict — now rendered before the steps so disagreements surface first.
- **Missable Watch** — the roadmap carries a sidebar listing every missable and at-risk trophy with its last-chance chapter, so nothing gets locked out on the way to the platinum.
- **Tracker** — checkboxes for all 55 trophies plus per-collectible counters with steppers (stunts, meditation spots, card sets, WAiNK locations, vaults and more), all persisted in the browser, with JSON export/import.
- **Roadmap** — seven stages from the opening chapters to the 100% checklist, with platinum summary stats (difficulty, hours, playthroughs, zero online trophies).
- **Filters & spoiler shield** — filter by Story, Missable, Collectibles, Activities, Online, PSN-hidden, Disputed or Not earned; the shield hides PSN-hidden trophy names and details until you earn them.

Fully offline: no network calls, no build step — just open the app.

**New in v4:**

- Header progress (earned count, tier tallies, collectibles logged) and a Missable Watch alert banner on every view.
- IN SHORT summary in our own words at the top of every trophy detail, a collectible counter built into the detail page, and a NEXT UP strip in roadmap order.
- Per-stage progress on the roadmap; filter chips now show their counts.
- Positive Mental Attitude rebuilt around the one-off Chapter 1 balcony meditation (now flagged at risk, last chance Chapter 1) with a two-part dispute set; disputes total 17, sources total 13, and every trophy carries at least 6 cited steps (355 total).
- The guide now opens on Positive Mental Attitude by default; screenshots retaken with seeded progress.

## Run it

```sh
node main.ts            # copies app/ + screenshots/ to /output and writes dossier.json
# or preview the guide itself:
python3 -m http.server 8080 --directory app   # then open http://localhost:8080
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=ebjdb2tv&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
