import { Action, GridLocation } from "./action";
import { Actor } from "./actor";
import { currentCombat } from "./combat";

export abstract class Player implements Actor {
    static actions: (Action<Player> | Action<GridLocation>)[] = [];
    actions: (Action<Player> | Action<GridLocation>)[];
    hp = 50;
    maxHp = 50;
    displayName: string = "";
    constructor(level: number) {
        this.actions = (this.constructor as typeof Player).actions.slice(0, level);
    }

    draw(context: CanvasRenderingContext2D, x: number, y: number) {}
    async doTurn() {}
    
    async die(){
        currentCombat?.players.splice(currentCombat?.players.indexOf(this), 1);
    }
}
