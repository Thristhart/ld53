import { SpriteSheet, drawSprite } from "../drawSprite";
import { loadImage } from "../loadImage";
import copSheetPath from "~/assets/rat-Sheet.png";
import { BaseEnemy } from "./baseEnemy";
import { GRID_SQUARE_HEIGHT, GRID_SQUARE_WIDTH } from "../render";
import { Action, GridLocation } from "../action";
import { cardinalSquares, emptyCardinalSquares, singleGridLocation, singlePlayer } from "../targetShapes";
import { randomFromArray } from "~/util/randomFromArray";
import { Player } from "../basePlayer";
import { damagePlayer } from "../actionUtil";
import { Actor } from "../actor";
import { createEnemy, currentCombat, getActorAtLocation, lastNPCLog, performNPCAction, spawnEnemy } from "../combat";
import { FrameAnimation, makeFrameAnimation } from "../animation";
import { animate } from "../animate";

const copSheet: SpriteSheet = {
    image: loadImage(copSheetPath),
    spriteWidth: 42,
    spriteHeight: 22,
};

const shoot = {
    id: "shoot",
    name: "Shoot",
    description: "Cop shoots at <TARGET>",
    targetType: "player",
    targeting: singlePlayer,
    async apply(this: Actor, targets: Player[]) {
        const cop = this as Cop;
        lastNPCLog.value = `Cop shoots at ${targets[0].displayName}`;
        damagePlayer(this, targets[0], 10-cop.x);
    },
    animation: {
        async animate(this: Actor, target: Player) {
        //     const rat = this as Rat;
        //     rat.frameAnimation = makeFrameAnimation(
        //         [
        //             [0, 3],
        //             [1, 3],
        //         ],
        //         66
        //     );
        //     await animate(rat.frameAnimation.tick, rat.frameAnimation.timePerFrame * rat.frameAnimation.frames.length);
        //     rat.frameAnimation = undefined;
        },
    },
} as const;

const handcuff = {
    id: "handcuff",
    name: "Handcuff",
    description: "Cop locks down <TARGET>",
    targetType: "player",
    targeting: singlePlayer,
    async apply(this: Actor, targets: Player[]) {
        
        let targetAbility = randomFromArray(targets[0].actions);
        lastNPCLog.value = `Cop locks down ${targets[0].displayName}, preventing them from using ${targetAbility.name}`;
        targets[0].cooldowns.set(targetAbility as any, 2);
    },
    animation: {
        async animate(this: Actor, target: Player) {
        //     const rat = this as Rat;
        //     rat.frameAnimation = makeFrameAnimation(
        //         [
        //             [0, 3],
        //             [1, 3],
        //         ],
        //         66
        //     );
        //     await animate(rat.frameAnimation.tick, rat.frameAnimation.timePerFrame * rat.frameAnimation.frames.length);
        //     rat.frameAnimation = undefined;
        },
    },
} as const;

export class Cop extends BaseEnemy {
    actions = [shoot, handcuff] as const;
    displayName: string = "Rat";
    frameAnimation: FrameAnimation | undefined;
    draw(context: CanvasRenderingContext2D) {
        drawSprite(
            context,
            copSheet,
            this.x * GRID_SQUARE_WIDTH + GRID_SQUARE_WIDTH / 2,
            this.y * GRID_SQUARE_HEIGHT + GRID_SQUARE_HEIGHT / 2,
            this.frameAnimation?.frames[this.frameAnimation.currentIndex] ?? [0, 0]
        );
        super.draw(context);
    }
    async doTurn(): Promise<void> {
        const action = randomFromArray(this.actions);
        if (action.id === "shoot") {
            return performNPCAction(this, action, randomFromArray(currentCombat!.players));
        }
    }

}
