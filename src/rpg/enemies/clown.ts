import clownSheetPath from "~/assets/clown_sheet.png";
import { randomFromArray } from "~/util/randomFromArray";
import { wait } from "~/util/wait";
import { GridLocation } from "../action";
import { Actor } from "../actor";
import { animate } from "../animate";
import { FrameAnimation, makeLerpAnimation } from "../animation";
import { Player } from "../basePlayer";
import { combatTime, currentCombat, getActorAtLocation, healActor, lastNPCLog, performNPCAction } from "../combat";
import { SpriteSheet, drawSprite } from "../drawSprite";
import { loadImage } from "../loadImage";
import { GRID_SQUARE_HEIGHT, GRID_SQUARE_WIDTH, gridLocationToCenter } from "../render";
import {
    canMove,
    cardinalSquares,
    diagonalSquares,
    isDiagonal,
    isOrthagonal,
    singleGridLocation,
    singlePlayer,
    square,
} from "../targetShapes";
import { BaseEnemy } from "./baseEnemy";

const clownSheet: SpriteSheet = {
    image: loadImage(clownSheetPath),
    spriteWidth: 38,
    spriteHeight: 38,
};

enum LaughterDirection {
    Orthagonal = 0,
    Diagonal = 1,
}

const circusAct = {
    id: "circusAct",
    name: "Circus Act",
    description: "Clown does a funny walk",
    targetType: "grid",
    targeting: singleGridLocation,
    async apply(this: Actor, targets: GridLocation[]) {
        const clown = this as Clown;

        const target: GridLocation = targets[0];
        const dx = target[0] - clown.x;
        const dy = target[1] - clown.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        clown.positionAnimation = makeLerpAnimation(
            gridLocationToCenter([clown.x, clown.y]),
            gridLocationToCenter(target),
            distance * 150,
            undefined,
            () => {
                clown.positionAnimation = undefined;
            }
        );
        lastNPCLog.value = "Clown does a funny walk";
        await animate(clown.positionAnimation.tick, clown.positionAnimation.duration);

        clown.x = target[0];
        clown.y = target[1];
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
        const mode = randomFromArray([LaughterDirection.Diagonal, LaughterDirection.Orthagonal]);
        const healTargets =
            mode === LaughterDirection.Orthagonal ? cardinalSquares(centerpoint) : diagonalSquares(centerpoint);
        lastNPCLog.value = "Clown tells his nearby friends a good joke. Humour really is healing.";
        healTargets.forEach((targetLocation) => {
            const target = getActorAtLocation(targetLocation);
            if (target !== undefined) {
                healActor(this, target, 5);
            }
        });
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
        const myLoc: GridLocation = [this.x, this.y];
        const validMovementSquares = square(myLoc, 2).filter(
            (loc) => (isOrthagonal(myLoc, loc) || isDiagonal(myLoc, loc)) && canMove(myLoc, loc)
        );

        const validActions = this.actions.filter((action) => {
            if (action.id === "circusAct") {
                return validMovementSquares.length > 0;
            }
            if (action.id === "laughterIsTheBestMedicine") {
                return true;
            }
            return false;
        });
        const action = randomFromArray(validActions);
        if (action.id === "circusAct") {
            const target = randomFromArray(validMovementSquares);
            return performNPCAction(this, action, target);
        }
        if (action.id === "laughterIsTheBestMedicine") {
            return performNPCAction(this, action, [this.x, this.y]);
        }
    }
}
