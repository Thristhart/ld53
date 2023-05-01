import { Action, GridLocation } from "../action";
import { Actor } from "../actor";
import { PositionAnimation } from "../animation";
import { BaseEntity } from "../baseEntity";
import { Player } from "../basePlayer";
import { currentCombat } from "../combat";
import { GRID_SQUARE_HEIGHT, GRID_SQUARE_WIDTH } from "../render";

export class BaseEnemy<ActionTypes = Action<Player> | Action<GridLocation>>
    extends BaseEntity
    implements Actor<ActionTypes>
{
    static maxHP = 50;
    maxHP = 50;
    hp = 50;
    actions: ReadonlyArray<ActionTypes> = [];
    displayName: string = "";
    constructor(x: number, y: number) {
        super(x, y);
        const derivedEnemy = this.constructor as typeof BaseEnemy;
        this.hp = derivedEnemy.maxHP;
        this.maxHP = derivedEnemy.maxHP;
    }
    draw(context: CanvasRenderingContext2D) {
        let x = this.positionAnimation?.currentPos[0] ?? this.x * GRID_SQUARE_WIDTH + GRID_SQUARE_WIDTH / 2;
        let y = this.positionAnimation?.currentPos[1] ?? this.y * GRID_SQUARE_HEIGHT + GRID_SQUARE_HEIGHT / 2;

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
        context.fillRect(x - hpBarSize / 2, y - (GRID_SQUARE_HEIGHT * 3) / 8, hpBarSize * (this.hp / this.maxHP), 2);
    }
    async doTurn() {}

    async die() {
        currentCombat?.entities.splice(currentCombat?.entities.indexOf(this), 1);
    }
}
