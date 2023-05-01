import copSheetPath from "~/assets/pigeon_walking-Sheet.png";
import copShootSheetPath from "~/assets/pigeon_shoot_sheet.png";
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

const copSheet: SpriteSheet = {
    image: loadImage(copSheetPath),
    spriteWidth: 32,
    spriteHeight: 36,
};
const copShootSheet: SpriteSheet = {
    image: loadImage(copShootSheetPath),
    spriteWidth: 40,
    spriteHeight: 36,
};

const shoot = {
    id: "shoot",
    name: "Shoot",
    description: "Cop shoots at <TARGET>",
    targetType: "player",
    targeting: singlePlayer,
    async apply(this: Actor, targets: Player[]) {
        const cop = this as Cop;
        lastNPCLog.value = `Cop shoots at ${targets[0].displayName}`;
        damagePlayer(this, targets[0], 10 - cop.x);
    },
    animation: {
        async animate(this: Actor, target: Player) {
            const cop = this as Cop;
            cop.frameAnimation = makeFrameAnimation(
                [
                    [0, 0],
                    [1, 0],
                    [2, 0],
                    [3, 0],
                ],
                75,
                undefined,
                () => {
                    cop.frameAnimation = undefined;
                    cop.sheet = undefined;
                }
            );
            cop.sheet = copShootSheet;
            await animate((dt) => {
                cop.frameAnimation?.tick(dt);
            }, 300);
        },
    },
} as const;

const handcuff = {
    id: "handcuff",
    name: "Handcuff",
    description: "Cop locks down <TARGET>",
    targetType: "player",
    targeting: singlePlayer,
    async apply(this: Actor, targets: Player[]) {
        let targetAbility = randomFromArray(targets[0].actions);
        lastNPCLog.value = `Cop locks down ${targets[0].displayName}, preventing them from using ${targetAbility.name}`;
        targets[0].cooldowns.set(targetAbility as any, 2);
    },
    animation: {
        async animate(this: Actor, target: Player) {
            const cop = this as Cop;
            const myPos = gridLocationToCanvas(cop.x, cop.y);
            emitHandcuffParticle(
                myPos[0] + GRID_SQUARE_WIDTH / 2,
                myPos[1] + GRID_SQUARE_HEIGHT / 2,
                target.x,
                target.y
            );

            await wait(400);
        },
    },
} as const;

const runDown = {
    id: "runDown",
    name: "Run Down",
    description: "Cop charges forward 2 spaces",
    targetType: "grid",
    targeting: singleGridLocation,
    async apply(this: Actor, targets: GridLocation[]) {
        const cop = this as Cop;
        lastNPCLog.value = `Cop charges forward 2 spaces`;

        // try to move left twice
        const target: GridLocation = [cop.x - 1, cop.y];
        if (target[0] < 0 || getActorAtLocation(target)) {
            target[0] = target[0] + 1;
        }
        target[0] = target[0] - 1;
        if (target[0] < 0 || getActorAtLocation(target)) {
            target[0] = target[0] + 1;
        }
        const distance = cop.x - target[0];
        if (distance === 0) {
            return;
        }
        cop.positionAnimation = makeLerpAnimation(
            gridLocationToCenter([cop.x, cop.y]),
            gridLocationToCenter(target),
            distance * 150,
            undefined,
            () => {
                cop.positionAnimation = undefined;
            }
        );
        await animate(cop.positionAnimation.tick, cop.positionAnimation.duration);

        cop.x = target[0];
        cop.y = target[1];
    },
    animation: {
        async animate(this: Actor, target: GridLocation) {
            await wait(400);
        },
    },
} as const;

export class Cop extends BaseEnemy {
    actions = [shoot, handcuff, runDown] as const;
    displayName: string = "Copidgeon";
    sheet: SpriteSheet | undefined;
    static maxHP: number = 28;
    static hp: number = 28;
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
        let sheet = this.sheet ?? copSheet;
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
