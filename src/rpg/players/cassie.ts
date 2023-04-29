import { Action } from "../action";
import { Player } from "../basePlayer";
import { SpriteSheet, drawSprite } from "../drawSprite";
import { loadImage } from "../loadImage";
import catSheetPath from "~/assets/cat_idle_blink_strip8.png";
import { PLAYER_DRAW_HEIGHT, PLAYER_DRAW_WIDTH } from "../render";
import { drawCenteredText } from "../drawCenteredText";

const catSheet: SpriteSheet = {
    image: loadImage(catSheetPath),
    spriteWidth: 40,
    spriteHeight: 40,
};

export class Cassie extends Player {
    static actions: Action[] = [];
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
