import { Action, GridLocation } from "./action";
import { Player } from "./basePlayer";

export interface Actor<ActionTypes = Action<Player> | Action<GridLocation>> {
    actions: ReadonlyArray<ActionTypes>;
    hp: number;
    maxHP: number;
    displayName: string;
    doTurn?: () => Promise<void>;
    die: () => Promise<void>;
    turnDelay?: number;
}

export function isActor(obj: object): obj is Actor {
    return "actions" in obj;
}
