import { GridLocation } from "./action";
import { Player } from "./basePlayer";
import { currentCombat } from "./combat";

export function verticalLine(target: GridLocation): GridLocation[] {
    if (!currentCombat) {
        return [];
    }
    const [x] = target;
    const targets: GridLocation[] = [];
    for (let y = 0; y < currentCombat.height; y++) {
        targets.push([x, y]);
    }
    return targets;
}

export function horizontalLine(target: GridLocation): GridLocation[] {
    if (!currentCombat) {
        return [];
    }
    const [_, y] = target;
    const targets: GridLocation[] = [];
    for (let x = 0; x < currentCombat.width; x++) {
        targets.push([x, y]);
    }
    return targets;
}

export function square(target: GridLocation, size: number): GridLocation[] {
    if (!currentCombat) {
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

export function singlePlayer(target: Player): [Player] {
    return [target];
}
export function singleGridLocation(target: GridLocation): [GridLocation] {
    return [target];
}

export function cardinalSquares(target: GridLocation): GridLocation[] {
    if (!currentCombat) {
        return [];
    }

    const cardinals: GridLocation[] = [];
    const [x, y] = target;
    if (x > 0) {
        cardinals.push([x - 1, y]);
    }
    if (x < currentCombat.width - 1) {
        cardinals.push([x + 1, y]);
    }
    if (y > 0) {
        cardinals.push([x, y - 1]);
    }
    if (y < currentCombat.height - 1) {
        cardinals.push([x, y + 1]);
    }
    return cardinals;
}
