import {
  AI_AIM_0,
  AI_AIM_1,
  AI_AIM_2,
  AI_AIM_3,
  AI_AIM_4,
  AI_AIM_FIRE_MIN_PCT,
  AI_BP_AIM_0,
  AI_BP_AIM_1,
  AI_BP_AIM_2,
  AI_BP_AIM_3,
  AI_BP_LIFE_0,
  AI_BP_LIFE_1,
  AI_BP_SO_0,
  AI_BP_SO_1,
  AI_BP_SO_2,
  AI_BP_THR_0,
  AI_BP_THR_1,
  AI_BP_THR_2,
  AI_CD_INIT,
  AI_GAP_POOR_EXTRA,
  AI_LIFE_0,
  AI_LIFE_1,
  AI_LIFE_CAP,
  AI_RELOAD_POOR_EXTRA,
  AI_SO_0,
  AI_SO_1,
  AI_SO_2,
  AI_SO_3,
  AI_THR_0,
  AI_THR_1,
  AI_THR_2,
  AI_THR_3,
  AI_VANISH_FR,
  AI_WILD_SEC,
  ANTI_GRAV_SEC,
  BH_HITS_SUN,
  DEMO_THRUST,
  DEMO_TIMER,
  FB_H,
  FB_W,
  FIRE_GAP_FR,
  FIRE_MAG_MAX,
  FIRE_RELOAD_FR,
  FRAMES_PER_SEC,
  FUEL_FRAME_MS,
  FUEL_MAX_MS,
  HS_FLASH_FR,
  HS_VANISH_FR,
  KILL_FOR_LIFE,
  LIFE_MAX,
  LIFE_START,
  MARGIN,
  NSHOT,
  NSHOT_PL,
  PL_BUL_LIFE,
  PL_THRUST,
  PLAY_MAX_SEC,
  Q88,
  SCORE_HI,
  SCORE_LO,
  SHIP_MAXV,
  SHOT_SPD_PX,
  AI_SPAWN_THRUST_FR,
  SPAWN_INVULN_FR,
  SPAWN_MIN_DIST,
  STAR_MAP_H,
  STAR_MAP_W,
  STAR_PAN_STEP,
  SUN_HITS_BH,
  SUN_HIT_M,
  SUN_NEAR_M,
  SUN_X,
  SUN_Y,
  TIMER_BONUS,
  TIMER_MAX,
  TIMER_START,
  WALL_KEEP,
} from "./config";
import { cosAng, sinAng } from "./ships";
import { demoMode, type Buttons, type GameState, type Shot } from "./types";
export function stepLfsr(n: number): number {
  const bit = ((n >> 7) ^ (n >> 5) ^ (n >> 4) ^ (n >> 3)) & 1;
  return ((n << 1) | bit) & 0xff;
}
export function stepStarLfsr(n: number): number {
  const bit = ((n >> 15) ^ (n >> 13) ^ (n >> 12) ^ (n >> 10)) & 1;
  return ((n << 1) | bit) & 0xffff;
}
function wrapCoord(v: number, max: number): number {
  if (v < 0) return v + max;
  if (v >= max) return v - max;
  return v;
}
function wrapPos(x: number, y: number): { x: number; y: number } {
  return { x: wrapCoord(x, FB_W), y: wrapCoord(y, FB_H) };
}
function bounce(
  x: number,
  y: number,
  vx: number,
  vy: number,
): { x: number; y: number; vx: number; vy: number } {
  let nx = x;
  let ny = y;
  let nvx = vx;
  let nvy = vy;
  if (nx < MARGIN) {
    nx = MARGIN;
    nvx = -nvx;
  } else if (nx > FB_W - MARGIN) {
    nx = FB_W - MARGIN;
    nvx = -nvx;
  }
  if (ny < MARGIN) {
    ny = MARGIN;
    nvy = -nvy;
  } else if (ny > FB_H - MARGIN) {
    ny = FB_H - MARGIN;
    nvy = -nvy;
  }
  return { x: nx, y: ny, vx: nvx, vy: nvy };
}
function wallHit(x: number, y: number): boolean {
  return x < MARGIN || x > FB_W - MARGIN || y < MARGIN || y > FB_H - MARGIN;
}
function manhattan(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}
function sunHit(x: number, y: number): boolean {
  return manhattan(x, y, SUN_X, SUN_Y) < SUN_HIT_M;
}
function sunNear(x: number, y: number): boolean {
  return manhattan(x, y, SUN_X, SUN_Y) < SUN_NEAR_M;
}
function wallNear(x: number, y: number): boolean {
  return (
    x < WALL_KEEP || x > FB_W - WALL_KEEP || y < WALL_KEEP || y > FB_H - WALL_KEEP
  );
}
function shotThruSun(
  px: number,
  py: number,
  tx: number,
  ty: number,
): boolean {
  const dss = manhattan(px, py, SUN_X, SUN_Y);
  const dst = manhattan(tx, ty, SUN_X, SUN_Y);
  const dpt = manhattan(tx, ty, px, py);
  return dss > 24 && dss + dst <= dpt + 48;
}
function ratio32(n: number, d: number): number {
  if (d === 0) return 32;
  const nn = n * 32;
  if (nn >= d * 32) return 32;
  if (nn >= d * 28) return 28;
  if (nn >= d * 24) return 24;
  if (nn >= d * 20) return 20;
  if (nn >= d * 16) return 16;
  if (nn >= d * 12) return 12;
  if (nn >= d * 8) return 8;
  if (nn >= d * 4) return 4;
  return 0;
}
/** ~5.6 deg bins (board want_facing / ratio32); angle units 0..255. */
function wantFacing(tx: number, ty: number): number {
  const ax = Math.abs(tx);
  const ay = Math.abs(ty);
  if (ax === 0 && ay === 0) return 0;
  if (ay <= ax) {
    const q = ratio32(ay, ax);
    if (tx >= 0 && ty >= 0) return q & 255;
    if (tx < 0 && ty >= 0) return (128 - q) & 255;
    if (tx < 0 && ty < 0) return (128 + q) & 255;
    return (0 - q) & 255;
  }
  const q = ratio32(ax, ay);
  if (tx >= 0 && ty >= 0) return (64 - q) & 255;
  if (tx < 0 && ty >= 0) return (64 + q) & 255;
  if (tx < 0 && ty < 0) return (192 - q) & 255;
  return (192 + q) & 255;
}
function timerSsPart(t: number): number {
  let r = t;
  if (r >= 5000) r -= 5000;
  if (r >= 4000) r -= 4000;
  if (r >= 2000) r -= 2000;
  if (r >= 1000) r -= 1000;
  if (r >= 800) r -= 800;
  if (r >= 400) r -= 400;
  if (r >= 200) r -= 200;
  if (r >= 100) r -= 100;
  return r;
}
function timerDec1(t: number): number {
  if (t === 0) return 0;
  if (timerSsPart(t) === 0) return t - 41;
  return t - 1;
}
function timerAddBonus(t: number): number {
  let n = t > TIMER_MAX - TIMER_BONUS ? TIMER_MAX : t + TIMER_BONUS;
  if (timerSsPart(n) >= 60) n += 40;
  if (n > TIMER_MAX) n = TIMER_MAX;
  return n;
}
function facingOk(ang: number, want: number): boolean {
  const d = (want - ang) & 255;
  return d <= 48 || d >= 208;
}
function turnStep(ang: number, want: number, step: number): number {
  const cw = (want - ang) & 255;
  if (cw === 0) return ang;
  if (cw <= 128) return (ang + step) & 255;
  return (ang - step) & 255;
}
function clampVel(v: number, lim: number): number {
  if (v > lim) return lim;
  if (v < -lim) return -lim;
  return v;
}
/** FPGA `grav_acc`: q is Q8.8, returned as px/frame². */
function gravAcc(
  dcomp: number,
  gdx: number,
  gdy: number,
  invert: boolean,
  numScale = 384,
  lim = 24,
): number {
  let r2 = gdx * gdx + gdy * gdy;
  if (r2 < 256) r2 = 256;
  let q = (dcomp * numScale) / r2;
  if (q > lim) q = lim;
  else if (q < -lim) q = -lim;
  if (invert) q = -q;
  return q / Q88;
}
function emptyShots(): Shot[] {
  return Array.from({ length: NSHOT }, () => ({
    on: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
  }));
}
function bumpScore(v: number): number {
  return v >= SCORE_HI ? 0 : v + 1;
}
function parkOff(): number {
  return -80;
}
function respawnPlayer(s: GameState): void {
  let nx = 40 + (s.lfsr << 1);
  let ny = 40 + ((s.lfsr & 0x7f) << 1);
  const ox = s.pos1x;
  const oy = s.pos1y;
  const ax = Math.abs(nx - ox);
  const ay = Math.abs(ny - oy);
  if (ax + ay < SPAWN_MIN_DIST) {
    nx = ox < 400 ? ox + 200 : ox - 200;
    if (nx < 40) nx = 40;
    if (nx > 760) nx = 760;
  }
  s.pos0x = nx;
  s.pos0y = ny;
  s.vel0x = 0;
  s.vel0y = 0;
  s.ang0 = s.lfsr;
  s.fuelMs = FUEL_MAX_MS;
  s.spawn0 = SPAWN_INVULN_FR;
  s.vanish0 = 0;
  s.spawnThr0 =
    demoMode(s) && !s.testMode ? AI_SPAWN_THRUST_FR : 0;
}
function respawnAi(s: GameState): void {
  let nx = 80 + (s.lfsr << 1);
  let ny = 60 + ((s.lfsr & 0x7f) << 1);
  const ox = s.pos0x;
  const oy = s.pos0y;
  const ax = Math.abs(nx - ox);
  const ay = Math.abs(ny - oy);
  if (ax + ay < SPAWN_MIN_DIST) {
    nx = ox < 400 ? ox + 200 : ox - 200;
    if (nx < 40) nx = 40;
    if (nx > 760) nx = 760;
  }
  s.pos1x = nx;
  s.pos1y = ny;
  s.vel1x = 0;
  s.vel1y = 0;
  s.ang1 = s.lfsr ^ 0x55;
  s.spawn1 = SPAWN_INVULN_FR;
  s.vanish1 = 0;
  s.spawnThr1 = !(demoMode(s) && s.testMode) ? AI_SPAWN_THRUST_FR : 0;
}
function latchAiRamps(s: GameState): void {
  const pc = Math.min(s.playSec, PLAY_MAX_SEC);
  s.playCap = pc;
  s.aiWild = s.playSec >= AI_WILD_SEC;
  s.aiDec = pc >> 4;
  let lifeRaw =
    pc < AI_BP_LIFE_0 ? AI_LIFE_0 : pc < AI_BP_LIFE_1 ? AI_LIFE_1 : AI_LIFE_CAP;
  if (lifeRaw > AI_LIFE_CAP) lifeRaw = AI_LIFE_CAP;
  s.aiLifeN = lifeRaw;
  s.aiStandoff =
    pc < AI_BP_SO_0
      ? AI_SO_0
      : pc < AI_BP_SO_1
        ? AI_SO_1
        : pc < AI_BP_SO_2
          ? AI_SO_2
          : AI_SO_3;
  s.aimPct =
    pc < AI_BP_AIM_0
      ? AI_AIM_0
      : pc < AI_BP_AIM_1
        ? AI_AIM_1
        : pc < AI_BP_AIM_2
          ? AI_AIM_2
          : pc < AI_BP_AIM_3
            ? AI_AIM_3
            : AI_AIM_4;
  s.aiThrust =
    pc < AI_BP_THR_0
      ? AI_THR_0
      : pc < AI_BP_THR_1
        ? AI_THR_1
        : pc < AI_BP_THR_2
          ? AI_THR_2
          : AI_THR_3;
  s.demoModeR = demoMode(s);
  s.plInvuln = s.spawn0 !== 0 || s.vanish0 !== 0 || s.hsPhase !== 0;
  s.aiInvuln = s.spawn1 !== 0 || s.vanish1 !== 0;
  s.sunNear0 = sunNear(s.pos0x, s.pos0y);
  s.sunNear1 = sunNear(s.pos1x, s.pos1y);
  s.wallNear0 = wallNear(s.pos0x, s.pos0y);
  s.wallNear1 = wallNear(s.pos1x, s.pos1y);
}
function spawnShot(
  s: GameState,
  fromPlayer: boolean,
  ang: number,
  px: number,
  py: number,
  vx: number,
  vy: number,
  life: number,
): boolean {
  const c = cosAng(ang);
  const si = sinAng(ang);
  const nose = fromPlayer ? 18 : 16;
  const sx = px + c * nose;
  const sy = py + si * nose;
  const svx = c * SHOT_SPD_PX + vx * 0.5;
  const svy = si * SHOT_SPD_PX + vy * 0.5;
  const lo = fromPlayer ? 0 : NSHOT_PL;
  const hi = fromPlayer ? NSHOT_PL : NSHOT;
  for (let i = lo; i < hi; i++) {
    if (!s.shots[i].on) {
      s.shots[i] = { on: true, x: sx, y: sy, vx: svx, vy: svy, life };
      return true;
    }
  }
  return false;
}
function loseLife(s: GameState): void {
  if (demoMode(s) || s.lives0 === 0) return;
  if (s.lives0 === 1) {
    s.gameOver = true;
    s.timer = DEMO_TIMER;
  }
  s.lives0 -= 1;
}
function vanishPlayer(s: GameState, scoreAi: boolean): void {
  if (scoreAi) s.score1 = bumpScore(s.score1);
  s.pos0x = parkOff();
  s.pos0y = parkOff();
  s.vel0x = 0;
  s.vel0y = 0;
  s.thrusting0 = false;
  s.vanish0 = AI_VANISH_FR;
}
function killAi(s: GameState, scorePl: boolean): void {
  if (scorePl) s.score0 = bumpScore(s.score0);
  s.pos1x = parkOff();
  s.pos1y = parkOff();
  s.vel1x = 0;
  s.vel1y = 0;
  s.thrusting1 = false;
  s.vanish1 = AI_VANISH_FR;
}
function startMatch(s: GameState): void {
  s.thrusting0 = false;
  s.thrusting1 = false;
  s.fireHold = false;
  s.fireCd = 0;
  s.fireReload = 0;
  s.fireMag = 0;
  s.aiCd = AI_CD_INIT;
  s.aiReload = 0;
  s.aiMag = 0;
  s.playSec = 0;
  s.score0 = 0;
  s.score1 = 0;
  s.shipLock = false;
  s.gameOver = false;
  s.awaitStart = false;
  s.testMode = false;
  s.timer = TIMER_START;
  s.frameCnt = 0;
  s.lives0 = LIFE_START;
  s.aiStreak = 0;
  s.fuelMs = FUEL_MAX_MS;
  s.sunHits = 0;
  s.bhHits = 0;
  s.blackHole = false;
  s.antiGrav = false;
  s.antiGravSec = 0;
  s.shots = emptyShots();
  s.pos0x = 140;
  s.pos0y = 160;
  s.vel0x = 0;
  s.vel0y = 0;
  s.ang0 = 192;
  s.pos1x = 660;
  s.pos1y = 320;
  s.vel1x = 0;
  s.vel1y = 0;
  s.ang1 = 64;
  s.spawn0 = SPAWN_INVULN_FR;
  s.spawn1 = SPAWN_INVULN_FR;
  s.spawnThr0 = 0;
  s.spawnThr1 = AI_SPAWN_THRUST_FR;
  s.vanish0 = 0;
  s.vanish1 = 0;
  s.hsPhase = 0;
  s.hsFr = 0;
  s.hsRed = false;
}
function stepStars(s: GameState): void {
  s.starLfsr = s.starLfsr === 0 ? 0xace1 : stepStarLfsr(s.starLfsr);
  if (s.starDx === 1) s.starPanX = wrapCoord(s.starPanX + STAR_PAN_STEP, STAR_MAP_W);
  else if (s.starDx === -1)
    s.starPanX = wrapCoord(s.starPanX - STAR_PAN_STEP, STAR_MAP_W);
  if (s.starDy === 1) s.starPanY = wrapCoord(s.starPanY + STAR_PAN_STEP, STAR_MAP_H);
  else if (s.starDy === -1)
    s.starPanY = wrapCoord(s.starPanY - STAR_PAN_STEP, STAR_MAP_H);
  if (s.starDirTmr === 0) {
    s.starDirTmr = 100 + (s.starLfsr & 0xff);
    switch (s.starLfsr & 0xf) {
      case 0:
      case 8:
        s.starDx = 1;
        s.starDy = 0;
        break;
      case 1:
      case 9:
        s.starDx = -1;
        s.starDy = 0;
        break;
      case 2:
      case 10:
        s.starDx = 0;
        s.starDy = 1;
        break;
      case 3:
      case 11:
        s.starDx = 0;
        s.starDy = -1;
        break;
      case 4:
      case 12:
        s.starDx = 1;
        s.starDy = 1;
        break;
      case 5:
      case 13:
        s.starDx = 1;
        s.starDy = -1;
        break;
      case 6:
      case 14:
        s.starDx = -1;
        s.starDy = 1;
        break;
      default:
        s.starDx = -1;
        s.starDy = -1;
        break;
    }
  } else {
    s.starDirTmr -= 1;
  }
}
function applyThrustGrav(
  thrusting: boolean,
  ang: number,
  vx: number,
  vy: number,
  x: number,
  y: number,
  s: GameState,
  isPlayer: boolean,
): { vx: number; vy: number } {
  const gdx = SUN_X - x;
  const gdy = SUN_Y - y;
  let gx = 0;
  let gy = 0;
  if (s.blackHole || s.antiGrav) {
    gx = gravAcc(gdx, gdx, gdy, s.antiGrav);
    gy = gravAcc(gdy, gdx, gdy, s.antiGrav);
  }
  let thr = 0;
  if (thrusting) {
    if (s.demoModeR) thr = DEMO_THRUST;
    else if (isPlayer) thr = PL_THRUST;
    else thr = s.aiThrust;
  }
  const c = cosAng(ang);
  const si = sinAng(ang);
  let nvx = vx + (c * thr) / Q88 + gx - vx / Q88;
  let nvy = vy + (si * thr) / Q88 + gy - vy / Q88;
  nvx = clampVel(nvx, SHIP_MAXV);
  nvy = clampVel(nvy, SHIP_MAXV);
  return { vx: nvx, vy: nvy };
}
export function createInitialState(): GameState {
  const s: GameState = {
    pos0x: 0,
    pos0y: 0,
    pos1x: 0,
    pos1y: 0,
    vel0x: 0,
    vel0y: 0,
    vel1x: 0,
    vel1y: 0,
    ang0: 0,
    ang1: 0,
    thrusting0: false,
    thrusting1: false,
    shots: emptyShots(),
    score0: 0,
    score1: 0,
    lives0: LIFE_MAX,
    fuelMs: FUEL_MAX_MS,
    timer: DEMO_TIMER,
    frameCnt: 0,
    playSec: 0,
    gameOver: false,
    awaitStart: true,
    testMode: false,
    blackHole: false,
    antiGrav: false,
    antiGravSec: 0,
    sunHits: 0,
    bhHits: 0,
    spawn0: 0,
    spawn1: 0,
    spawnThr0: 0,
    spawnThr1: 0,
    vanish0: 0,
    vanish1: 0,
    hsPhase: 0,
    hsFr: 0,
    hsRed: false,
    fireHold: false,
    firePrev: false,
    fireCd: 0,
    fireReload: 0,
    fireMag: 0,
    hyperPrev: false,
    aiCd: AI_CD_INIT,
    aiReload: 0,
    aiMag: 0,
    aiStreak: 0,
    shipLock: false,
    lfsr: 0xa5,
    playCap: 0,
    aiWild: false,
    aiLifeN: AI_LIFE_0,
    aiStandoff: AI_SO_0,
    aimPct: AI_AIM_0,
    aiThrust: AI_THR_0,
    aiDec: 0,
    demoModeR: true,
    plInvuln: true,
    aiInvuln: true,
    sunNear0: false,
    sunNear1: false,
    wallNear0: false,
    wallNear1: false,
    starPanX: 0,
    starPanY: 0,
    starDx: 1,
    starDy: 0,
    starDirTmr: 120,
    starLfsr: 0xace1,
  };
  respawnPlayer(s);
  respawnAi(s);
  latchAiRamps(s);
  return s;
}
export function step(s: GameState, btn: Buttons): void {
  // Board DIP5: down = test (level). Match clears it.
  if (demoMode(s)) s.testMode = btn.dip5Down;
  else s.testMode = false;
  if (demoMode(s) && !s.testMode && btn.fire && !s.firePrev) {
    startMatch(s);
  }
  const demo = demoMode(s);
  if (
    !demo &&
    btn.hyper &&
    !s.hyperPrev &&
    s.hsPhase === 0 &&
    s.vanish0 === 0
  ) {
    s.hsPhase = 1;
    s.hsFr = HS_VANISH_FR;
    s.thrusting0 = false;
    s.vel0x = 0;
    s.vel0y = 0;
    s.pos0x = parkOff();
    s.pos0y = parkOff();
  }
  if (btn.fire && !s.firePrev && (!demo || s.testMode)) s.fireHold = true;
  s.firePrev = btn.fire;
  s.hyperPrev = btn.hyper;
  if (s.frameCnt === FRAMES_PER_SEC - 1) {
    s.frameCnt = 0;
    if (demo) {
      s.timer = s.timer === 0 ? DEMO_TIMER : timerDec1(s.timer);
      s.fuelMs = FUEL_MAX_MS;
      s.lives0 = LIFE_MAX;
      if (s.playSec < PLAY_MAX_SEC) s.playSec += 1;
    } else {
      if (s.timer === 0) {
        s.gameOver = true;
        s.timer = DEMO_TIMER;
      } else {
        s.timer = timerDec1(s.timer);
      }
      if (s.playSec < PLAY_MAX_SEC) s.playSec += 1;
    }
    if (s.antiGrav) {
      if (s.antiGravSec <= 1) {
        s.antiGrav = false;
        s.antiGravSec = 0;
        s.sunHits = 0;
      } else {
        s.antiGravSec -= 1;
      }
    }
  } else {
    s.frameCnt += 1;
  }
  if (s.spawnThr0 !== 0) s.spawnThr0 -= 1;
  if (s.spawnThr1 !== 0) s.spawnThr1 -= 1;
  latchAiRamps(s);
  if (s.spawn0 !== 0) s.spawn0 -= 1;
  if (s.spawn1 !== 0) s.spawn1 -= 1;
  if (s.vanish1 === 1) respawnAi(s);
  else if (s.vanish1 !== 0) s.vanish1 -= 1;
  if (s.vanish0 === 1) {
    if (demoMode(s) || s.lives0 !== 0) respawnPlayer(s);
    s.vanish0 = 0;
  } else if (s.vanish0 !== 0) s.vanish0 -= 1;
  if (s.hsPhase === 1) {
    s.pos0x = parkOff();
    s.pos0y = parkOff();
    if (s.hsFr === 1) {
      respawnPlayer(s);
      s.hsPhase = 2;
      s.hsFr = HS_FLASH_FR;
      s.hsRed = true;
    } else if (s.hsFr !== 0) {
      s.hsFr -= 1;
    }
  } else if (s.hsPhase === 2) {
    if (s.hsFr === 1) {
      s.hsPhase = 0;
      s.hsFr = 0;
      s.hsRed = false;
    } else {
      if (s.hsFr !== 0) s.hsFr -= 1;
      if ((s.frameCnt & 7) === 0) s.hsRed = !s.hsRed;
    }
  }
  s.lfsr = stepLfsr(s.lfsr);
  if (s.vanish0 !== 0 || s.hsPhase === 1) {
    s.thrusting0 = false;
  } else if (demoMode(s) && !s.testMode) {
    const fx = SUN_X - s.pos0x;
    const fy = SUN_Y - s.pos0y;
    let want: number;
    if (s.wallNear0) {
      want = wantFacing(fx, fy);
      s.ang0 = turnStep(s.ang0, want, 4);
      s.thrusting0 = true;
    } else if (s.sunNear0) {
      want = wantFacing(-fx, -fy);
      s.ang0 = turnStep(s.ang0, want, 4);
      s.thrusting0 = true;
    } else {
      const tdx = s.pos1x - s.pos0x;
      const tdy = s.pos1y - s.pos0y;
      want = wantFacing(tdx, tdy);
      s.ang0 = turnStep(s.ang0, want, 4);
      const dist = Math.abs(tdx) + Math.abs(tdy);
      s.thrusting0 = (facingOk(s.ang0, want) || dist > 400) && dist > s.aiStandoff;
    }
    s.fuelMs = FUEL_MAX_MS;
  } else {
    if (btn.left) s.ang0 = (s.ang0 - 4) & 255;
    if (btn.right) s.ang0 = (s.ang0 + 4) & 255;
    if (btn.thrust && s.fuelMs !== 0 && s.vanish0 === 0) {
      s.thrusting0 = true;
      s.fuelMs = s.fuelMs > FUEL_FRAME_MS ? s.fuelMs - FUEL_FRAME_MS : 0;
    } else {
      s.thrusting0 = false;
    }
    if (demoMode(s) && s.testMode)     s.fuelMs = FUEL_MAX_MS;
  }
  if (
    s.spawnThr0 !== 0 &&
    demoMode(s) &&
    !s.testMode &&
    s.vanish0 === 0 &&
    s.hsPhase !== 1
  ) {
    s.thrusting0 = true;
  }
  if ((s.testMode && s.demoModeR) || s.vanish1 !== 0) {
    s.thrusting1 = false;
  } else {
    const turn = s.demoModeR
      ? 4
      : s.aiWild
        ? 3
        : 1 + ((s.aiDec >> 3) & 3);
    const fx = SUN_X - s.pos1x;
    const fy = SUN_Y - s.pos1y;
    let want: number;
    if (s.demoModeR && s.wallNear1) {
      want = wantFacing(fx, fy);
      s.ang1 = turnStep(s.ang1, want, turn);
      s.thrusting1 = true;
    } else if (s.sunNear1) {
      want = wantFacing(-fx, -fy);
      s.ang1 = turnStep(s.ang1, want, turn);
      s.thrusting1 = true;
    } else {
      const dx = s.pos0x - s.pos1x;
      const dy = s.pos0y - s.pos1y;
      want = wantFacing(dx, dy);
      s.ang1 = turnStep(s.ang1, want, turn);
      const dist = Math.abs(dx) + Math.abs(dy);
      s.thrusting1 = (facingOk(s.ang1, want) || dist > 400) && dist > s.aiStandoff;
    }
  }
  if (
    s.spawnThr1 !== 0 &&
    !(s.testMode && s.demoModeR) &&
    s.vanish1 === 0
  ) {
    s.thrusting1 = true;
  }
  const g0 = applyThrustGrav(
    s.thrusting0,
    s.ang0,
    s.vel0x,
    s.vel0y,
    s.pos0x,
    s.pos0y,
    s,
    true,
  );
  s.vel0x = g0.vx;
  s.vel0y = g0.vy;
  const demoAiTick = !s.demoModeR || (s.frameCnt & 1) === 0;
  if (s.fireReload !== 0) s.fireReload -= 1;
  else if (s.fireCd !== 0) s.fireCd -= 1;
  else if (s.vanish0 === 0 && s.vanish1 === 0 && s.hsPhase !== 1) {
    let wantFire = false;
    if (!demoMode(s) || s.testMode) {
      wantFire = s.fireHold || btn.fire;
    } else {
      const tdx = s.pos1x - s.pos0x;
      const tdy = s.pos1y - s.pos0y;
      wantFire =
        demoAiTick &&
        facingOk(s.ang0, wantFacing(tdx, tdy)) &&
        !shotThruSun(s.pos0x, s.pos0y, s.pos1x, s.pos1y) &&
        (s.aimPct > AI_AIM_FIRE_MIN_PCT || (s.lfsr & 0x40) !== 0);
    }
    if (wantFire && spawnShot(s, true, s.ang0, s.pos0x, s.pos0y, s.vel0x, s.vel0y, PL_BUL_LIFE)) {
      s.fireHold = false;
      if (s.fireMag >= FIRE_MAG_MAX - 1) {
        s.fireMag = 0;
        s.fireReload = FIRE_RELOAD_FR;
        s.fireCd = 0;
      } else {
        s.fireMag += 1;
        s.fireCd = FIRE_GAP_FR;
      }
    }
  }
  const g1 = applyThrustGrav(
    s.thrusting1,
    s.ang1,
    s.vel1x,
    s.vel1y,
    s.pos1x,
    s.pos1y,
    s,
    false,
  );
  s.vel1x = g1.vx;
  s.vel1y = g1.vy;
  if (s.aiReload !== 0) s.aiReload -= 1;
  else if (s.aiCd !== 0) s.aiCd -= 1;
  else if (
    !(s.testMode && s.demoModeR) &&
    s.vanish0 === 0 &&
    s.vanish1 === 0 &&
    demoAiTick &&
    facingOk(s.ang1, wantFacing(s.pos0x - s.pos1x, s.pos0y - s.pos1y)) &&
    !shotThruSun(s.pos1x, s.pos1y, s.pos0x, s.pos0y) &&
    (s.aimPct > AI_AIM_FIRE_MIN_PCT || (s.lfsr & 0x40) !== 0)
  ) {
    if (
      spawnShot(s, false, s.ang1, s.pos1x, s.pos1y, s.vel1x, s.vel1y, s.aiLifeN)
    ) {
      if (s.aiMag >= FIRE_MAG_MAX - 1) {
        s.aiMag = 0;
        s.aiReload =
          FIRE_RELOAD_FR + (s.aimPct < 50 ? AI_RELOAD_POOR_EXTRA : 0);
        s.aiCd = 0;
      } else {
        s.aiMag += 1;
        s.aiCd =
          s.aimPct < 50
            ? FIRE_GAP_FR + AI_GAP_POOR_EXTRA
            : s.aiWild
              ? 3
              : FIRE_GAP_FR;
      }
    }
  }
  if (s.vanish0 === 0 && s.hsPhase !== 1) {
    s.pos0x += s.vel0x;
    s.pos0y += s.vel0y;
  } else {
    s.pos0x = parkOff();
    s.pos0y = parkOff();
  }
  if (s.vanish1 === 0) {
    s.pos1x += s.vel1x;
    s.pos1y += s.vel1y;
  } else {
    s.pos1x = parkOff();
    s.pos1y = parkOff();
  }
  if (s.vanish0 === 0 && s.hsPhase !== 1) {
    if (s.blackHole && wallHit(s.pos0x, s.pos0y) && !s.plInvuln) {
      vanishPlayer(s, true);
      loseLife(s);
    } else if (s.blackHole) {
      const b = bounce(s.pos0x, s.pos0y, s.vel0x, s.vel0y);
      s.pos0x = b.x;
      s.pos0y = b.y;
      s.vel0x = b.vx;
      s.vel0y = b.vy;
    } else {
      const w = wrapPos(s.pos0x, s.pos0y);
      s.pos0x = w.x;
      s.pos0y = w.y;
    }
  }
  if (s.vanish1 === 0) {
    if (s.blackHole && wallHit(s.pos1x, s.pos1y) && !s.aiInvuln) {
      killAi(s, true);
    } else if (s.blackHole) {
      const b = bounce(s.pos1x, s.pos1y, s.vel1x, s.vel1y);
      s.pos1x = b.x;
      s.pos1y = b.y;
      s.vel1x = b.vx;
      s.vel1y = b.vy;
    } else {
      const w = wrapPos(s.pos1x, s.pos1y);
      s.pos1x = w.x;
      s.pos1y = w.y;
    }
  }
  let crashSun0 = false;
  let crashSun1 = false;
  if (sunHit(s.pos0x, s.pos0y) && s.vanish0 === 0 && !s.plInvuln) {
    crashSun0 = true;
    vanishPlayer(s, true);
    loseLife(s);
  }
  if (sunHit(s.pos1x, s.pos1y) && s.vanish1 === 0 && !s.aiInvuln) {
    crashSun1 = true;
    killAi(s, true);
  }
  for (const sh of s.shots) {
    if (!sh.on) continue;
    sh.x += sh.vx;
    sh.y += sh.vy;
    if (!s.blackHole) {
      const w = wrapPos(sh.x, sh.y);
      sh.x = w.x;
      sh.y = w.y;
    }
    if (sh.life !== 0) sh.life -= 1;
  }
  const bdx = s.pos0x - s.pos1x;
  const bdy = s.pos0y - s.pos1y;
  const adx = Math.abs(bdx);
  const ady = Math.abs(bdy);
  if (
    s.vanish0 === 0 &&
    s.vanish1 === 0 &&
    !s.plInvuln &&
    !s.aiInvuln &&
    adx < 20 &&
    ady < 18
  ) {
    if (!s.shipLock) {
      s.vel0x = -s.vel0x;
      s.vel0y = -s.vel0y;
      s.vel1x = -s.vel1x;
      s.vel1y = -s.vel1y;
      if (bdx >= 0) {
        s.pos0x += 8;
        s.pos1x -= 8;
      } else {
        s.pos0x -= 8;
        s.pos1x += 8;
      }
      if (s.score0 > SCORE_LO) s.score0 -= 1;
      if (s.score1 > SCORE_LO) s.score1 -= 1;
    }
    s.shipLock = true;
  } else if (adx >= 26 || ady >= 24) {
    s.shipLock = false;
  }
  let hitAi = false;
  let hitPl = false;
  let sunP = crashSun0;
  let sunE = crashSun1;
  for (let i = 0; i < NSHOT; i++) {
    const sh = s.shots[i];
    if (!sh.on) continue;
    const inPlay = s.blackHole
      ? sh.x >= MARGIN &&
        sh.x <= FB_W - MARGIN &&
        sh.y >= MARGIN &&
        sh.y <= FB_H - MARGIN
      : sh.x >= 0 && sh.x < FB_W && sh.y >= 0 && sh.y < FB_H;
    if (!(sh.life !== 0 && inPlay)) {
      sh.on = false;
      continue;
    }
    let kill = false;
    if (i < NSHOT_PL) {
      if (
        !hitAi &&
        !s.aiInvuln &&
        Math.abs(sh.x - s.pos1x) < 22 &&
        Math.abs(sh.y - s.pos1y) < 22
      ) {
        kill = true;
        killAi(s, true);
        hitAi = true;
      } else if (sunHit(sh.x, sh.y)) {
        kill = true;
        sunP = true;
      }
    } else if (
      !hitPl &&
      !s.plInvuln &&
      Math.abs(sh.x - s.pos0x) < 24 &&
      Math.abs(sh.y - s.pos0y) < 24
    ) {
      kill = true;
      vanishPlayer(s, true);
      hitPl = true;
    } else if (sunHit(sh.x, sh.y)) {
      kill = true;
      sunE = true;
    }
    if (kill) sh.on = false;
  }
  if (s.blackHole) {
    if (sunP) {
      if (s.bhHits === BH_HITS_SUN - 1) {
        s.blackHole = false;
        s.antiGrav = true;
        s.antiGravSec = ANTI_GRAV_SEC;
        s.bhHits = 0;
      } else {
        s.bhHits += 1;
      }
    }
  } else if (!s.antiGrav) {
    let nsh = s.sunHits;
    if (sunP && nsh < 15) nsh += 1;
    if (sunE && nsh < 15) nsh += 1;
    s.sunHits = nsh;
    if (nsh >= SUN_HITS_BH) s.blackHole = true;
  }
  let nl0 = s.lives0;
  let nst = s.aiStreak;
  let nt = s.timer;
  if (hitPl && !demoMode(s) && nl0 !== 0) nl0 -= 1;
  if (hitAi) {
    if (nst === KILL_FOR_LIFE - 1) {
      nst = 0;
      if (!demoMode(s) && nl0 < LIFE_MAX) nl0 += 1;
    } else {
      nst += 1;
    }
  }
  if (!demoMode(s) && (hitAi || hitPl)) {
    nt = timerAddBonus(nt);
  }
  s.lives0 = nl0;
  s.aiStreak = nst;
  if (!demoMode(s) && nl0 === 0) {
    s.gameOver = true;
    s.timer = DEMO_TIMER;
  } else {
    s.timer = nt;
  }
  stepStars(s);
}
export function formatTimer(t: number): { mm: string; ss: string } {
  const mm = Math.floor(t / 100);
  const ss = t % 100;
  return {
    mm: String(mm).padStart(2, "0"),
    ss: String(ss).padStart(2, "0"),
  };
}