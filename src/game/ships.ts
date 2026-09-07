/** Vector outlines from `sw_draw.v` (Diamond + Asteroids wedge). Nose = +X. */
export const DIAMOND: ReadonlyArray<readonly [number, number]> = [
  [14, 0],
  [4, 7],
  [-2, 3],
  [-14, 8],
  [-10, 0],
  [-14, -8],
  [-2, -3],
  [4, -7],
];
export const DIAMOND_EDGES: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 0],
  [2, 4],
  [6, 4],
];
export const WEDGE: ReadonlyArray<readonly [number, number]> = [
  [14, 0],
  [-11, -9],
  [-3, 0],
  [-11, 9],
];
export const WEDGE_EDGES: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
];
export const DIAMOND_HITCH = 4;
export const WEDGE_HITCH = 2;
export const FLAME_LEN = 10;
export function angRad(ang: number): number {
  return (ang / 256) * Math.PI * 2;
}
export function cosAng(ang: number): number {
  return Math.cos(angRad(ang));
}
export function sinAng(ang: number): number {
  return Math.sin(angRad(ang));
}
export function xform(
  lx: number,
  ly: number,
  ang: number,
  ox: number,
  oy: number,
): { x: number; y: number } {
  const c = cosAng(ang);
  const s = sinAng(ang);
  return {
    x: ox + lx * c - ly * s,
    y: oy + lx * s + ly * c,
  };
}
export function shipVerts(
  kind: "diamond" | "wedge",
  ang: number,
  ox: number,
  oy: number,
): Array<{ x: number; y: number }> {
  const src = kind === "diamond" ? DIAMOND : WEDGE;
  return src.map(([lx, ly]) => xform(lx, ly, ang, ox, oy));
}