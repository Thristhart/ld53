import { SpriteSheet, drawSprite } from "../drawSprite";
import { loadImage } from "../loadImage";
import ratSheetPath from "~/assets/rat-Sheet.png";
import { BaseEnemy } from "./baseEnemy";
import { GRID_SQUARE_HEIGHT, GRID_SQUARE_WIDTH } from "../render";
import { Action } from "../action";

const ratSheet: SpriteSheet = {
    image: loadImage(ratSheetPath),
    spriteWidth: 42,
    spriteHeight: 22,
};

export class Rat extends BaseEnemy {
    actions: Action[] = [];
    draw(context: CanvasRenderingContext2D) {
        drawSprite(
            context,
            ratSheet,
            this.x * GRID_SQUARE_WIDTH + GRID_SQUARE_WIDTH / 2,
            this.y * GRID_SQUARE_HEIGHT + GRID_SQUARE_HEIGHT / 2,
            [0, 0]
        );
    }
}
