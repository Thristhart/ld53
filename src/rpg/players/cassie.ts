import { Action, GridLocation } from "../action";
import { Player } from "../basePlayer";
import { SpriteSheet, drawSprite } from "../drawSprite";
import { loadImage } from "../loadImage";
import catSheetPath from "~/assets/cat_idle_blink_strip8.png";
import { PLAYER_DRAW_HEIGHT, PLAYER_DRAW_WIDTH } from "../render";
import { drawCenteredText } from "../drawCenteredText";
import { horizontalLine, square } from "../targetShapes";
import { damageEntity, getActorAtLocation } from "../combat";
import { damageEntitiesOnSquares } from "../actionUtil";

const catSheet: SpriteSheet = {
    image: loadImage(catSheetPath),
    spriteWidth: 40,
    spriteHeight: 40,
};

const runDown: Action<GridLocation> = {
    id: "runDown",
    name: "Run Down",
    description: "Cassie drives the truck in a horizontal line, damaging enemies.",
    targetType: "grid",
    targeting: horizontalLine,
    async apply(targetSquares) {
        damageEntitiesOnSquares(this, targetSquares, 5);
    },
};

const mailStorm: Action<GridLocation> = {
    id: "mailStorm",
    name: "Mail Storm",
    description: "Cassie scatters mail in a 3x3 area, causing papercuts.",
    targetType: "grid",
    targeting(target) {
        return square(target, 1);
    },
    async apply(targetSquares) {
        damageEntitiesOnSquares(this, targetSquares, 5);
    },
};

export class Cassie extends Player {
    displayName: string = "Cassie";
    static actions = [runDown, mailStorm, runDown, mailStorm];
    draw(context: CanvasRenderingContext2D, x: number, y: number): void {
        drawSprite(context, catSheet, x, y, [0, 0], {
            width: PLAYER_DRAW_WIDTH,
            height: PLAYER_DRAW_HEIGHT,
        });
        context.font = "22px Montserrat";
        drawCenteredText(context, "CASSIE", x, y - 16, "black", "white");
        drawCenteredText(context, `HP: ${this.hp}`, x, y + 80, "black", "white");
    }
}
