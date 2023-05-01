import bearSheetPath from "~/assets/bear.png";
import { loadImage } from "../loadImage";
import { SpriteSheet, drawSprite } from "../drawSprite";
import { Player } from "../basePlayer";
import { FrameAnimation, makeLerpAnimation } from "../animation";
import { combatTime, currentCombat, damageEntity, getActorAtLocation } from "../combat";
import { drawCenteredText } from "../drawCenteredText";
import { PLAYER_DRAW_WIDTH, PLAYER_DRAW_HEIGHT, gridLocationToCenter } from "../render";
import { drawBarrier } from "./drawBarrier";
import { Action, GridLocation } from "../action";
import { singleGridLocationWithEnemy } from "../targetShapes";
import { Actor } from "../actor";
import { animate } from "../animate";
import { BaseEntity } from "../baseEntity";

const bearSheet: SpriteSheet = {
    image: loadImage(bearSheetPath),
    spriteWidth: 38,
    spriteHeight: 38,
};

const suplex: Action<GridLocation> = {
    id: "suplex",
    name: "Suplex",
    description:
        "BEARNAME suplexes the target, pulling them forward a square. If they hit another enemy, both will take damage.",
    targetType: "grid",
    targeting: singleGridLocationWithEnemy,
    async apply(targets) {
        const bear = this as Bear;

        const targetLoc = targets[0];
        const target = getActorAtLocation(targetLoc)!;
        let nextPosition: GridLocation = [targetLoc[0] - 1, targetLoc[1]];
        let actorAlreadyAtSquare: (Actor & BaseEntity) | undefined;

        if (nextPosition[0] < 0) {
            nextPosition[0] = 0;
        } else {
            actorAlreadyAtSquare = getActorAtLocation(nextPosition);
            if (actorAlreadyAtSquare) {
                nextPosition = targetLoc;
            }
        }

        if (nextPosition[0] !== targetLoc[0]) {
            target.positionAnimation = makeLerpAnimation(
                gridLocationToCenter([target.x, target.y]),
                gridLocationToCenter(nextPosition),
                200,
                undefined,
                () => {
                    target.positionAnimation = undefined;
                }
            );
            target.x = nextPosition[0];
            target.y = nextPosition[1];

            await animate(target.positionAnimation.tick, target.positionAnimation.duration);
        }

        if (actorAlreadyAtSquare) {
            damageEntity(bear, target, 7);
            damageEntity(bear, actorAlreadyAtSquare, 7);
        }
    },
};

export class Bear extends Player {
    displayName: string = "Bear";
    static baseHP = 20;
    static hpPerLevel = 10;
    static actions = [suplex];
    sheet: SpriteSheet | undefined;
    frameAnimation: FrameAnimation | undefined;
    draw(context: CanvasRenderingContext2D, x: number, y: number): void {
        let frame: readonly [number, number];
        if (this.frameAnimation) {
            frame = this.frameAnimation.frames[this.frameAnimation.currentIndex];
        } else {
            frame = [0, 0];
        }
        let sheet = this.sheet ?? bearSheet;
        const spriteAspectRatio = sheet.spriteHeight / sheet.spriteWidth;
        drawSprite(context, sheet, x, y, frame, {
            width: PLAYER_DRAW_WIDTH,
            height: PLAYER_DRAW_HEIGHT * spriteAspectRatio,
        });
        context.font = "22px Montserrat";
        drawCenteredText(context, "BEAR", x, y - PLAYER_DRAW_HEIGHT / 2 + 32, "black", "white");
        drawCenteredText(context, `HP: ${this.hp}`, x, y + 80, "black", "white");

        if (this.barrier) {
            drawBarrier(context, x + PLAYER_DRAW_WIDTH / 2, y - 64, this.barrier);
        }
    }
}
