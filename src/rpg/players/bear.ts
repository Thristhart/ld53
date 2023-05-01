import bearSheetPath from "~/assets/bear.png";
import { loadImage } from "../loadImage";
import { SpriteSheet, drawSprite } from "../drawSprite";
import { Player } from "../basePlayer";
import { FrameAnimation, PositionAnimation, makeLerpAnimation } from "../animation";
import { combatTime, currentCombat, damageEntity, getActorAtLocation } from "../combat";
import { drawCenteredText } from "../drawCenteredText";
import {
    PLAYER_DRAW_WIDTH,
    PLAYER_DRAW_HEIGHT,
    gridLocationToCenter,
    gridLocationToCanvas,
    GRID_SQUARE_HEIGHT,
    camera,
} from "../render";
import { drawBarrier } from "./drawBarrier";
import { Action, GridLocation } from "../action";
import { horizontalLine, singleGridLocationWithEnemy } from "../targetShapes";
import { Actor } from "../actor";
import { animate } from "../animate";
import { BaseEntity } from "../baseEntity";
import { emitBikeParticle } from "../particles/bike";

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
    targeting(target) {
        // Don't allow first square bc pulling there does nothing
        if (target[0] === 0) {
            return [];
        }
        return singleGridLocationWithEnemy(target);
    },
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

const throwBike: Action<GridLocation> = {
    id: "throwBike",
    name: "Throw Bike",
    description: "BEARNAME throws a bike across two rows, impacting the first two enemies hit.",
    targetType: "grid",
    targeting(target) {
        let rows = [target[1] - 1, target[1]];
        if (target[1] === 0) {
            rows = [0, 1];
        }
        return [...horizontalLine([0, rows[0]]), ...horizontalLine([0, rows[1]])];
    },
    async apply(targets, targetOption) {
        const bear = this as Bear;
        const victims = targets
            .map(getActorAtLocation)
            .filter((a) => a !== undefined)
            .sort((a, b) => {
                if (a.x < b.x) {
                    return -1;
                }
                if (a.x > b.x) {
                    return 1;
                }
                if (a.y < b.y) {
                    return -1;
                }
                if (a.y > b.y) {
                    return 1;
                }
                return 0;
            })
            .slice(0, 2);

        const start = gridLocationToCanvas(0, targets[0][1]);
        let endpoint = [currentCombat!.width, targets[0][1]];
        if (victims.length > 0) {
            endpoint[0] = victims[victims.length - 1].x;
        }
        const end = gridLocationToCanvas(endpoint[0], endpoint[1]);

        await new Promise<void>((resolve) => {
            let hasThrown = false;
            bear.positionAnimation = makeLerpAnimation(
                [bear.x, bear.y],
                [start[0], start[1] + GRID_SQUARE_HEIGHT * camera.scale],
                400,
                0,
                async () => {
                    if (!hasThrown) {
                        emitBikeParticle(
                            start[0],
                            start[1] + GRID_SQUARE_HEIGHT / 2,
                            end[0],
                            end[1] + GRID_SQUARE_HEIGHT / 2,
                            resolve
                        );
                        hasThrown = true;
                    }
                }
            );
            animate((dt) => {
                bear.positionAnimation?.tick(dt);
            }, 400);
        });
        bear.positionAnimation = undefined;
        for (const vic of victims) {
            damageEntity(this, vic, 10);
        }
    },
};

export class Bear extends Player {
    displayName: string = "Bear";
    static baseHP = 20;
    static hpPerLevel = 10;
    static actions = [suplex, throwBike];
    sheet: SpriteSheet | undefined;
    frameAnimation: FrameAnimation | undefined;
    positionAnimation: PositionAnimation | undefined;
    draw(context: CanvasRenderingContext2D, x: number, y: number): void {
        let frame: readonly [number, number];
        if (this.frameAnimation) {
            frame = this.frameAnimation.frames[this.frameAnimation.currentIndex];
        } else {
            frame = [0, 0];
        }
        let sheet = this.sheet ?? bearSheet;
        const spriteAspectRatio = sheet.spriteHeight / sheet.spriteWidth;
        let renderX = x;
        let renderY = y;
        if (this.positionAnimation) {
            renderX = this.positionAnimation.currentPos[0];
            renderY = this.positionAnimation.currentPos[1];
        }
        drawSprite(context, sheet, renderX, renderY, frame, {
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
