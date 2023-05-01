import clownSheetPath from "~/assets/clown_sheet.png";
import { randomFromArray } from "~/util/randomFromArray";
import { GridLocation } from "../action";
import { Actor } from "../actor";
import { animate } from "../animate";
import { FrameAnimation, makeFrameAnimation, makeLerpAnimation } from "../animation";
import { Player } from "../basePlayer";
import {
    combatTime,
    currentCombat,
    damageActor,
    getActorsAtLocation,
    hasActorActed,
    healActor,
    isActorAtLocation,
    lastNPCLog,
    performNPCAction,
    skipActorTurn,
} from "../combat";
import { SpriteSheet, drawSprite } from "../drawSprite";
import { loadImage } from "../loadImage";
import { GRID_SQUARE_HEIGHT, GRID_SQUARE_WIDTH, gridLocationToCenter } from "../render";
import {
    canMove,
    cardinalSquares,
    diagonalSquares,
    horizontalLineWithActors,
    isDiagonal,
    isOrthagonal,
    singleGridLocation,
    singlePlayer,
    square,
    verticalLineWithActors,
} from "../targetShapes";
import { BaseEnemy } from "./baseEnemy";

import laughSoundPath from "~/assets/audio/clown_honk_laugh.mp3";
import { Howl } from "howler";

const laughSound = new Howl({ src: laughSoundPath, volume: 0.05 });

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

function getLineupTargetsInDirection(clown: Clown, direction: "vertical" | "horizontal") {
    let clownSquares;
    if (direction === "vertical") {
        clownSquares = verticalLineWithActors([clown.x, clown.y]);
    } else {
        clownSquares = horizontalLineWithActors([clown.x, clown.y]);
    }
    return clownSquares.flatMap(getActorsAtLocation).filter((actor) => actor instanceof Clown && !hasActorActed(actor));
}

const lineUp = {
    id: "lineUp",
    name: "Line Up",
    description: "<NUMBER> clowns line up to put on a violent display to <TARGET>.",
    targetType: "player",
    targeting: singlePlayer,
    async apply(this: Actor, targets: Player[]) {
        const target = targets[0];
        const clown = this as Clown;

        const verticalAllies = getLineupTargetsInDirection(clown, "vertical");
        const horizontalAllies = getLineupTargetsInDirection(clown, "horizontal");

        const allies = verticalAllies.length >= horizontalAllies.length ? verticalAllies : horizontalAllies;

        allies.forEach(skipActorTurn);

        await Promise.all(
            allies.map((ally) => {
                const anim = makeFrameAnimation(
                    [
                        [0, 0],
                        [1, 0],
                        [0, 0],
                        [1, 0],
                        [0, 0],
                        [1, 0],
                        [0, 0],
                    ],
                    128
                );
                (ally as Clown).frameAnimation = anim;
                return animate(anim.tick, anim.frames.length * anim.timePerFrame);
            })
        );

        lastNPCLog.value = `${allies.length} clowns line up to put on a violent display to ${target.displayName}`;

        damageActor(clown, target, allies.length * allies.length);
    },
} as const;

const laughterIsTheBestMedicine = {
    id: "laughterIsTheBestMedicine",
    name: "Laughter Is The Best Medicine",
    description: "Clown tells his nearby friends a good joke. Humour really is healing.",
    targetType: "grid",
    targeting: singleGridLocation,
    async apply(this: Actor, targets: GridLocation[]) {
        laughSound.play();
        const centerpoint = targets[0];
        const mode = randomFromArray([LaughterDirection.Diagonal, LaughterDirection.Orthagonal]);
        const healTargets =
            mode === LaughterDirection.Orthagonal ? cardinalSquares(centerpoint) : diagonalSquares(centerpoint);
        lastNPCLog.value = "Clown tells his nearby friends a good joke. Humour really is healing.";
        healTargets.forEach((targetLocation) => {
            const targets = getActorsAtLocation(targetLocation);
            targets.forEach((target) => {
                healActor(this, target, 10);
            });
        });
    },
} as const;

export class Clown extends BaseEnemy {
    actions = [circusAct, lineUp, laughterIsTheBestMedicine] as const;
    displayName: string = "Clown";
    sheet: SpriteSheet | undefined;
    static maxHP: number = 55;
    static hp: number = 55;
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

        const healTargets = cardinalSquares(myLoc)
            .concat(diagonalSquares(myLoc))
            .filter((loc) => getActorsAtLocation(loc).some((actor) => actor instanceof Clown));

        const verticalAllies = getLineupTargetsInDirection(this, "vertical");
        const horizontalAllies = getLineupTargetsInDirection(this, "horizontal");
        if (verticalAllies.length >= 3 || horizontalAllies.length >= 3) {
            return performNPCAction(this, lineUp, randomFromArray(currentCombat!.players));
        }

        const validActions = this.actions.filter((action) => {
            if (action.id === "circusAct") {
                return validMovementSquares.length > 0;
            } else if (action.id === "lineUp") {
                return verticalAllies.length > 1 || horizontalAllies.length > 1;
            }
            if (action.id === "laughterIsTheBestMedicine") {
                return healTargets.length > 0;
            } else {
                return true;
            }
        });
        const action = randomFromArray(validActions);
        if (action?.id === "circusAct") {
            const target = randomFromArray(validMovementSquares);
            return performNPCAction(this, action, target);
        }
        if (action?.id === "laughterIsTheBestMedicine") {
            return performNPCAction(this, action, [this.x, this.y]);
        }
        if (action?.id === "lineUp") {
            return performNPCAction(this, action, randomFromArray(currentCombat!.players));
        }
    }
}
