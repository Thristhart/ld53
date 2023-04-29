import { GridLocation } from "./action";
import { Player } from "./basePlayer";
import { currentCombat } from "./combat";

export function verticalLine(target: Player | GridLocation): GridLocation[] {
    if (target instanceof Player || !currentCombat) {
        return [];
    }
    const [x] = target;
    const targets: GridLocation[] = [];
    for (let y = 0; y < currentCombat.height; y++) {
        targets.push([x, y]);
    }
    return targets;
}

export function square(target: Player | GridLocation, size: number): GridLocation[] {
    if (target instanceof Player || !currentCombat) {
        return [];
    }
    const [x, y] = target;
    const targets: GridLocation[] = [];
    for (let newX = Math.max(x - size, 0); newX <= Math.min(x + size, currentCombat.width - 1); newX++) {
        for (let newY = Math.max(y - size, 0); newY <= Math.min(y + size, currentCombat.height - 1); newY++) {
            targets.push([newX, newY]);
        }
    }
    return targets;
}
