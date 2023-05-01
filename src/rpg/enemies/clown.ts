import clownSheetPath from "~/assets/pigeon_walking-Sheet.png";
import { randomFromArray } from "~/util/randomFromArray";
import { damagePlayer } from "../actionUtil";
import { Actor } from "../actor";
import { FrameAnimation, PositionAnimation, makeFrameAnimation, makeLerpAnimation } from "../animation";
import { Player } from "../basePlayer";
import { combatTime, currentCombat, getActorAtLocation, lastNPCLog, performNPCAction } from "../combat";
import { SpriteSheet, drawSprite } from "../drawSprite";
import { loadImage } from "../loadImage";
import { GRID_SQUARE_HEIGHT, GRID_SQUARE_WIDTH, gridLocationToCanvas, gridLocationToCenter } from "../render";
import { singleGridLocation, singlePlayer } from "../targetShapes";
import { BaseEnemy } from "./baseEnemy";
import { animate } from "../animate";
import { emitHandcuffParticle } from "../particles/handcuffs";
import { wait } from "~/util/wait";
import { GridLocation } from "../action";

const clownSheet: SpriteSheet = {
    image: loadImage(clownSheetPath),
    spriteWidth: 32,
    spriteHeight: 36,
};

const circusAct = {
    id: "circusAct",
    name: "Circus Act",
    description: "Clown does a funny walk",
    targetType: "grid",
    targeting: singleGridLocation,
    async apply(this: Actor, targets: GridLocation[]) {
        // const cop = this as Clown;
        // lastNPCLog.value = `Clown does a funny walk`;
        // damagePlayer(this, targets[0], 10 - cop.x);
    },
    animation: {
        async animate(this: Actor, target: GridLocation) {
            // const cop = this as Cop;
            // cop.frameAnimation = makeFrameAnimation(
            //     [
            //         [0, 0],
            //         [1, 0],
            //         [2, 0],
            //         [3, 0],
            //     ],
            //     75,
            //     undefined,
            //     () => {
            //         cop.frameAnimation = undefined;
            //         cop.sheet = undefined;
            //     }
            // );
            // cop.sheet = clownShootSheet;
            // await animate((dt) => {
            //     cop.frameAnimation?.tick(dt);
            // }, 300);
        },
    },
} as const;

const lineUp = {
    id: "lineUp",
    name: "Line Up",
    description: "<NUMBER> clowns line up to put on a violent display to <TARGET>.",
    targetType: "player",
    targeting: singlePlayer,
    async apply(this: Actor, targets: Player[]) {
        // let targetAbility = randomFromArray(targets[0].actions);
        // lastNPCLog.value = `{NUMBER} clowns line up to put on a violent display to {TARGET}.`;
        // targets[0].cooldowns.set(targetAbility as any, 2);
    },
    animation: {
        async animate(this: Actor, target: Player) {
            // const cop = this as Clown;
            // const myPos = gridLocationToCanvas(cop.x, cop.y);
            // const targetPos = target.getVisiblePosition();
            // emitHandcuffParticle(
            //     myPos[0] + GRID_SQUARE_WIDTH / 2,
            //     myPos[1] + GRID_SQUARE_HEIGHT / 2,
            //     targetPos[0],
            //     targetPos[1]
            // );

            // await wait(400);
        },
    },
} as const;

const laughterIsTheBestMedicine = {
    id: "laughterIsTheBestMedicine",
    name: "Laughter Is The Best Medicine",
    description: "Clown tells his nearby friends a good joke. Humour really is healing.",
    targetType: "grid",
    targeting: singleGridLocation,
    async apply(this: Actor, targets: GridLocation[]) {
        // const cop = this as Clown;
        // lastNPCLog.value = `Cop charges forward 2 spaces`;

        // // try to move left twice
        // const target: GridLocation = [cop.x - 1, cop.y];
        // if (target[0] < 0 || getActorAtLocation(target)) {
        //     target[0] = target[0] + 1;
        // }
        // target[0] = target[0] - 1;
        // if (target[0] < 0 || getActorAtLocation(target)) {
        //     target[0] = target[0] + 1;
        // }
        // const distance = cop.x - target[0];
        // if (distance === 0) {
        //     return;
        // }
        // cop.positionAnimation = makeLerpAnimation(
        //     gridLocationToCenter([cop.x, cop.y]),
        //     gridLocationToCenter(target),
        //     distance * 150,
        //     undefined,
        //     () => {
        //         cop.positionAnimation = undefined;
        //     }
        // );
        // await animate(cop.positionAnimation.tick, cop.positionAnimation.duration);

        // cop.x = target[0];
        // cop.y = target[1];
    },
    animation: {
        async animate(this: Actor, target: GridLocation) {
            // await wait(400);
        },
    },
} as const;

export class Clown extends BaseEnemy {
    actions = [circusAct, lineUp, laughterIsTheBestMedicine] as const;
    displayName: string = "Clown";
    sheet: SpriteSheet | undefined;
    static maxHP: number = 21;
    static hp: number = 21;
    frameAnimation: FrameAnimation | undefined;
    draw(context: CanvasRenderingContext2D) {
        let frame: readonly [number, number];
        if (this.frameAnimation) {
            frame = this.frameAnimation.frames[this.frameAnimation.currentIndex];
        } else {
            if (currentCombat?.currentTurn.value === this) {
                frame = [Math.floor(combatTime.value / (1000 / 8)) % 4, 0];
            } else {
                frame = [0, 0];
            }
        }
        let x = this.positionAnimation?.currentPos[0] ?? this.x * GRID_SQUARE_WIDTH + GRID_SQUARE_WIDTH / 2;
        let y = this.positionAnimation?.currentPos[1] ?? this.y * GRID_SQUARE_HEIGHT + GRID_SQUARE_HEIGHT / 2;
        let sheet = this.sheet ?? clownSheet;
        drawSprite(context, sheet, x, y, this.frameAnimation?.frames[this.frameAnimation.currentIndex] ?? [0, 0], {
            width: sheet.spriteWidth * 0.6,
            height: sheet.spriteHeight * 0.6,
        });
        super.draw(context);
    }
    async doTurn(): Promise<void> {
        const playersWithValidHandcuffTargets = currentCombat!.players.filter((player) => {
            let abilitiesWithoutCooldown = 0;
            for (const cooldown of player.cooldowns.values()) {
                if (cooldown === 0) {
                    abilitiesWithoutCooldown++;
                }
            }
            return abilitiesWithoutCooldown > 1;
        });

        const validActions = this.actions.filter((action) => {
            if (action.id === "handcuff") {
                if (playersWithValidHandcuffTargets.length === 0) {
                    return false;
                }
            }
            if (action.id === "runDown") {
                // don't charge forward if there's no spaces to the left
                if (this.x === 0) {
                    return false;
                }
                const leftOne: GridLocation = [this.x - 1, this.y];
                if (getActorAtLocation(leftOne)) {
                    return false;
                }
            }
            return true;
        });
        let action = randomFromArray(validActions);
        if (action.id === "handcuff") {
            return performNPCAction(this, action, randomFromArray(playersWithValidHandcuffTargets));
        }
        if (action.id === "shoot") {
            return performNPCAction(this, action, randomFromArray(currentCombat!.players));
        } else if (action.id === "runDown") {
            return performNPCAction(this, action, [this.x - 2, this.y]);
        }
    }
}
