import { SpriteSheet, drawSprite } from "../drawSprite";
import { loadImage } from "../loadImage";
import ratSheetPath from "~/assets/rat-Sheet.png";
import { BaseEnemy } from "./baseEnemy";
import { GRID_SQUARE_HEIGHT, GRID_SQUARE_WIDTH } from "../render";
import { Action, GridLocation } from "../action";
import { cardinalSquares, emptyCardinalSquares, singleGridLocation, singlePlayer } from "../targetShapes";
import { randomFromArray } from "~/util/randomFromArray";
import { Player } from "../basePlayer";
import { damagePlayer } from "../actionUtil";
import { Actor } from "../actor";
import { createEnemy, currentCombat, getActorAtLocation, lastNPCLog, performNPCAction, spawnEnemy } from "../combat";
import { FrameAnimation, makeFrameAnimation } from "../animation";
import { animate } from "../animate";

const ratSheet: SpriteSheet = {
    image: loadImage(ratSheetPath),
    spriteWidth: 42,
    spriteHeight: 22,
};

const gnaw = {
    id: "gnaw",
    name: "Gnaw",
    description: "Rat gnaws at <TARGET>",
    targetType: "player",
    targeting: singlePlayer,
    async apply(this: Actor, targets: Player[]) {
        lastNPCLog.value = `Rat gnaws at ${targets[0].displayName}`;
        damagePlayer(this, targets[0], 1);
    },
    animation: {
        async animate(this: Actor, target: Player) {
            const rat = this as Rat;
            rat.frameAnimation = makeFrameAnimation(
                [
                    [0, 3],
                    [1, 3],
                ],
                66
            );
            await animate(rat.frameAnimation.tick, rat.frameAnimation.timePerFrame * rat.frameAnimation.frames.length);
            rat.frameAnimation = undefined;
        },
    },
} as const;

const screech = {
    id: "screech",
    name: "Screech",
    description: "Rat screeches for backup",
    targetType: "grid",
    targeting: emptyCardinalSquares,
    async apply(this: Actor, targets: GridLocation[]) {
        lastNPCLog.value = `Rat screeches for backup`;
        targets.forEach(([x, y]) => {
            spawnEnemy({ type: "rat", x, y });
        });
    },
    animation: {
        async animate(this: Actor, target: GridLocation) {
            const rat = this as Rat;
            rat.frameAnimation = makeFrameAnimation(
                [
                    [0, 0],
                    [0, 1],
                    [0, 2],
                ],
                66
            );
            await animate(rat.frameAnimation.tick, rat.frameAnimation.timePerFrame * rat.frameAnimation.frames.length);
            rat.frameAnimation = undefined;
        },
    },
} as const;

export class Rat extends BaseEnemy {
    static maxHP = 1;
    actions = [gnaw, screech] as const;
    displayName: string = "Rat";
    turnDelay = 200;
    frameAnimation: FrameAnimation | undefined;
    draw(context: CanvasRenderingContext2D) {
        let x = this.positionAnimation?.currentPos[0] ?? this.x * GRID_SQUARE_WIDTH + GRID_SQUARE_WIDTH / 2;
        let y = this.positionAnimation?.currentPos[1] ?? this.y * GRID_SQUARE_HEIGHT + GRID_SQUARE_HEIGHT / 2;
        drawSprite(context, ratSheet, x, y, this.frameAnimation?.frames[this.frameAnimation.currentIndex] ?? [0, 0]);
        super.draw(context);
    }
    async doTurn(): Promise<void> {
        const myLoc: GridLocation = [this.x, this.y];
        const spawnSpaces = emptyCardinalSquares(myLoc);
        const validActions = this.actions.filter((action) => {
            if (action.id === "screech") {
                return spawnSpaces.length > 0;
            }
            else {
                return true;
            }
        });
        const action = randomFromArray(validActions);
        if (action.id === "gnaw") {
            return performNPCAction(this, action, randomFromArray(currentCombat!.players));
        } else if (action.id === "screech") {
            return performNPCAction(this, action, [this.x, this.y]);
        }
    }
}
