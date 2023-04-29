import { Action } from "../action";
import { Actor } from "../actor";
import { BaseEntity } from "../baseEntity";
import { currentCombat } from "../combat";
import { GRID_SQUARE_HEIGHT, GRID_SQUARE_WIDTH } from "../render";

export class BaseEnemy extends BaseEntity implements Actor {
    hp = 50;
    actions: Action[] = [];
    draw(context: CanvasRenderingContext2D) {
        if (currentCombat?.currentTurn === this) {
            context.strokeStyle = "white";
            context.strokeRect(
                this.x * GRID_SQUARE_WIDTH,
                this.y * GRID_SQUARE_HEIGHT,
                GRID_SQUARE_WIDTH,
                GRID_SQUARE_HEIGHT
            );
        }
    }
}
