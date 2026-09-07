import type { Buttons } from "./types";
export type InputController = {
  held: Buttons;
  pulse: Buttons;
};
export function emptyButtons(): Buttons {
  return {
    left: false,
    right: false,
    thrust: false,
    fire: false,
    hyper: false,
    dip5Down: false,
  };
}
export function createInput(): InputController {
  return { held: emptyButtons(), pulse: emptyButtons() };
}
export function press(
  input: InputController,
  key: keyof Buttons,
  down: boolean,
): void {
  input.held[key] = down;
  if (down) input.pulse[key] = true;
}
/** One physics frame of buttons. A tap that ends before the next tick still counts. */
export function sample(input: InputController): Buttons {
  const out: Buttons = {
    left: input.held.left || input.pulse.left,
    right: input.held.right || input.pulse.right,
    thrust: input.held.thrust || input.pulse.thrust,
    fire: input.held.fire || input.pulse.fire,
    hyper: input.held.hyper || input.pulse.hyper,
    // Level like Dock DIP5 (held only; no edge pulse)
    dip5Down: input.held.dip5Down,
  };
  input.pulse = emptyButtons();
  return out;
}
const KEY_MAP: Record<string, keyof Buttons> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "thrust",
  KeyA: "left",
  KeyD: "right",
  KeyW: "thrust",
  Space: "fire",
  KeyK: "fire",
  ShiftLeft: "hyper",
  ShiftRight: "hyper",
  KeyH: "hyper",
  KeyZ: "hyper",
  Digit5: "dip5Down",
  Numpad5: "dip5Down",
  KeyT: "dip5Down",
};
const BLOCK_SCROLL = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space",
]);
function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}
export function bindKeyboard(input: InputController): () => void {
  const down = (e: KeyboardEvent) => {
    if (isTypingTarget(e.target)) return;
    if (BLOCK_SCROLL.has(e.code)) e.preventDefault();
    const bind = KEY_MAP[e.code];
    if (!bind) return;
    e.preventDefault();
    press(input, bind, true);
  };
  const up = (e: KeyboardEvent) => {
    if (isTypingTarget(e.target)) return;
    if (BLOCK_SCROLL.has(e.code)) e.preventDefault();
    const bind = KEY_MAP[e.code];
    if (!bind) return;
    e.preventDefault();
    press(input, bind, false);
  };
  const blur = () => {
    input.held = emptyButtons();
    input.pulse = emptyButtons();
  };
  window.addEventListener("keydown", down, { capture: true });
  window.addEventListener("keyup", up, { capture: true });
  window.addEventListener("blur", blur);
  return () => {
    window.removeEventListener("keydown", down, { capture: true });
    window.removeEventListener("keyup", up, { capture: true });
    window.removeEventListener("blur", blur);
  };
}
