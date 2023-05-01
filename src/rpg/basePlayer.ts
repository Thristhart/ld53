import { Action, GridLocation } from "./action";
import { Actor } from "./actor";
import { PositionAnimation } from "./animation";
import { currentCombat } from "./combat";
import { PLAYER_DRAW_HEIGHT, PLAYER_DRAW_WIDTH } from "./render";

export abstract class Player implements Actor {
    static actions: (Action<Player> | Action<GridLocation>)[] = [];
    actions: (Action<Player> | Action<GridLocation>)[];
    static baseHP = 50;
    static hpPerLevel = 0;
    hp = 50;
    maxHP = 50;
    barrier = 0;
    displayName: string = "";
    cooldowns: Map<Action<Player | GridLocation>, number> = new Map<Action<Player | GridLocation>, number>();
    x: number = 0;
    y: number = 0;
    onDamaged: ((attacker: Actor, damage: number) => Promise<boolean>) | undefined;
    positionAnimation: PositionAnimation | undefined;
    constructor(level: number) {
        const derivedPlayer = this.constructor as typeof Player;
        this.actions = derivedPlayer.actions.slice(0, level);
        this.maxHP = derivedPlayer.baseHP + derivedPlayer.hpPerLevel * level;
        this.hp = this.maxHP;
        this.actions.forEach((action) => {
            this.cooldowns.set(action as any, 0);
        });
    }

    draw(context: CanvasRenderingContext2D, x: number, y: number, isTargeted: boolean) {
        let renderX = x - PLAYER_DRAW_WIDTH / 2;
        let renderY = y;
        if (this.positionAnimation) {
            renderX = this.positionAnimation.currentPos[0] - PLAYER_DRAW_WIDTH / 2;
            renderY = this.positionAnimation.currentPos[1];
        }
        if (isTargeted) {
            context.fillStyle = "rgb(206 251 255 / 30%)";
            context.fillRect(renderX, renderY - PLAYER_DRAW_HEIGHT / 2, PLAYER_DRAW_WIDTH, PLAYER_DRAW_HEIGHT);
        }
        // maybe we don't need to highlight for current turn?
        // if (currentCombat?.currentTurn.value === this) {
        //     context.strokeStyle = "white";
        //     context.strokeRect(renderX, renderY - PLAYER_DRAW_HEIGHT / 2, PLAYER_DRAW_WIDTH, PLAYER_DRAW_HEIGHT);
        // }
    }
    getVisiblePosition(): [x: number, y: number] {
        if (this.positionAnimation) {
            return [this.positionAnimation.currentPos[0], this.positionAnimation.currentPos[1]];
        }
        return [this.x, this.y];
    }
    async doTurn() {}

    async die() {
        currentCombat?.players.splice(currentCombat?.players.indexOf(this), 1);
    }

    async decrementCooldown() {
        for (const [key, value] of this.cooldowns.entries()) {
            this.cooldowns.set(key, value > 0 ? value - 1 : value);
        }
    }
}
