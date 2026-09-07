import {
  COL,
  FB_H,
  FB_W,
  FUEL_MAX_MS,
  LCD_H,
  SUN_R,
  SUN_X,
  SUN_Y,
} from "./config";
import { formatTimer } from "./physics";
import {
  DIAMOND_EDGES,
  DIAMOND_HITCH,
  FLAME_LEN,
  WEDGE_EDGES,
  WEDGE_HITCH,
  cosAng,
  shipVerts,
  sinAng,
} from "./ships";
import { STARS } from "./stars";
import { demoMode, type GameState } from "./types";
const DIG_W = 32;
const DIG_H = 56;
const DIG_T = 8;
const MINUS_W = 16;
const LIFE_W = 12;
const LIFE_H = 10;
const FUEL_X = 176;
const FUEL_Y = 18;
const FUEL_W = 14;
const FUEL_H = 56;
const FUEL_T = 2;
const FUEL_INNER_H = 52;
const FUEL_MS_PER_PX = 288;
const GO_SCALE = 4;
const SEG: Record<string, number> = {
  "0": 0b0111111,
  "1": 0b0000110,
  "2": 0b1011011,
  "3": 0b1001111,
  "4": 0b1100110,
  "5": 0b1101101,
  "6": 0b1111101,
  "7": 0b0000111,
  "8": 0b1111111,
  "9": 0b1101111,
};
const GLYPH: Record<string, number[]> = {
  G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01110],
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  M: [0b10001, 0b11011, 0b10101, 0b10001, 0b10001, 0b10001, 0b10001],
  E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  U: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  S: [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  F: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  I: [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
};
function fillDigit(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  d: string,
  color: string,
): void {
  const s = SEG[d];
  if (s === undefined) return;
  ctx.fillStyle = color;
  if (s & 1) ctx.fillRect(ox, oy, DIG_W, DIG_T);
  if (s & 8) ctx.fillRect(ox, oy + DIG_H - DIG_T, DIG_W, DIG_T);
  if (s & 64)
    ctx.fillRect(ox, oy + Math.floor((DIG_H - DIG_T) / 2), DIG_W, DIG_T);
  if (s & 32) ctx.fillRect(ox, oy, DIG_T, Math.floor(DIG_H / 2));
  if (s & 16)
    ctx.fillRect(ox, oy + Math.floor(DIG_H / 2), DIG_T, Math.floor(DIG_H / 2));
  if (s & 2)
    ctx.fillRect(ox + DIG_W - DIG_T, oy, DIG_T, Math.floor(DIG_H / 2));
  if (s & 4)
    ctx.fillRect(
      ox + DIG_W - DIG_T,
      oy + Math.floor(DIG_H / 2),
      DIG_T,
      Math.floor(DIG_H / 2),
    );
}
function fillMinus(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(
    ox,
    oy + Math.floor((DIG_H - DIG_T) / 2),
    MINUS_W,
    DIG_T,
  );
}
function fillColon(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(ox, oy + DIG_H / 4 - DIG_T / 2, DIG_T, DIG_T);
  ctx.fillRect(ox, oy + (3 * DIG_H) / 4 - DIG_T / 2, DIG_T, DIG_T);
}
function scoreDigits(n: number): { neg: boolean; chars: string[] } {
  const neg = n < 0;
  const mag = Math.abs(n);
  const str = String(mag);
  return { neg, chars: str.split("") };
}
function scoreXs(len: number, left: boolean): number[] {
  if (left) {
    if (len >= 3) return [52, 92, 132];
    if (len === 2) return [92, 132];
    return [132];
  }
  if (len >= 3) return [616, 656, 696];
  if (len === 2) return [656, 696];
  return [696];
}
function drawScore(
  ctx: CanvasRenderingContext2D,
  n: number,
  left: boolean,
): void {
  const { neg, chars } = scoreDigits(n);
  const xs = scoreXs(chars.length, left);
  const first = xs[0];
  if (neg) fillMinus(ctx, first - MINUS_W - 4, 18, COL.score);
  chars.forEach((ch, i) => fillDigit(ctx, xs[i], 18, ch, COL.score));
}
function drawTimer(ctx: CanvasRenderingContext2D, timer: number): void {
  const { mm, ss } = formatTimer(timer);
  let color = COL.timer;
  if (timer < 10) color = COL.timerRed;
  else if (timer < 30) color = COL.timerYellow;
  fillDigit(ctx, 320, 18, mm[0], color);
  fillDigit(ctx, 360, 18, mm[1], color);
  fillColon(ctx, 396, 18, color);
  fillDigit(ctx, 408, 18, ss[0], color);
  fillDigit(ctx, 448, 18, ss[1], color);
}
function drawFuel(ctx: CanvasRenderingContext2D, fuelMs: number): void {
  const fillH =
    fuelMs >= FUEL_MAX_MS
      ? FUEL_INNER_H
      : Math.min(FUEL_INNER_H, Math.floor(fuelMs / FUEL_MS_PER_PX));
  let color = COL.fuelGreen;
  if (fuelMs <= 750) color = COL.fuelRed;
  else if (fuelMs <= 1500) color = COL.fuelYellow;
  ctx.fillStyle = color;
  ctx.fillRect(FUEL_X, FUEL_Y, FUEL_W, FUEL_T);
  ctx.fillRect(FUEL_X, FUEL_Y + FUEL_H - FUEL_T, FUEL_W, FUEL_T);
  ctx.fillRect(FUEL_X, FUEL_Y, FUEL_T, FUEL_H);
  ctx.fillRect(FUEL_X + FUEL_W - FUEL_T, FUEL_Y, FUEL_T, FUEL_H);
  if (fillH > 0) {
    ctx.fillRect(
      FUEL_X + FUEL_T,
      FUEL_Y + FUEL_H - FUEL_T - fillH,
      FUEL_W - 2 * FUEL_T,
      fillH,
    );
  }
}
function drawLives(ctx: CanvasRenderingContext2D, lives: number): void {
  ctx.fillStyle = COL.life;
  for (let i = 0; i < lives && i < 5; i++) {
    const ox = 92 + i * 18;
    const oy = 82;
    ctx.beginPath();
    ctx.moveTo(ox + LIFE_W / 2, oy);
    ctx.lineTo(ox + LIFE_W, oy + LIFE_H);
    ctx.lineTo(ox, oy + LIFE_H);
    ctx.closePath();
    ctx.fill();
  }
}
function drawGlyph(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  ch: string,
  color: string,
): void {
  const rows = GLYPH[ch];
  if (!rows) return;
  ctx.fillStyle = color;
  for (let r = 0; r < 7; r++) {
    const bits = rows[r];
    for (let c = 0; c < 5; c++) {
      if (bits & (1 << (4 - c))) {
        ctx.fillRect(ox + c * GO_SCALE, oy + r * GO_SCALE, GO_SCALE, GO_SCALE);
      }
    }
  }
}
function drawTextRow(
  ctx: CanvasRenderingContext2D,
  text: string,
  x0: number,
  y: number,
  color: string,
): void {
  let x = x0;
  for (const ch of text) {
    if (ch === " ") {
      x += 36;
      continue;
    }
    drawGlyph(ctx, x, y, ch, color);
    x += 24;
  }
}
function drawSun(ctx: CanvasRenderingContext2D, s: GameState): void {
  const g = ctx.createRadialGradient(SUN_X, SUN_Y, 2, SUN_X, SUN_Y, SUN_R);
  if (s.blackHole) {
    g.addColorStop(0, "#2a002a");
    g.addColorStop(1, COL.bh);
  } else {
    g.addColorStop(0, COL.sunCore);
    g.addColorStop(0.45, COL.sunMid);
    g.addColorStop(1, COL.sunRim);
  }
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(SUN_X, SUN_Y, SUN_R, 0, Math.PI * 2);
  ctx.fill();
}
function drawStars(ctx: CanvasRenderingContext2D, s: GameState): void {
  ctx.fillStyle = COL.star;
  for (const [mx, my] of STARS) {
    let sx = mx - s.starPanX;
    if (sx < 0) sx += 3200;
    if (sx >= 3200) sx -= 3200;
    let sy = my - s.starPanY;
    if (sy < 0) sy += FB_H;
    if (sy >= FB_H) sy -= FB_H;
    if (sx >= 0 && sx < FB_W && sy >= 0 && sy < FB_H) {
      ctx.fillRect(sx, sy, 2, 2);
    }
  }
}
function strokeShip(
  ctx: CanvasRenderingContext2D,
  verts: Array<{ x: number; y: number }>,
  edges: ReadonlyArray<readonly [number, number]>,
  color: string,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const [a, b] of edges) {
    ctx.moveTo(verts[a].x, verts[a].y);
    ctx.lineTo(verts[b].x, verts[b].y);
  }
  ctx.stroke();
}
function drawShips(ctx: CanvasRenderingContext2D, s: GameState): void {
  if (s.pos0x >= 0) {
    const verts = shipVerts("diamond", s.ang0, s.pos0x, s.pos0y);
    let color = COL.diamond;
    if (s.hsPhase === 2) color = s.hsRed ? COL.diamondHsRed : COL.diamond;
    strokeShip(ctx, verts, DIAMOND_EDGES, color);
    if (s.thrusting0) {
      const hitch = verts[DIAMOND_HITCH];
      ctx.beginPath();
      ctx.moveTo(hitch.x, hitch.y);
      ctx.lineTo(
        hitch.x - cosAng(s.ang0) * FLAME_LEN,
        hitch.y - sinAng(s.ang0) * FLAME_LEN,
      );
      ctx.strokeStyle = color;
      ctx.stroke();
    }
  }
  if (s.pos1x >= 0) {
    const verts = shipVerts("wedge", s.ang1, s.pos1x, s.pos1y);
    strokeShip(ctx, verts, WEDGE_EDGES, COL.ai);
    if (s.thrusting1) {
      const hitch = verts[WEDGE_HITCH];
      ctx.beginPath();
      ctx.moveTo(hitch.x, hitch.y);
      ctx.lineTo(
        hitch.x - cosAng(s.ang1) * FLAME_LEN,
        hitch.y - sinAng(s.ang1) * FLAME_LEN,
      );
      ctx.strokeStyle = COL.ai;
      ctx.stroke();
    }
  }
}
function drawShots(ctx: CanvasRenderingContext2D, s: GameState): void {
  ctx.strokeStyle = COL.shot;
  ctx.lineWidth = 1;
  for (const sh of s.shots) {
    if (!sh.on) continue;
    ctx.beginPath();
    ctx.moveTo(sh.x, sh.y);
    ctx.lineTo(sh.x - sh.vx, sh.y - sh.vy);
    ctx.stroke();
  }
}
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  s: GameState,
): void {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, FB_W, LCD_H);
  drawScore(ctx, s.score0, true);
  drawScore(ctx, s.score1, false);
  drawTimer(ctx, s.timer);
  drawFuel(ctx, s.fuelMs);
  drawLives(ctx, s.lives0);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, FB_W, FB_H);
  ctx.clip();
  drawStars(ctx, s);
  drawShips(ctx, s);
  drawShots(ctx, s);
  drawSun(ctx, s);
  ctx.restore();
  const goFlash =
    s.frameCnt < 13 || (s.frameCnt >= 25 && s.frameCnt < 38);
  if (s.gameOver && goFlash) {
    drawTextRow(ctx, "GAME OVER", 300, 140, COL.go);
  }
  if (demoMode(s)) {
    drawTextRow(ctx, "PUSH FIRE TO START", 204, 340, COL.push);
  }
  ctx.fillStyle = s.blackHole ? COL.borderRed : "#000000";
  ctx.fillRect(0, 0, FB_W, 5);
  ctx.fillRect(0, LCD_H - 5, FB_W, 5);
  ctx.fillRect(0, 0, 5, LCD_H);
  ctx.fillRect(FB_W - 5, 0, 5, LCD_H);
}