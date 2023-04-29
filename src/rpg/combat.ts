import { signal } from "@preact/signals";
import { renderUI } from "~/ui/ui";

interface Combat {}

function makeCombat(a: Combat) {
    return a;
}

export const combats = {
    none: undefined,
    tutorial: makeCombat({}),
} as const;

let currentCombatName: keyof typeof combats | undefined;
export let combatState: "won" | "lost" | "active";

let lastTick = performance.now();
export const combatTime = signal(0);
let updateCombatTimeAnimationFrame: number | undefined;
function updateGameTime(now: number) {
    const delta = now - lastTick;
    combatTime.value += delta;
    lastTick = now;

    updateCombatTimeAnimationFrame = requestAnimationFrame(updateGameTime);
}

export function startCombat(combatName: keyof typeof combats) {
    currentCombatName = combatName;
    combatState = "active";
    updateCombatTimeAnimationFrame = requestAnimationFrame(updateGameTime);
}

export function endCombat() {
    currentCombatName = undefined;
    renderUI();
    if (updateCombatTimeAnimationFrame) {
        cancelAnimationFrame(updateCombatTimeAnimationFrame);
    }
}

export function shouldShowCombat() {
    return currentCombatName !== undefined;
}
