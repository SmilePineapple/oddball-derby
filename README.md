# Oddball Derby

A ridiculous dice race where everybody cheats a little. An original pass-and-play board game for 2–6 players on one screen, with computer opponents for solo play.

- 32 racers, each with a rule-bending ability
- 6 tracks, 12 event cards, a four-heat Grand Prix
- Snake draft or quick deal, secret line-ups, three game modes
- 3D tilted board, animated characters, saved games

## Play it on your own computer

You need [Node.js](https://nodejs.org) 20 or newer.

1. Download this repository (green **Code** button, then **Download ZIP**) and unzip it, or clone it with git.
2. In the project folder, install and start:

```bash
npm install
npm run dev
```

3. Open the address it prints (usually http://localhost:5173).

Once installed it works without an internet connection. Games are saved in your browser.

## Other commands

| Command | What it does |
|---|---|
| `npm test` | Runs the rules tests, including 1,800 simulated full games (takes about a minute). |
| `npm run build` | Builds the site into `dist/` for hosting. |

## How it is put together

- `src/engine/` is the rules engine. It has no UI code and is fully tested.
- `src/ui/` is the React interface. It only displays what the engine decides.
- `docs/SPEC.md` is the full rules specification. `docs/OPEN_QUESTIONS.md` lists rulings on edge cases.
