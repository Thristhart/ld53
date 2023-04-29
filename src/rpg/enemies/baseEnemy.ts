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
    }
    async doTurn() {}

    async die() {}
}
