import boxSheetPath from "~/assets/Box.png";
import { BaseEntity } from "../baseEntity";
import { SpriteSheet, drawSprite } from "../drawSprite";
import { loadImage } from "../loadImage";
import { GRID_SQUARE_WIDTH, GRID_SQUARE_HEIGHT } from "../render";
import { Actor } from "../actor";
import { currentCombat, lastNPCLog } from "../combat";
import { BaseEnemy } from "./baseEnemy";

const boxSheet: SpriteSheet = {
    image: loadImage(boxSheetPath),
    spriteWidth: 32,
    spriteHeight: 32,
};

export class Box extends BaseEnemy {
    hp = 1;
    maxHP = 1;
    displayName = "Box";
    actions = [];
    lifetime = 3;
    constructor(public contents: BaseEntity & Actor) {
        super(contents.x, contents.y);
    }
    draw(context: CanvasRenderingContext2D) {
        let x = this.positionAnimation?.currentPos[0] ?? this.x * GRID_SQUARE_WIDTH + GRID_SQUARE_WIDTH / 2;
        let y = this.positionAnimation?.currentPos[1] ?? this.y * GRID_SQUARE_HEIGHT + GRID_SQUARE_HEIGHT / 2;
        drawSprite(context, boxSheet, x, y, [0, 0]);
        super.draw(context);
    }
    async die() {
        this.contents.x = this.x;
        this.contents.y = this.y;
        lastNPCLog.value = `The ${this.contents.displayName} is released from the box`;
        currentCombat?.entities.splice(currentCombat?.entities.indexOf(this), 1, this.contents);
    }
    async doTurn() {
        this.lifetime--;
        lastNPCLog.value = `The ${this.contents.displayName} is boxed up for another ${
            this.lifetime === 1 ? `${this.lifetime} turn` : `${this.lifetime} turns`
        }`;
        if (this.lifetime <= 0) {
            this.die();
        }
    }
}
