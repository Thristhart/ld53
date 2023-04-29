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
import { createEnemy, currentCombat, getActorAtLocation, performNPCAction, spawnEnemy } from "../combat";

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
        damagePlayer(this, targets[0], 5);
    },
} as const;

const screech = {
    id: "screech",
    name: "Screech",
    description: "Rat screeches for backup",
    targetType: "grid",
    targeting: emptyCardinalSquares,
    async apply(this: Actor, targets: GridLocation[]) {
        targets.forEach(([x, y]) => {
            spawnEnemy({ type: "rat", x, y });
        });
    },
} as const;

export class Rat extends BaseEnemy {
    actions = [gnaw, screech] as const;
    displayName: string = "Rat";
    draw(context: CanvasRenderingContext2D) {
        drawSprite(
            context,
            ratSheet,
            this.x * GRID_SQUARE_WIDTH + GRID_SQUARE_WIDTH / 2,
            this.y * GRID_SQUARE_HEIGHT + GRID_SQUARE_HEIGHT / 2,
            [0, 0]
        );
        super.draw(context);
    }
    async doTurn(): Promise<void> {
        const action = randomFromArray(this.actions);
        if (action.id === "gnaw") {
            return performNPCAction(this, action, randomFromArray(currentCombat!.players));
        } else if (action.id === "screech") {
            const validCardinalSquares = cardinalSquares([this.x, this.y]).filter(
                (square) => !getActorAtLocation(square)
            );
            return performNPCAction(this, action, [this.x, this.y]);
        }
    }
}
