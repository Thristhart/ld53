import { Signal, signal } from "@preact/signals";
import { renderUI } from "~/ui/ui";
import { EnemyType } from "./enemies";
import { BaseEntity } from "./baseEntity";
import { Rat } from "./enemies/rat";
import { Player } from "./basePlayer";
import { Cassie } from "./players/cassie";
import { Actor, isActor } from "./actor";
import { BaseEnemy } from "./enemies/baseEnemy";
import { selectedAction } from "~/ui/Actions";
import { animate } from "./animate";
import { wait } from "~/util/wait";
import { Action, GridLocation } from "./action";

interface EnemyDescription {
    type: EnemyType;
    x: number;
    y: number;
}

interface CombatDescription {
    gridWidth: number;
    gridHeight: number;
    enemies: Array<EnemyDescription>;
    players: (typeof Player)[];
    playerLevel: number;
    startingSide: StartingSide;
}

enum StartingSide {
    player = 0,
    enemy = 1,
}

function makeCombat(a: CombatDescription) {
    return a;
}

export const combats = {
    none: undefined,
    tutorial: makeCombat({
        gridWidth: 5,
        gridHeight: 5,
        players: [Cassie],
        playerLevel: 4,
        enemies: [
            { type: "rat", x: 1, y: 3 },
            { type: "rat", x: 2, y: 2 },
            { type: "rat", x: 1, y: 2 },
            { type: "rat", x: 2, y: 3 },
            { type: "rat", x: 3, y: 3 },
        ],
        startingSide: StartingSide.player,
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
    currentTurn: Signal<Actor>;
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

export function createEnemy(enemyDesc: EnemyDescription) {
    if (enemyDesc.type === "rat") {
        return new Rat(enemyDesc.x, enemyDesc.y);
    }
    throw "Unimplemented enemyType";
}

export function spawnEnemy(enemyDesc: EnemyDescription) {
    if (!currentCombat) {
        throw "spawnEnemy outside of combat";
    }
    const enemy = createEnemy(enemyDesc);
    actorsWhoHaveActedThisRound.add(enemy);
    currentCombat.entities.push(enemy);
    return enemy;
}

export const currentActionTarget = signal<Player | [x: number, y: number] | undefined>(undefined);

export function startCombat(combatName: Exclude<keyof typeof combats, "none">) {
    const combatDescription = combats[combatName];
    const players = combatDescription.players.map((PlayerClass) => {
        return new (PlayerClass as unknown as new (playerLevel: number) => Player)(combatDescription.playerLevel);
    });
    const entities = combatDescription.enemies.map(createEnemy);
    currentCombat = {
        name: combatName,
        state: "active",
        width: combatDescription.gridWidth,
        height: combatDescription.gridHeight,
        players,
        entities,
        currentTurn: signal(players[0]),
    };
    if (import.meta.env.DEV) {
        //@ts-ignore
        window.DEBUG_COMBAT = currentCombat;
    }

    updateCombatTimeAnimationFrame = requestAnimationFrame(updateGameTime);
}

const actorsWhoHaveActedThisRound = new Set<Actor>();

export function nextTurn() {
    if (!currentCombat) {
        return;
    }
    actorsWhoHaveActedThisRound.add(currentCombat.currentTurn.value);
    // TODO: skip if dead
    if (currentCombat.currentTurn.value instanceof Player) {
        const playerIndex = currentCombat.players.indexOf(currentCombat.currentTurn.value);
        if (playerIndex < currentCombat.players.length - 1) {
            // this will fall apart if there's a way to go to previous player's turn... so don't do that
            currentCombat.currentTurn.value = currentCombat.players[playerIndex + 1];
            return;
        }
    }
    const actorTurns = currentCombat.entities.filter(
        (ent) => isActor(ent) && !actorsWhoHaveActedThisRound.has(ent)
    ) as (BaseEntity & Actor)[];
    const entityTurns = actorTurns.sort((a, b) => {
        if (a.x < b.x) {
            return -1;
        }
        if (a.x > b.x) {
            return 1;
        }
        if (a.y < b.y) {
            return -1;
        }
        if (a.y > b.y) {
            return 1;
        }
        return 0;
    });
    let startIndex = -1;
    if (currentCombat.currentTurn.value instanceof BaseEnemy) {
        startIndex = entityTurns.indexOf(currentCombat.currentTurn.value);
    }
    if (startIndex >= entityTurns.length - 1) {
        // Top of the round, sort of
        currentCombat.currentTurn.value = currentCombat.players[0];
        actorsWhoHaveActedThisRound.clear();
        return;
    }
    currentCombat.currentTurn.value = entityTurns[startIndex + 1];
    doNPCTurn();
}

const TURN_DELAY = 1000;

async function doNPCTurn() {
    await wait(TURN_DELAY + Math.random() * 400 - 200);
    await currentCombat?.currentTurn.value.doTurn();
    nextTurn();
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

export async function performCurrentPlayerAction(): Promise<void> {
    if (
        !currentCombat ||
        !(currentCombat.currentTurn.value instanceof Player) ||
        !selectedAction.value ||
        !currentActionTarget.value
    ) {
        return;
    }
    const action = selectedAction.value;
    const targets = action.targeting(currentActionTarget.value as Player & GridLocation);
    if (targets.length === 0) {
        return;
    }
    if (action.animation) {
        await animate(action.animation.animate, action.animation.duration);
    }
    // @ts-ignore fuck it
    action.apply.call(currentCombat.currentTurn.value, targets);
    selectedAction.value = undefined;
    currentActionTarget.value = undefined;
    nextTurn();
}

export async function performNPCAction<TargetType extends Player | GridLocation >(
    actor: Actor,
    action: Action<TargetType>,
    target: TargetType
): Promise<void> {
    if (!currentCombat) {
        return;
    }
    const targets = action.targeting(target);
    if (action.animation) {
        await animate(action.animation.animate, action.animation.duration);
    }
    // @ts-ignore fuck it
    return action.apply.call(actor, targets);
}

export function getActorAtLocation(location: GridLocation): BaseEntity & Actor {
    return currentCombat?.entities.find(
        (ent) => isActor(ent) && ent.x === location[0] && ent.y === location[1]
    ) as BaseEntity & Actor;
}

export function damageActor(from: Actor, target: Actor, damage: number) {
    target.hp -= damage;
}

export function damageEntity(from: Actor, target: BaseEntity & Actor, damage: number) {
    damageActor(from, target, damage);
    if(target.hp <= 0){
        target.die();
    }
}
