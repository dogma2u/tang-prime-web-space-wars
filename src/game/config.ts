/** Knobs copied from the Tang Primer 20K `sw_config.vh` (version 1.01.DONE). */
export const FB_W = 800;
export const FB_H = 470;
export const LCD_H = 480;
export const MARGIN = 20;
export const SUN_X = 400;
export const SUN_Y = 240;
export const SUN_R = 18;
export const FRAMES_PER_SEC = 50;
export const FRAME_MS = 1000 / FRAMES_PER_SEC;
export const WALL_KEEP = 60;
export const SUN_HITS_BH = 10;
export const BH_HITS_SUN = 5;
export const SUN_HIT_M = 22;
export const SUN_NEAR_M = 100;
export const ANTI_GRAV_SEC = 10;
export const NSHOT = 8;
export const NSHOT_PL = 5;
export const PL_BUL_LIFE = 28;
export const SHOT_SPD_PX = 10;
export const FIRE_GAP_FR = 5;
export const FIRE_RELOAD_FR = 25;
export const FIRE_MAG_MAX = 5;
export const PL_THRUST = 60;
export const LIFE_MAX = 5;
export const LIFE_START = 3;
export const KILL_FOR_LIFE = 5;
export const FUEL_MAX_MS = 15000;
export const FUEL_FRAME_MS = 20;
export const TIMER_START = 130;
export const TIMER_BONUS = 5;
export const TIMER_MAX = 5959;
export const DEMO_TIMER = 5959;
export const SCORE_LO = -999;
export const SCORE_HI = 999;
export const SPAWN_INVULN_FR = 75;
export const AI_VANISH_FR = 25;
export const HS_VANISH_FR = 50;
export const HS_FLASH_FR = 75;
export const AI_SPAWN_THRUST_FR = 25;
export const SPAWN_MIN_DIST = 200;
export const PLAY_MAX_SEC = 300;
export const AI_CD_INIT = 20;
export const AI_RANGE_NUM = 3;
export const AI_RANGE_DEN = 4;
export const USER_RANGE = SHOT_SPD_PX * PL_BUL_LIFE;
export const AI_LIFE_CAP = Math.floor(
  (USER_RANGE * AI_RANGE_NUM) / (AI_RANGE_DEN * SHOT_SPD_PX),
);
export const AI_AIM_FIRE_MIN_PCT = 15;
export const AI_RELOAD_POOR_EXTRA = 15;
export const AI_GAP_POOR_EXTRA = 10;
export const AI_BP_LIFE_0 = 45;
export const AI_BP_LIFE_1 = 150;
export const AI_LIFE_0 = 14;
export const AI_LIFE_1 = 18;
export const AI_BP_SO_0 = 45;
export const AI_BP_SO_1 = 90;
export const AI_BP_SO_2 = 150;
export const AI_SO_0 = 280;
export const AI_SO_1 = 210;
export const AI_SO_2 = 140;
export const AI_SO_3 = 70;
export const AI_BP_AIM_0 = 45;
export const AI_BP_AIM_1 = 90;
export const AI_BP_AIM_2 = 150;
export const AI_BP_AIM_3 = 300;
export const AI_AIM_0 = 0;
export const AI_AIM_1 = 25;
export const AI_AIM_2 = 55;
export const AI_AIM_3 = 75;
export const AI_AIM_4 = 100;
export const AI_BP_THR_0 = 75;
export const AI_BP_THR_1 = 150;
export const AI_BP_THR_2 = 225;
export const AI_THR_0 = 18;
export const AI_THR_1 = 30;
export const AI_THR_2 = 42;
export const AI_THR_3 = 60;
export const AI_WILD_SEC = 150;
export const SHIP_MAXV = 10;
export const DEMO_THR_NUM = 3;
export const DEMO_THR_DEN = 2;
export const DEMO_THRUST = (AI_THR_3 * DEMO_THR_NUM) / DEMO_THR_DEN;
export const STAR_MAP_W = 3200;
export const STAR_MAP_H = 470;
export const STAR_PAN_STEP = 1;
export const Q88 = 256;
export const COL = {
  diamond: "#00ff00",
  diamondHsRed: "#ff0000",
  ai: "#ffff00",
  shot: "#ffffff",
  score: "#63f3ff",
  timer: "#c8c8c8",
  timerYellow: "#c8c800",
  timerRed: "#c80000",
  go: "#ff0000",
  push: "#00ff00",
  sunCore: "#ffc120",
  sunMid: "#f49210",
  sunRim: "#c65000",
  bh: "#100010",
  star: "#ffffff",
  fuelGreen: "#00ff00",
  fuelYellow: "#ffff00",
  fuelRed: "#ff0000",
  life: "#ffffff",
  borderRed: "#ff0000",
};
