import { Action } from "../action";
import { Actor } from "../actor";
import { BaseEntity } from "../baseEntity";

export class BaseEnemy extends BaseEntity implements Actor {
    hp = 50;
    actions: Action[] = [];
}
