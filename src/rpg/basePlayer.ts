import { Action, GridLocation } from "./action";
import { Actor } from "./actor";
import { currentCombat } from "./combat";

export abstract class Player implements Actor {
    static actions: (Action<Player> | Action<GridLocation>)[] = [];
    actions: (Action<Player> | Action<GridLocation>)[];
    static baseHP = 50;
    static hpPerLevel = 0;
    hp = 50;
    maxHP = 50;
    barrier = 0;
    displayName: string = "";
    x: number = 0;
    y: number = 0;
    constructor(level: number) {
        const derivedPlayer = this.constructor as typeof Player;
        this.actions = derivedPlayer.actions.slice(0, level);
        this.maxHP = derivedPlayer.baseHP + derivedPlayer.hpPerLevel * level;
        this.hp = this.maxHP;
    }

    draw(context: CanvasRenderingContext2D, x: number, y: number) {}
    async doTurn() {}

    async die() {
        currentCombat?.players.splice(currentCombat?.players.indexOf(this), 1);
    }
}
