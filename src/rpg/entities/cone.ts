import coneSheetPath from "~/assets/cone.png";
import { BaseEntity } from "../baseEntity";
import { currentCombat } from "../combat";
import { SpriteSheet, drawSprite } from "../drawSprite";
import { loadImage } from "../loadImage";
import { GRID_SQUARE_HEIGHT, GRID_SQUARE_WIDTH } from "../render";
import { Actor } from "../actor";

const coneSheet: SpriteSheet = {
    image: loadImage(coneSheetPath),
    spriteWidth: 32,
    spriteHeight: 32,
};

export class Cone extends BaseEntity implements Actor {
    hp = 1;
    maxHP = 1;
    displayName = "Cone";
    actions = [];
    lifetime = 3;
    constructor(x: number, y: number) {
        super(x, y);
    }
    draw(context: CanvasRenderingContext2D) {
        let x = this.positionAnimation?.currentPos[0] ?? this.x * GRID_SQUARE_WIDTH + GRID_SQUARE_WIDTH / 2;
        let y = this.positionAnimation?.currentPos[1] ?? this.y * GRID_SQUARE_HEIGHT + GRID_SQUARE_HEIGHT / 2;
        drawSprite(context, coneSheet, x, y - 8, [0, 0]);
        super.draw(context);
    }
    async die() {
        currentCombat?.entities.splice(currentCombat?.entities.indexOf(this), 1);
    }
}
