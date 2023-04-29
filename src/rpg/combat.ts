import { signal } from "@preact/signals";
import { renderUI } from "~/ui/ui";
import { EnemyType } from "./enemies";
import { BaseEntity } from "./baseEntity";
import { Rat } from "./enemies/rat";
import { Player } from "./basePlayer";
import { Cassie } from "./players/cassie";

interface CombatDescription {
    gridWidth: number;
    gridHeight: number;
    enemies: Array<{ type: EnemyType; x: number; y: number }>;
    players: (typeof Player)[];
    playerLevel: number;
    startingSide: StartingSide;
}

enum StartingSide{
    player = 0,
    enemy = 1
}

function makeCombat(a: CombatDescription) {
    return a;
}

export const combats = {
    none: undefined,
    tutorial: makeCombat({
        gridWidth: 5,
        gridHeight: 5,
        players: [Cassie, Cassie, Cassie, Cassie],
        playerLevel: 1,
        enemies: [
            { type: "rat", x: 2, y: 2 },
            { type: "rat", x: 1, y: 2 },
            { type: "rat", x: 2, y: 3 },
            { type: "rat", x: 3, y: 3 },
        ],
        startingSide: StartingSide.player
    }),
} as const;

export let currentCombat: CurrentCombat | undefined;
interface CurrentCombat {
    name: keyof typeof combats;
    width: number;
    height: number;
    players: Player[];
    entities: BaseEntity[];
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
    const combatDescription = combats[combatName];
    currentCombat = {
        name: combatName,
        state: "active",
        width: combatDescription.gridWidth,
        height: combatDescription.gridHeight,
        players: combatDescription.players.map((PlayerClass) => {
            return new (PlayerClass as unknown as new (playerLevel: number) => Player)(combatDescription.playerLevel);
        }),
        entities: combatDescription.enemies.map((enemyDesc) => {
            if (enemyDesc.type === "rat") {
                return new Rat(enemyDesc.x, enemyDesc.y);
            }
            throw "Unimplemented enemyType";
        }),
    };
    if (import.meta.env.DEV) {
        //@ts-ignore
        window.DEBUG_COMBAT = currentCombat;
    }

    updateCombatTimeAnimationFrame = requestAnimationFrame(updateGameTime);
}

export function endCombat() {
    currentCombat = undefined;
    if (import.meta.env.DEV) {
        //@ts-ignore
        window.DEBUG_COMBAT = currentCombat;
    }
    renderUI();
    if (updateCombatTimeAnimationFrame) {
        cancelAnimationFrame(updateCombatTimeAnimationFrame);
    }
}

export function shouldShowCombat() {
    return currentCombat !== undefined;
}
