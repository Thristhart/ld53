import { Action } from "./action";
import { Actor } from "./actor";

export abstract class Player implements Actor {
    static actions: Action[] = [];
    actions: Action[];
    hp = 50;
    constructor(level: number) {
        this.actions = (this.constructor as typeof Player).actions.slice(0, level);
    }

    draw(context: CanvasRenderingContext2D, x: number, y: number) {}
}
