import frogCroakSheetPath from "~/assets/frog_croak_strip7.png";
import frogSheetPath from "~/assets/frog_idle_strip4.png";
import { Action, GridLocation } from "../action";
import { damageEntitiesOnSquares } from "../actionUtil";
import { Actor } from "../actor";
import { animate } from "../animate";
import { FrameAnimation, PositionAnimation, makeFrameAnimation, makeLerpAnimation } from "../animation";
import { BaseEntity } from "../baseEntity";
import { Player } from "../basePlayer";
import { combatTime, currentCombat, damageEntity, getActorsAtLocation, isEnemyAtLocation } from "../combat";
import { drawCenteredText } from "../drawCenteredText";
import { SpriteSheet, drawSprite } from "../drawSprite";
import { loadImage } from "../loadImage";
import { GRID_SQUARE_HEIGHT, PLAYER_DRAW_HEIGHT, PLAYER_DRAW_WIDTH, gridLocationToCenter } from "../render";
import {
    allPlayers,
    fullGrid,
    horizontalLineWithLength,
    horizontalLineWithoutActors,
    verticalLineWithLength,
    verticalLineWithoutActors,
} from "../targetShapes";
import { drawBarrier } from "./drawBarrier";
import { Cone } from "../entities/cone";
import { Fire } from "../entities/fire";

const frogSheet: SpriteSheet = {
    image: loadImage(frogSheetPath),
    spriteWidth: 50,
    spriteHeight: 20,
};

const frogCroakSheet: SpriteSheet = {
    image: loadImage(frogCroakSheetPath),
    spriteWidth: 50,
    spriteHeight: 23,
};

const makeshiftWall: Action<Player> = {
    id: "makeshiftWall",
    name: "Makeshift Wall",
    description: "FROGNAME erects a barrier in front of all players, preventing 5 damage.",
    targetType: "player",
    targeting: allPlayers,
    async apply(targets) {
        for (const target of targets) {
            target.barrier = 5;
        }
    },
};

const clearTheSite: Action<GridLocation> = {
    id: "clearTheSite",
    name: "Clear the Site",
    description: "FROGNAME shouts, knocking enemies back two squares and dealing damage on impact.",
    targetType: "grid",
    targeting: fullGrid,
    async apply() {
        if (!currentCombat) {
            return;
        }

        for (let x = currentCombat.width - 1; x >= 0; x--) {
            const rowTargets: Array<BaseEntity & Actor> = [];
            for (let y = 0; y < currentCombat.height; y++) {
                const units = getActorsAtLocation([x, y]);
                for (const unit of units) {
                    if (!(unit instanceof Fire)) {
                        rowTargets.push(unit);
                    }
                }
            }
            const animations: PositionAnimation[] = [];
            for (const target of rowTargets) {
                let nextPosition: GridLocation = [target.x + 1, target.y];
                if (nextPosition[0] >= currentCombat.width || isEnemyAtLocation(nextPosition)) {
                    nextPosition = [target.x, target.y];
                } else {
                    nextPosition = [target.x + 2, target.y];
                    if (nextPosition[0] >= currentCombat.width || isEnemyAtLocation(nextPosition)) {
                        nextPosition = [target.x + 1, target.y];
                    }
                }

                const distance = nextPosition[0] - target.x;

                target.positionAnimation = makeLerpAnimation(
                    gridLocationToCenter([target.x, target.y]),
                    gridLocationToCenter(nextPosition),
                    distance * 150,
                    undefined,
                    () => {
                        if (distance < 2) {
                            damageEntity(this, target, 2 - distance);
                        }
                    }
                );
                animations.push(target.positionAnimation);

                target.x = nextPosition[0];
                target.y = nextPosition[1];
            }
            await Promise.all(animations.map((animation) => animate(animation.tick, animation.duration)));
        }
    },
    animation: {
        async animate(this: Actor, baseTarget: GridLocation) {
            const frog = this as Frog;
            frog.frameAnimation = makeFrameAnimation(
                [
                    [0, 0],
                    [1, 0],
                    [2, 0],
                    [3, 0],
                    [4, 0],
                    [5, 0],
                    [6, 0],
                ],
                75,
                undefined,
                () => {
                    frog.frameAnimation = undefined;
                    frog.sheet = undefined;
                }
            );
            frog.sheet = frogCroakSheet;
            animate((dt) => {
                frog.frameAnimation?.tick(dt);
            }, 525);
        },
    },
};

const steelBeams: Action<GridLocation> = {
    id: "steelBeams",
    name: "Steel Beams",
    description: "FROGNAME drops steel beams on the target, dealing damage.",
    targetType: "grid",
    targeting(target, targetOption) {
        if (targetOption === "Vertical") {
            return verticalLineWithLength(target, 3);
        } else if (targetOption === "Horizontal") {
            return horizontalLineWithLength(target, 3);
        }
        return [];
    },
    targetOptions: ["Vertical", "Horizontal"],
    async apply(targetSquares, targetOption) {
        damageEntitiesOnSquares(this, targetSquares, 12);
    },
    // TODO: animate steel beam
};

const cordonOff: Action<GridLocation> = {
    id: "cordonOff",
    name: "Cordon Off",
    description: "FROGNAME drops a line of cones, preventing movement.",
    targetType: "grid",
    targeting(target, targetOption) {
        if (targetOption === "Vertical") {
            return verticalLineWithoutActors(target);
        } else if (targetOption === "Horizontal") {
            return horizontalLineWithoutActors(target);
        }
        return [];
    },
    targetOptions: ["Vertical", "Horizontal"],
    async apply(targetSquares, targetOption) {
        await Promise.all(
            targetSquares.map((square) => {
                const cone = new Cone(square[0], square[1]);
                const above = gridLocationToCenter([square[0], square[1] - 2]);
                cone.positionAnimation = makeLerpAnimation(above, gridLocationToCenter(square), 300);
                currentCombat?.entities.push(cone);
                return animate(cone.positionAnimation.tick, cone.positionAnimation.duration);
            })
        );
    },
};

export class Frog extends Player {
    displayName: string = "Frog";
    static baseHP = 20;
    static hpPerLevel = 6;
    static actions = [steelBeams, makeshiftWall, clearTheSite, cordonOff];
    sheet: SpriteSheet | undefined;
    frameAnimation: FrameAnimation | undefined;
    draw(context: CanvasRenderingContext2D, x: number, y: number, isTargeted: boolean): void {
        super.draw(context, x, y, isTargeted);
        let frame: readonly [number, number];
        if (this.frameAnimation) {
            frame = this.frameAnimation.frames[this.frameAnimation.currentIndex];
        } else {
            if (currentCombat?.currentTurn.value === this) {
                frame = [Math.floor(combatTime.value / (1000 / 8)) % 4, 0];
            } else {
                frame = [0, 0];
            }
        }
        let sheet = this.sheet ?? frogSheet;
        const spriteAspectRatio = sheet.spriteHeight / sheet.spriteWidth;
        drawSprite(context, sheet, x + 20, y, frame, {
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
