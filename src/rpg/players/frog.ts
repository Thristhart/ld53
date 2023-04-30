import frogSheetPath from "~/assets/frog_idle_strip4.png";
import { loadImage } from "../loadImage";
import { SpriteSheet, drawSprite } from "../drawSprite";
import { Player } from "../basePlayer";
import { drawCenteredText } from "../drawCenteredText";
import { PLAYER_DRAW_WIDTH, PLAYER_DRAW_HEIGHT } from "../render";
import { combatTime, currentCombat } from "../combat";

const frogSheet: SpriteSheet = {
    image: loadImage(frogSheetPath),
    spriteWidth: 50,
    spriteHeight: 20,
};

export class Frog extends Player {
    displayName: string = "Frog";
    static baseHP = 15;
    static hpPerLevel = 5;
    static actions = [];
    draw(context: CanvasRenderingContext2D, x: number, y: number): void {
        let frame = 0;
        if (currentCombat?.currentTurn.value === this) {
            frame = Math.floor(combatTime.value / (1000 / 8)) % 4;
        }
        const spriteAspectRatio = frogSheet.spriteHeight / frogSheet.spriteWidth;
        drawSprite(context, frogSheet, x + 20, y, [frame, 0], {
            width: PLAYER_DRAW_WIDTH,
            height: PLAYER_DRAW_HEIGHT * spriteAspectRatio,
        });
        context.font = "22px Montserrat";
        drawCenteredText(context, "FROG", x, y - PLAYER_DRAW_HEIGHT / 2 + 32, "black", "white");
        drawCenteredText(context, `HP: ${this.hp}`, x, y + 80, "black", "white");
    }
}
