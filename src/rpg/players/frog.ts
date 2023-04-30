import frogSheetPath from "~/assets/frog_idle_strip4.png";
import { loadImage } from "../loadImage";
import { SpriteSheet, drawSprite } from "../drawSprite";
import { Player } from "../basePlayer";
import { drawCenteredText } from "../drawCenteredText";
import { PLAYER_DRAW_WIDTH, PLAYER_DRAW_HEIGHT } from "../render";
import { combatTime, currentCombat } from "../combat";
import { Action } from "../action";
import { singlePlayer } from "../targetShapes";
import { drawBarrier } from "./drawBarrier";

const frogSheet: SpriteSheet = {
    image: loadImage(frogSheetPath),
    spriteWidth: 50,
    spriteHeight: 20,
};

const makeshiftWall: Action<Player> = {
    id: "makeshiftWall",
    name: "Makeshift Wall",
    description: "FROGNAME erects a barrier in front of the target player, preventing 5 damage.",
    targetType: "player",
    targeting: singlePlayer,
    async apply(targets) {
        targets[0].barrier = 5;
    },
    animation: {
        async animate(baseTarget: Player) {},
    },
};

export class Frog extends Player {
    displayName: string = "Frog";
    static baseHP = 15;
    static hpPerLevel = 5;
    static actions = [makeshiftWall];
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

        if (this.barrier) {
            drawBarrier(context, x + PLAYER_DRAW_WIDTH / 4, y - 64, this.barrier);
        }
    }
}
