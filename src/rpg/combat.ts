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
import { Bear } from "./players/bear";
import { Clown } from "./enemies/clown";
import { Howl } from "howler";
import combatMusicPath from "~/assets/audio/battle final mix.mp3";
import fanfareMusicPath from "~/assets/audio/fanfare.mp3";

import { Fire } from "./entities/fire";
import { emitDamageParticle } from "./particles/damage";
import { GRID_SQUARE_HEIGHT, GRID_SQUARE_WIDTH, camera, gridLocationToCanvas } from "./render";

const musicVolume = 0.08;

const combatMusic1 = new Howl({ src: [combatMusicPath], volume: musicVolume });
const combatMusic2 = new Howl({ src: [combatMusicPath], volume: musicVolume });
let currentCombatMusic = combatMusic1;
const fanfare = new Howl({ src: [fanfareMusicPath], volume: musicVolume });

if (import.meta.env.DEV) {
    //@ts-ignore
    window.DEBUG_MUSIC = () => currentCombatMusic;
}

const loopEndTime = 188.8;

function doLoopFrame() {
    requestAnimationFrame(doLoopFrame);
    const pos = currentCombatMusic.seek();
    if (pos > loopEndTime) {
        currentCombatMusic = currentCombatMusic === combatMusic1 ? combatMusic2 : combatMusic1;
        currentCombatMusic.seek(3.2);
        currentCombatMusic.play();
    }
}

doLoopFrame();

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
            { type: "rat", x: 0, y: 2 },
            { type: "rat", x: 1, y: 1 },
            { type: "rat", x: 1, y: 2 },
            { type: "rat", x: 2, y: 1 },
            { type: "rat", x: 2, y: 2 },
            { type: "rat", x: 4, y: 1 },
            { type: "rat", x: 4, y: 2 },
        ],
        startingSide: StartingSide.enemy,
    }),
    cops: makeCombat({
        gridWidth: 5,
        gridHeight: 5,
        players: [Cassie, Frog],
        playerLevel: 3,
        enemies: [
            { type: "cop", x: 2, y: 2 },
            { type: "cop", x: 0, y: 1 },
            { type: "cop", x: 3, y: 2 },
            { type: "cop", x: 4, y: 4 },
        ],
        startingSide: StartingSide.enemy,
    }),
    clowns: makeCombat({
        gridWidth: 5,
        gridHeight: 5,
        players: [Bear, Cassie, Frog],
        playerLevel: 4,
        enemies: [
            { type: "clown", x: 2, y: 0 },
            { type: "clown", x: 3, y: 1 },
            { type: "clown", x: 4, y: 2 },
            { type: "clown", x: 3, y: 3 },
            { type: "clown", x: 2, y: 4 },
            { type: "clown", x: 1, y: 3 },
            { type: "clown", x: 0, y: 2 },
            { type: "clown", x: 1, y: 1 },
            { type: "clown", x: 2, y: 2 },
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
    if (enemyDesc.type === "clown") {
        return new Clown(enemyDesc.x, enemyDesc.y);
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

    currentCombatMusic.play();
    currentCombatMusic.fade(0, musicVolume, 300);

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
        if (a instanceof Fire) {
            return -1;
        }
        if (b instanceof Fire) {
            return 1;
        }
        return 0;
    });
}

export function skipActorTurn(actor: Actor) {
    actorsWhoHaveActedThisRound.add(actor);
}

export function hasActorActed(actor: Actor) {
    return actorsWhoHaveActedThisRound.has(actor);
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

const TURN_DELAY = 700;

async function doNPCTurn() {
    const npc = currentCombat?.currentTurn.value;
    const doTurn = npc?.doTurn?.bind(npc);
    if (doTurn) {
        await wait(npc?.turnDelay ?? TURN_DELAY);
        if (!currentCombat) {
            return;
        }
        await doTurn();
        await wait(npc?.turnDelay ?? TURN_DELAY);
    }
    nextTurn();
}

export async function endCombat() {
    currentCombat = undefined;
    if (import.meta.env.DEV) {
        //@ts-ignore
        window.DEBUG_COMBAT = currentCombat;
    }
    renderUI();
    if (updateCombatTimeAnimationFrame) {
        cancelAnimationFrame(updateCombatTimeAnimationFrame);
    }
    currentCombatMusic.fade(currentCombatMusic.volume(), 0, 300);
    await wait(300);
    currentCombatMusic.stop();
}

export async function restartCombat() {
    let combatToRestart = currentCombat!.name;
    await endCombat();
    startCombat(combatToRestart);
    renderUI();
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
    await action.apply.call(currentCombat.currentTurn.value, targets, selectedActionOption.value);
    // @ts-ignore
    currentCombat.currentTurn.value.cooldowns.set(action, action.cooldown ?? 0);
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
    if (!currentCombat || currentCombat.state.value === "lost" || currentCombat.state.value === "won") {
        return;
    }
    const targets = action.targeting(target, selectedActionOption.value);
    if (action.animation) {
        await action.animation.animate.call(actor, target, targets);
    }
    // @ts-ignore fuck it
    return action.apply.call(actor, targets);
}

export function getActorsAtLocation(location: GridLocation): (BaseEntity & Actor)[] {
    return currentCombat?.entities.filter(
        (ent) => isActor(ent) && ent.x === location[0] && ent.y === location[1]
    ) as (BaseEntity & Actor)[];
}

export function isActorAtLocation(location: GridLocation) {
    return getActorsAtLocation(location).length > 0;
}

export function isEnemyAtLocation(location: GridLocation) {
    return getActorsAtLocation(location).find((actor) => actor instanceof BaseEnemy);
}

function checkVictoryOrDefeat() {
    if (!currentCombat) {
        return;
    }
    if (currentCombat.players.length === 0) {
        currentCombat.state.value = "lost";
        currentCombatMusic.fade(currentCombatMusic.volume(), 0, 300);
        wait(300).then(() => {
            currentCombatMusic.stop();
        });
    } else if (currentCombat.entities.filter((ent) => ent instanceof BaseEnemy).length === 0) {
        currentCombat.state.value = "won";
        currentCombatMusic.fade(currentCombatMusic.volume(), 0, 300);
        wait(300).then(() => {
            currentCombatMusic.stop();
            fanfare.seek(0);
            fanfare.play();
        });
    }
}

export async function damageActor(from: Actor, target: Actor, damage: number) {
    if (target instanceof Player) {
        if (target.onDamaged) {
            const shouldTakeDamage = await target.onDamaged(from, damage);
            if (!shouldTakeDamage) {
                return;
            }
        }
        const barrierReduction = Math.min(target.barrier, damage);
        damage -= barrierReduction;
        target.barrier -= barrierReduction;
        emitDamageParticle(target.x, target.y, damage);
    }
    target.hp -= damage;
    if (target.hp <= 0) {
        target.die();
    }
    checkVictoryOrDefeat();
}

export async function healActor(from: Actor, target: Actor, heal: number) {
    const maxHeal = target.maxHP - target.hp;
    target.hp += Math.min(heal, maxHeal);
}

export function damageEntity(from: Actor, target: BaseEntity & Actor, damage: number) {
    const particlePos = gridLocationToCanvas(target.x, target.y);
    if (!(target instanceof Fire)) {
        emitDamageParticle(
            particlePos[0] + (GRID_SQUARE_WIDTH / 2) * camera.scale,
            particlePos[1] + (GRID_SQUARE_HEIGHT / 2) * camera.scale,
            damage
        );
    }
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
