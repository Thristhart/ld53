import clownSheetPath from "~/assets/clown_sheet.png";
import { randomFromArray } from "~/util/randomFromArray";
import { damagePlayer } from "../actionUtil";
import { Actor, isActor } from "../actor";
import { FrameAnimation, PositionAnimation, makeFrameAnimation, makeLerpAnimation } from "../animation";
import { Player } from "../basePlayer";
import { combatTime, currentCombat, getActorAtLocation, healActor, lastNPCLog, performNPCAction } from "../combat";
import { SpriteSheet, drawSprite } from "../drawSprite";
import { loadImage } from "../loadImage";
import { GRID_SQUARE_HEIGHT, GRID_SQUARE_WIDTH, gridLocationToCanvas, gridLocationToCenter } from "../render";
import { cardinalSquares, diagonalSquares, emptyCardinalSquares, singleGridLocation, singlePlayer } from "../targetShapes";
import { BaseEnemy } from "./baseEnemy";
import { animate } from "../animate";
import { emitHandcuffParticle } from "../particles/handcuffs";
import { wait } from "~/util/wait";
import { GridLocation } from "../action";

const clownSheet: SpriteSheet = {
    image: loadImage(clownSheetPath),
    spriteWidth: 38,
    spriteHeight: 38,
};

enum LaughterDirection{
    Orthagonal = 0,
    Diagonal = 1
}

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
        const centerpoint = targets[0];
        const mode = randomFromArray([LaughterDirection.Diagonal, LaughterDirection.Orthagonal])
        const healTargets = (mode === LaughterDirection.Orthagonal) ?  cardinalSquares(centerpoint) : diagonalSquares(centerpoint);
        healTargets.forEach(targetLocation => {
            const target =  getActorAtLocation(targetLocation);
            if(target !== undefined)
            {
                healActor(this, target, 5);
            }
        });
    },
    animation: {
        async animate(this: Actor, target: GridLocation) {
            await wait(400);
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
        let action = randomFromArray(this.actions);
        if (action.id === "laughterIsTheBestMedicine") {
            return performNPCAction(this, action, [this.x, this.y]);
        }
    }
}
