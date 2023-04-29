import { Action } from "./action";

export interface Actor {
    actions: Action[];
    hp: number;
}

export function isActor(obj: object): obj is Actor {
    return "actions" in obj;
}
