import { Action, GridLocation } from "../action";
import { Actor } from "../actor";
import { BaseEntity } from "../baseEntity";
import { Player } from "../basePlayer";
import { currentCombat } from "../combat";
import { GRID_SQUARE_HEIGHT, GRID_SQUARE_WIDTH } from "../render";

export class BaseEnemy<ActionTypes = Action<Player> | Action<GridLocation>>
    extends BaseEntity
    implements Actor<ActionTypes>
{
    maxHP = 50;
    hp = 50;
    actions: ReadonlyArray<ActionTypes> = [];
    displayName: string = "";
    draw(context: CanvasRenderingContext2D) {
        if (currentCombat?.currentTurn.value === this) {
            context.strokeStyle = "white";
            context.strokeRect(
                this.x * GRID_SQUARE_WIDTH,
                this.y * GRID_SQUARE_HEIGHT,
                GRID_SQUARE_WIDTH,
                GRID_SQUARE_HEIGHT
            );
        }
        const hpBarSize = (GRID_SQUARE_WIDTH * 3) / 4;
        context.fillStyle = "red";
        context.fillRect(
            this.x * GRID_SQUARE_WIDTH + GRID_SQUARE_WIDTH / 2 - hpBarSize / 2,
            this.y * GRID_SQUARE_HEIGHT + GRID_SQUARE_HEIGHT / 8,
            hpBarSize * (this.hp / this.maxHP),
            2
        );
    }
    async doTurn() {}

    async die() {}
}
