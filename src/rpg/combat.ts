import { signal } from "@preact/signals";
import { renderUI } from "~/ui/ui";
import { EnemyType } from "./enemies";

interface Combat {
    gridWidth: number;
    gridHeight: number;
    enemies: Array<{ type: EnemyType; x: number; y: number }>;
}

function makeCombat(a: Combat) {
    return a;
}

export const combats = {
    none: undefined,
    tutorial: makeCombat({
        gridWidth: 5,
        gridHeight: 5,
        enemies: [],
    }),
} as const;

export let currentCombat: CurrentCombat | undefined;
interface CurrentCombat {
    name: keyof typeof combats;
    width: number;
    height: number;
    entities: [];
    state: "won" | "lost" | "active";
}

let lastTick = performance.now();
export const combatTime = signal(0);
let updateCombatTimeAnimationFrame: number | undefined;
function updateGameTime(now: number) {
    const delta = now - lastTick;
    combatTime.value += delta;
    lastTick = now;

    updateCombatTimeAnimationFrame = requestAnimationFrame(updateGameTime);
}

export function startCombat(combatName: Exclude<keyof typeof combats, "none">) {
    currentCombat = {
        name: combatName,
        state: "active",
        width: combats[combatName].gridWidth,
        height: combats[combatName].gridHeight,
        entities: [],
    };
    updateCombatTimeAnimationFrame = requestAnimationFrame(updateGameTime);
}

export function endCombat() {
    currentCombat = undefined;
    renderUI();
    if (updateCombatTimeAnimationFrame) {
        cancelAnimationFrame(updateCombatTimeAnimationFrame);
    }
}

export function shouldShowCombat() {
    return currentCombat !== undefined;
}
