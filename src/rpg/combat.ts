import { Signal, signal } from "@preact/signals";
import { showDialog } from "~/story";
import { selectedAction, selectedActionOption } from "~/ui/Actions";
import { renderUI } from "~/ui/ui";
import { wait } from "~/util/wait";
import { Action, GridLocation } from "./action";
import { Actor, isActor } from "./actor";
import { BaseEntity } from "./baseEntity";
import { Player } from "./basePlayer";
import { EnemyType } from "./enemies";
import { BaseEnemy } from "./enemies/baseEnemy";
import { Rat } from "./enemies/rat";
import { Cassie } from "./players/cassie";
import { Frog } from "./players/frog";
import { Cop } from "./enemies/cop";

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
        playerLevel: 2,
        enemies: [
            { type: "rat", x: 1, y: 3 },
            { type: "rat", x: 2, y: 2 },
            { type: "rat", x: 1, y: 2 },
            { type: "rat", x: 2, y: 3 },
            { type: "rat", x: 3, y: 3 },
        ],
        startingSide: StartingSide.player,
    }),
    cops: makeCombat({
        gridWidth: 5,
        gridHeight: 5,
        players: [Cassie, Frog],
        playerLevel: 3,
        enemies: [
            { type: "cop", x: 2, y: 2 },
            { type: "cop", x: 0, y: 1 },
            { type: "cop", x: 4, y: 4 },
        ],
        startingSide: StartingSide.enemy,
    }),
} as const;

export let currentCombat: CurrentCombat | undefined;
interface CurrentCombat {
    name: Exclude<keyof typeof combats, "none">;
    width: number;
    height: number;
    players: Player[];
    entities: BaseEntity[];
    state: Signal<"won" | "lost" | "active">;
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
    if (enemyDesc.type === "cop") {
        return new Cop(enemyDesc.x, enemyDesc.y);
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
        state: signal("active"),
        width: combatDescription.gridWidth,
        height: combatDescription.gridHeight,
        players,
        entities,
        currentTurn: signal(
            combatDescription.startingSide === StartingSide.player ? players[0] : getSortedEntityTurns(entities)[0]
        ),
    };
    if (import.meta.env.DEV) {
        //@ts-ignore
        window.DEBUG_COMBAT = currentCombat;
    }

    updateCombatTimeAnimationFrame = requestAnimationFrame(updateGameTime);
    if (combatDescription.startingSide === StartingSide.enemy) {
        doNPCTurn();
    }
}

const actorsWhoHaveActedThisRound = new Set<Actor>();

function getSortedEntityTurns(entities: BaseEntity[]) {
    const actorTurns = entities.filter((ent) => isActor(ent) && !actorsWhoHaveActedThisRound.has(ent)) as (BaseEntity &
        Actor)[];
    return actorTurns.sort((a, b) => {
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
}

export function nextTurn() {
    if (!currentCombat) {
        return;
    }
    actorsWhoHaveActedThisRound.add(currentCombat.currentTurn.value);
    if (currentCombat.currentTurn.value instanceof Player) {
        const playerIndex = currentCombat.players.indexOf(currentCombat.currentTurn.value);
        if (playerIndex < currentCombat.players.length - 1) {
            // this will fall apart if there's a way to go to previous player's turn... so don't do that
            currentCombat.currentTurn.value = currentCombat.players[playerIndex + 1];
            if (currentCombat.currentTurn.value instanceof Player) {
                currentCombat.currentTurn.value.decrementCooldown();
            }
            return;
        }
    }
    const entityTurns = getSortedEntityTurns(currentCombat.entities);
    let startIndex = -1;
    if (currentCombat.currentTurn.value instanceof BaseEnemy) {
        startIndex = entityTurns.indexOf(currentCombat.currentTurn.value);
    }
    if (startIndex >= entityTurns.length - 1) {
        // Top of the round, sort of
        currentCombat.currentTurn.value = currentCombat.players[0];
        if (currentCombat.currentTurn.value instanceof Player) {
            currentCombat.currentTurn.value.decrementCooldown();
        }
        actorsWhoHaveActedThisRound.clear();
        lastNPCLog.value = undefined;
        return;
    }
    currentCombat.currentTurn.value = entityTurns[startIndex + 1];
    doNPCTurn();
}

const TURN_DELAY = 500;

async function doNPCTurn() {
    await wait(TURN_DELAY + Math.random() * 400 - 200);
    await currentCombat?.currentTurn.value.doTurn();
    await wait(TURN_DELAY + Math.random() * 400 - 200);
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

export function restartCombat() {
    let combatToRestart = currentCombat!.name;
    endCombat();
    startCombat(combatToRestart);
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
    const targets = action.targeting(currentActionTarget.value as Player & GridLocation, selectedActionOption.value);
    if (targets.length === 0) {
        return;
    }
    if (action.animation) {
        // @ts-ignore
        await action.animation.animate.call(currentCombat.currentTurn.value, currentActionTarget.value, targets);
    }
    // @ts-ignore fuck it
    await action.apply.call(currentCombat.currentTurn.value, targets);
    selectedAction.value = undefined;
    currentActionTarget.value = undefined;
    nextTurn();
}

export const lastNPCLog = signal<string | undefined>(undefined);

export async function performNPCAction<TargetType extends Player | GridLocation>(
    actor: Actor,
    action: Action<TargetType>,
    target: TargetType
): Promise<void> {
    if (!currentCombat) {
        return;
    }
    const targets = action.targeting(target, selectedActionOption.value);
    if (action.animation) {
        await action.animation.animate.call(actor, target, targets);
    }
    // @ts-ignore fuck it
    return action.apply.call(actor, targets);
}

export function getActorAtLocation(location: GridLocation): BaseEntity & Actor {
    return currentCombat?.entities.find(
        (ent) => isActor(ent) && ent.x === location[0] && ent.y === location[1]
    ) as BaseEntity & Actor;
}

function checkVictoryOrDefeat() {
    if (!currentCombat) {
        return;
    }
    if (currentCombat.players.length === 0) {
        currentCombat.state.value = "lost";
    } else if (currentCombat.entities.filter((ent) => ent instanceof BaseEnemy).length === 0) {
        currentCombat.state.value = "won";
    }
}

export function damageActor(from: Actor, target: Actor, damage: number) {
    if (target instanceof Player) {
        const barrierReduction = Math.min(target.barrier, damage);
        damage -= barrierReduction;
        target.barrier -= barrierReduction;
    }
    target.hp -= damage;
    if (target.hp <= 0) {
        target.die();
    }
    checkVictoryOrDefeat();
}

export function damageEntity(from: Actor, target: BaseEntity & Actor, damage: number) {
    damageActor(from, target, damage);
}

if (import.meta.env.DEV) {
    //@ts-ignore
    window.DEBUG_SKIP_COMBAT = () => {
        endCombat();
        showDialog();
        renderUI();
    };
}
