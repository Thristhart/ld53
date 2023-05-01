import catSheetPath from "~/assets/cat_truck.png";
import { Action, GridLocation } from "../action";
import { damageEntitiesOnSquares } from "../actionUtil";
import { Player } from "../basePlayer";
import { drawCenteredText } from "../drawCenteredText";
import { SpriteSheet, drawSprite } from "../drawSprite";
import { loadImage } from "../loadImage";
import {
    GRID_SQUARE_HEIGHT,
    GRID_SQUARE_WIDTH,
    PLAYER_DRAW_HEIGHT,
    PLAYER_DRAW_WIDTH,
    camera,
    gridLocationToCanvas,
} from "../render";
import { horizontalLine, singleGridLocationWithEnemy, square, verticalLine } from "../targetShapes";
import { PositionAnimation, makeLerpAnimation } from "../animation";
import { currentCombat, getActorAtLocation } from "../combat";
import { mailStormParticles } from "../particles/mail";
import { animate } from "../animate";
import { wait } from "~/util/wait";
import { drawBarrier } from "./drawBarrier";
import { Box } from "../enemies/box";
import { emitExplosionParticle } from "../particles/explosion";

const catSheet: SpriteSheet = {
    image: loadImage(catSheetPath),
    spriteWidth: 96,
    spriteHeight: 47,
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
    animation: {
        async animate(_baseTarget: GridLocation, targetSquares: GridLocation[]) {
            const cassie = this as Cassie;
            const target = gridLocationToCanvas(targetSquares[0][0], targetSquares[0][1]);
            const left = [target[0], target[1] + (GRID_SQUARE_HEIGHT / 2) * camera.scale] as const;
            const right = [
                target[0] + GRID_SQUARE_WIDTH * (currentCombat!.width + 1) * camera.scale,
                target[1] + (GRID_SQUARE_HEIGHT / 2) * camera.scale,
            ] as const;
            cassie.positionAnimation = makeLerpAnimation([cassie.x, cassie.y], left, 400, 0, () => {
                cassie.positionAnimation = makeLerpAnimation(left, right, 800, 400, () => {
                    cassie.positionAnimation = undefined;
                });
            });
            return animate((dt) => {
                cassie.positionAnimation?.tick(dt);
            }, 1200);
        },
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
        damageEntitiesOnSquares(this, targetSquares, 3);
    },
    animation: {
        async animate(target: GridLocation) {
            mailStormParticles(target);
            await wait(800);
        },
    },
};

const sendOff: Action<GridLocation> = {
    id: "sendOff",
    name: "Send Off",
    description: "Cassie packages the target into a box for three turns.",
    targetType: "grid",
    targeting(targetSquare) {
        const actor = getActorAtLocation(targetSquare);
        if (actor && !(actor instanceof Box)) {
            return [targetSquare];
        }
        return [];
    },
    async apply(targetSquares) {
        const victim = getActorAtLocation(targetSquares[0]);
        const box = new Box(victim);

        currentCombat?.entities.splice(currentCombat?.entities.indexOf(victim), 1, box);
    },
};

const airMail: Action<GridLocation> = {
    id: "airMail",
    name: "Air Mail",
    description: "Cassie delivers a devestating blow to the back column.",
    targetType: "grid",
    targeting(targetSquare) {
        if (targetSquare[0] !== currentCombat!.width - 1) {
            return [];
        }
        return verticalLine(targetSquare);
    },
    async apply(targetSquares) {
        for (const square of targetSquares) {
            const canvasPos = gridLocationToCanvas(...square);
            emitExplosionParticle(
                canvasPos[0] + (GRID_SQUARE_WIDTH / 2) * camera.scale,
                canvasPos[1] + (GRID_SQUARE_HEIGHT / 2) * camera.scale
            );
            damageEntitiesOnSquares(this, [square], 10);
            await wait(120);
        }
    },
};

export class Cassie extends Player {
    displayName: string = "Cassie";
    static baseHP = 15;
    static hpPerLevel = 5;
    static actions = [runDown, mailStorm, airMail, sendOff];
    draw(context: CanvasRenderingContext2D, x: number, y: number, isTargeted: boolean): void {
        super.draw(context, x, y, isTargeted);
        const spriteAspectRatio = catSheet.spriteHeight / catSheet.spriteWidth;
        let renderX = x;
        let renderY = y;
        if (this.positionAnimation) {
            renderX = this.positionAnimation.currentPos[0];
            renderY = this.positionAnimation.currentPos[1];
        }
        drawSprite(context, catSheet, renderX, renderY, [0, 0], {
            width: PLAYER_DRAW_WIDTH,
            height: PLAYER_DRAW_HEIGHT * spriteAspectRatio,
        });
        context.font = "22px Montserrat";
        drawCenteredText(context, "CASSIE", renderX, renderY - PLAYER_DRAW_HEIGHT / 2 + 32, "black", "white");
        drawCenteredText(context, `HP: ${this.hp}`, renderX, renderY + 80, "black", "white");

        if (this.barrier) {
            drawBarrier(context, x + PLAYER_DRAW_WIDTH / 2, y - 64, this.barrier);
        }
    }
}
