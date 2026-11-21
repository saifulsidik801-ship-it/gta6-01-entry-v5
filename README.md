# MARISOL BAY — Make GTA 6 (gta6-01)

[![Make GTA 6](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/saifulsidik801-ship-it/gta6-01-entry-v5/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/saifulsidik801-ship-it/gta6-01-entry-v5/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

An original open-world crime game in the spirit of GTA 6, built for the
make.fun gta6-01 bounty. Drive and walk the dusk streets of **Marisol Bay**,
a sun-soaked island city of your own: steal cars, outrun the patrol, fight
on foot, run missions with your crew, and tune your ride in the garage.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network request: `game/` is plain static files
(three.js vendored under `game/vendor/`). Keyboard + mouse.

## Controls

- **W A S D** drive / walk · **Space** handbrake · **Shift** run (on foot)
- **E** enter / exit car · **F** steal nearest car · **Click** shoot (on foot)
- **G** garage · **M** map / pause menu · **Esc** pause · **1–6** weapons
- **R** restart mission · **H** horn

## The game

- A city to explore on foot and by car: traffic, pedestrians, palms, beach,
  lit-window towers, a police helicopter with a searchlight.
- Wanted level (0–4 stars) with police cruisers that ram, flank and
  roadblock, and an air unit that tracks you.
- Missions and a story: Milo Kade and crew (Mira the driver, Lio the
  mechanic, Kiki the lookout) — Downtown Heat, Street Sweep, Night Runner —
  with cash, respect ranks and a save that persists in your browser.
- Combat on foot with tracer fire, muzzle flash and marked hostiles.
- Garage: spray & tune, upgrades, weapons & gear, respect level.
- HUD with minimap, police response list, crew abilities, dialogue and radio.

## Screenshots

`screenshots/` holds four real renders of the game's own code:
`1-cover.jpg` (dusk chase), `2-gunfight.jpg` (on-foot shootout),
`3-heli.jpg` (air unit), `4-garage.jpg` (spray & tune).

Staged shots can be re-taken with `?shot=1..4&seed=1`, e.g.
`http://localhost:8080/?shot=2&seed=1`.

## Enter it

`main.ts` (Node 22) copies `game/` and `screenshots/` to `/output` and
writes `/output/dossier.json` with the vendored make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Originality

Every name, character, vehicle, street and story beat is original —
Marisol Bay, Milo Kade, the Kite Coupe — nothing from Rockstar Games'
Grand Theft Auto series or any other commercial game.

<sub>Entered on [make.fun](https://make.fun/?ref=mxhczr02&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
