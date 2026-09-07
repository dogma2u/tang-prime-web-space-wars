# Space Wars — Tang Primer 20K browser sim

## Play now (web)

**[Launch the playable web version](https://dogma2u.github.io/tang-prime-web-space-wars/)**

Open that link to run the game in your browser (no install, no FPGA board). Attract demo starts on load — press **Fire** (`Space` / `K`) for a 1:30 match.

---

A playable browser port of [dogma2u/Sipeed-Tang-Primer-20k-demo](https://github.com/dogma2u/Sipeed-Tang-Primer-20k-demo): the **Space Wars**-style game that runs on the Sipeed Tang Primer 20K Dock + 5" 800×480 RGB LCD.

This is **not** a Gowin bitstream and not cycle-accurate HDL. It is the same game loop in TypeScript so you can show and play it without the FPGA tools or the board.

**HDL baseline:** version **1.01.DONE** (final GW2A-18 board release — chip full; DIP5 test when down; timer max 59:59; finer AI facing; `CFG_SHIP_MAXV` = 10).

## Run locally

```bash
npm install
npm run dev
```

Then open the printed URL (default **http://127.0.0.1:43127**). Production build:

```bash
npm run build
npm run preview
```

### Controls

| Dock | Keyboard | On-screen |
|---|---|---|
| S1 left | `A` / `←` | ◀ |
| S2 right | `D` / `→` | ▶ |
| S3 thrust | `W` / `↑` | Thrust |
| S4 fire | `Space` / `K` | Fire |
| S0 hyperspace | `Shift` / `H` / `Z` | Hyper |
| DIP5 down (test) | `5` / `T` | DIP5 |

On boot the board (and this sim) runs an **attract demo**: both ships are AI. Press **Fire** to start a 1:30 match. Hold **DIP5** (`5` / `T`) in attract for **test mode** (fly the Diamond; AI frozen; Fire shoots instead of starting). Release DIP5 to return to normal attract. Match start clears test mode.

## What matches the FPGA (1.01.DONE)

- 800×480 LCD framing, 800×470 playfield, 50 Hz step
- Green Diamond vs yellow AI wedge, same vertex outlines
- Q8.8-style thrust, drag, and 1/r² gravity (black hole / restored-sun push)
- Shot bank 8 (player 0–4, AI 5–7), mag 5 + reload
- Wrap at edges; bounce + red rim in black-hole mode
- 10 shots into the sun → black hole; 5 player shots restore the sun with 10 s outward push
- Scores, lives (3 start / 5 max), 15 s fuel, `MM×100+SS` timer (fields 0…59, max **59:59**)
- Attract, GAME OVER, PUSH FIRE TO START, hyperspace vanish/warp/flash
- DIP5 attract test (down = test), same as Dock pin T5
- AI ~5° heading bins (`ratio32` / `want_facing`), not 90° cardinal snaps
- Ship max speed **10** (all modes); spawn Manhattan sep ≥200; AI post-spawn thrust spurt
- Constellation star catalog and random pan
- AI playtime ramps (standoff, aim, thrust) through 5:00

What is **not** modelled: Gowin BSRAM erase/redraw, dropped physics frames while draw is busy, Education toolchain WARNs, SDRAM/DDR3, or the old secret green-sun path (not in board 1.01.DONE).

## Stack

Vite, React, TypeScript, Tailwind, shadcn/ui `Button`. The playfield is a canvas.

## License

MIT. FPGA HDL remains in the original repo under its own MIT license.
