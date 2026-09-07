import { Button } from "@/components/ui/button";
import { FB_W, FRAME_MS, LCD_H } from "@/game/config";
import {
  bindKeyboard,
  createInput,
  emptyButtons,
  press,
  sample,
  type InputController,
} from "@/game/input";
import { createInitialState, formatTimer, step } from "@/game/physics";
import { drawFrame } from "@/game/render";
import type { Buttons, GameState } from "@/game/types";
import { useEffect, useRef, useState } from "react";
type Hud = {
  mode: string;
  score: string;
  timer: string;
  lives: number;
  sun: string;
};
function readHud(s: GameState): Hud {
  const { mm, ss } = formatTimer(s.timer);
  let mode = "Match";
  if (s.awaitStart && s.testMode) mode = "Attract · test";
  else if (s.awaitStart) mode = "Attract";
  else if (s.gameOver && s.testMode) mode = "Game over · test";
  else if (s.gameOver) mode = "Game over";
  let sun = "Sun";
  if (s.blackHole) sun = "Black hole";
  else if (s.antiGrav) sun = "Repulsion";
  return {
    mode,
    score: `${s.score0}  ·  ${s.score1}`,
    timer: `${mm}:${ss}`,
    lives: s.lives0,
    sun,
  };
}
function PadButton({
  label,
  sub,
  held,
  onHold,
}: {
  label: string;
  sub?: string;
  held: boolean;
  onHold: (down: boolean) => void;
}) {
  return (
    <Button
      type="button"
      variant="cabinet"
      size="pad"
      tabIndex={-1}
      className={`touch-none ${held ? "bg-muted ring-2 ring-primary" : ""}`}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.blur();
        e.currentTarget.setPointerCapture(e.pointerId);
        onHold(true);
      }}
      onPointerUp={() => onHold(false)}
      onPointerCancel={() => onHold(false)}
    >
      <span className="flex flex-col leading-none">
        <span>{label}</span>
        {sub ? (
          <span className="mt-1 text-[10px] tracking-widest text-muted-foreground">
            {sub}
          </span>
        ) : null}
      </span>
    </Button>
  );
}
export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const inputRef = useRef<InputController>(createInput());
  const [hud, setHud] = useState<Hud>({
    mode: "Attract",
    score: "0  ·  0",
    timer: "59:59",
    lives: 5,
    sun: "Sun",
  });
  const [held, setHeld] = useState<Buttons>(emptyButtons());
  useEffect(() => {
    const input = inputRef.current;
    const unbind = bindKeyboard(input);
    const canvas = canvasRef.current;
    if (!canvas) return unbind;
    const ctx = canvas.getContext("2d");
    if (!ctx) return unbind;
    let acc = 0;
    let last = performance.now();
    let hudAt = 0;
    let raf = 0;
    const tick = (now: number) => {
      const dt = Math.min(100, now - last);
      last = now;
      acc += dt;
      while (acc >= FRAME_MS) {
        step(stateRef.current, sample(input));
        acc -= FRAME_MS;
      }
      drawFrame(ctx, stateRef.current);
      if (now - hudAt > 120) {
        hudAt = now;
        setHud(readHud(stateRef.current));
        setHeld({ ...input.held });
      }
      raf = requestAnimationFrame(tick);
    };
    drawFrame(ctx, stateRef.current);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      unbind();
    };
  }, []);
  const setBtn = (key: keyof Buttons, down: boolean) => {
    press(inputRef.current, key, down);
    setHeld({ ...inputRef.current.held });
  };
  const demo =
    hud.mode.startsWith("Attract") || hud.mode.startsWith("Game over");
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex w-full max-w-[880px] flex-wrap items-center justify-between gap-2 font-mono text-xs text-muted-foreground">
        <span className="text-primary">{hud.mode}</span>
        <span>
          You {hud.score.split("  ·  ")[0]} · AI {hud.score.split("  ·  ")[1]}
        </span>
        <span>{hud.timer}</span>
        <span>{hud.sun}</span>
      </div>
      <div className="lcd-bezel w-full max-w-[880px] p-2 sm:p-3">
        <canvas
          ref={canvasRef}
          width={FB_W}
          height={LCD_H}
          className="block h-auto w-full bg-black"
          style={{ imageRendering: "pixelated" }}
          aria-label="Space Wars playfield, 800 by 480, matching the Tang Primer 20K LCD"
        />
      </div>
      <p className="max-w-[880px] px-2 text-center text-sm text-muted-foreground">
        {demo
          ? "Attract demo is running both ships. Press Fire to start a 1:30 match. Hold DIP5 (5 / T) for attract test mode (fly Diamond; Fire shoots)."
          : "Fly the green Diamond. The yellow wedge is the AI. Shoot the sun ten times to collapse it."}
      </p>
      <div className="grid w-full max-w-[880px] grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <PadButton
          label="◀"
          sub="A / ←"
          held={held.left}
          onHold={(d) => setBtn("left", d)}
        />
        <PadButton
          label="▶"
          sub="D / →"
          held={held.right}
          onHold={(d) => setBtn("right", d)}
        />
        <PadButton
          label="Thrust"
          sub="W / ↑"
          held={held.thrust}
          onHold={(d) => setBtn("thrust", d)}
        />
        <PadButton
          label="Fire"
          sub="Space"
          held={held.fire}
          onHold={(d) => setBtn("fire", d)}
        />
        <PadButton
          label="Hyper"
          sub="Shift / H"
          held={held.hyper}
          onHold={(d) => setBtn("hyper", d)}
        />
        <PadButton
          label="DIP5"
          sub="5 / T · test"
          held={held.dip5Down}
          onHold={(d) => setBtn("dip5Down", d)}
        />
      </div>
    </div>
  );
}