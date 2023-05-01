import { GridLocation } from "./action";
import { Actor } from "./actor";
import { Player } from "./basePlayer";
import { damageActor, damageEntity, getActorsAtLocation } from "./combat";

export function damageEntitiesOnSquares(from: Actor, squares: GridLocation[], damage: number) {
    squares.forEach((square) => {
        const targets = getActorsAtLocation(square);
        if (!targets) {
            return;
        }
        targets.forEach((target) => {
            damageEntity(from, target, damage);
        });
    });
}
export function damagePlayer(from: Actor, target: Player, damage: number) {
    return damageActor(from, target, damage);
}
