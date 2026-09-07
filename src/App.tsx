import { GameCanvas } from "@/components/GameCanvas";
export default function App() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:py-10">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs tracking-[0.25em] text-primary">
              TANG PRIMER 20K · BROWSER SIM
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Space Wars
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground sm:text-base">
              Same loop as the GW2A-18 LCD build: vector Diamond vs yellow AI
              wedge, wrap playfield, sun / black hole, attract demo, fuel, lives,
              and hyperspace. No Gowin required.
            </p>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            HDL 1.01.DONE · 800×480 · 50 fps
          </p>
        </header>
        <GameCanvas />
        <section className="grid gap-4 border-t border-border pt-6 sm:grid-cols-3">
          <div>
            <h2 className="font-mono text-xs tracking-widest text-primary">
              Dock buttons
            </h2>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>S1 / S2 rotate · S3 thrust · S4 fire</li>
              <li>S0 hyperspace (vanish, warp, flash)</li>
              <li>DIP5 down = attract test (keys 5 / T)</li>
              <li>Keys: A/D or arrows, W or ↑, Space, Shift</li>
            </ul>
          </div>
          <div>
            <h2 className="font-mono text-xs tracking-widest text-primary">
              Scoring
            </h2>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>Your kill +1 and +5 s · AI kill on you the same</li>
              <li>Ram is −1 each · sun / black-hole core costs a life</li>
              <li>Three lives, extra life every five AI kills, 15 s fuel</li>
            </ul>
          </div>
          <div>
            <h2 className="font-mono text-xs tracking-widest text-primary">
              What this is
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              A TypeScript port of the physics, AI ramps, and scanout from the
              Tang Primer 20K Verilog — not a bitstream, and not cycle-accurate
              Gowin PnR. Meant for showing the game without the Dock.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
