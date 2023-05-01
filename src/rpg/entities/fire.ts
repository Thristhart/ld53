import fireSheetPath from "~/assets/fire.png";
import { BaseEntity } from "../baseEntity";
import { combatTime, currentCombat, damageEntity, getActorsAtLocation, lastNPCLog } from "../combat";
import { SpriteSheet, drawSprite } from "../drawSprite";
import { loadImage } from "../loadImage";
import { GRID_SQUARE_HEIGHT, GRID_SQUARE_WIDTH } from "../render";
import { Actor } from "../actor";

const fireSheet: SpriteSheet = {
    image: loadImage(fireSheetPath),
    spriteWidth: 64,
    spriteHeight: 64,
};

export class Fire extends BaseEntity implements Actor {
    hp = Infinity;
    maxHP = Infinity;
    displayName = "Fire";
    actions = [];
    lifetime = 3;
    turnDelay = 150;
    constructor(x: number, y: number) {
        super(x, y);
    }
    draw(context: CanvasRenderingContext2D) {
        let x = this.positionAnimation?.currentPos[0] ?? this.x * GRID_SQUARE_WIDTH + GRID_SQUARE_WIDTH / 2;
        let y = this.positionAnimation?.currentPos[1] ?? this.y * GRID_SQUARE_HEIGHT + GRID_SQUARE_HEIGHT / 2;
        drawSprite(context, fireSheet, x, y - 8, [Math.floor(combatTime.value / (1000 / 8)) % 4, 0]);
        super.draw(context);
    }
    async die() {
        currentCombat?.entities.splice(currentCombat?.entities.indexOf(this), 1);
    }
    async doTurn() {
        this.lifetime--;

        const sharingSpace = getActorsAtLocation([this.x, this.y]).filter((actor) => !(actor instanceof Fire));
        if (sharingSpace.length === 0) {
            lastNPCLog.value = `The fire crackles.`;
        } else {
            const victim = sharingSpace[0];
            lastNPCLog.value = `${victim.displayName} is burned!`;
            damageEntity(this, victim, 3);
        }
        if (this.lifetime <= 0) {
            this.die();
        }
    }
}
