import { GridLocation } from "./action";
import { Player } from "./basePlayer";
import { currentCombat, getActorAtLocation } from "./combat";

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
export function verticalLineWithoutActors(target: GridLocation): GridLocation[] {
    if (!currentCombat) {
        return [];
    }
    const [x] = target;
    const targets: GridLocation[] = [];
    for (let y = 0; y < currentCombat.height; y++) {
        const spot: [number, number] = [x, y];
        if (!getActorAtLocation(spot)) {
            targets.push(spot);
        }
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

export function horizontalLineWithoutActors(target: GridLocation): GridLocation[] {
    if (!currentCombat) {
        return [];
    }
    const [_, y] = target;
    const targets: GridLocation[] = [];
    for (let x = 0; x < currentCombat.width; x++) {
        const spot: [number, number] = [x, y];
        if (!getActorAtLocation(spot)) {
            targets.push(spot);
        }
    }
    return targets;
}

export function verticalLineWithLength(target: GridLocation, length: number): GridLocation[] {
    if (!currentCombat) {
        return [];
    }
    const [x, targetY] = target;
    const targets: GridLocation[] = [];
    const leftover = (length - 1) / 2;
    for (let y = Math.max(targetY - leftover, 0); y < Math.min(targetY + 1 + leftover, currentCombat.height); y++) {
        targets.push([x, y]);
    }
    return targets;
}

export function horizontalLineWithLength(target: GridLocation, length: number): GridLocation[] {
    if (!currentCombat) {
        return [];
    }
    const [targetX, y] = target;
    const targets: GridLocation[] = [];
    const leftover = (length - 1) / 2;
    for (let x = Math.max(targetX - leftover, 0); x < Math.min(targetX + 1 + leftover, currentCombat.width); x++) {
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

export function isOrthagonal(from: GridLocation, to: GridLocation): boolean {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    return !(dx && dy);
}
export function isDiagonal(from: GridLocation, to: GridLocation): boolean {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    return Math.abs(dx) === Math.abs(dy);
}

export function canMove(from: GridLocation, to: GridLocation): boolean {
    if (getActorAtLocation(to)) {
        return false;
    }
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const distance = Math.sqrt(dx * dx + dy * dy);
    const unit = [dx / distance, dy / distance];
    let considering: GridLocation = [Math.round(from[0] + unit[0]), Math.round(from[1] + unit[1])];
    while (considering[0] !== to[0] || considering[1] !== to[1]) {
        if (getActorAtLocation(considering)) {
            return false;
        }
        considering = [Math.round(considering[0] + unit[0]), Math.round(considering[1] + unit[1])];
    }
    return true;
}

export function singlePlayer(target: Player): [Player] {
    return [target];
}
export function singleGridLocation(target: GridLocation): [GridLocation] {
    return [target];
}

export function singleGridLocationWithEnemy(target: GridLocation): GridLocation[] {
    if (getActorAtLocation(target)) {
        return [target];
    }
    return [];
}

export function allPlayers(target: Player): Player[] {
    return currentCombat?.players ?? [];
}

export function fullGrid(target: GridLocation): GridLocation[] {
    if (!currentCombat) {
        return [];
    }
    const targets: GridLocation[] = [];
    for (let x = 0; x < currentCombat.width; x++) {
        for (let y = 0; y < currentCombat.height; y++) {
            targets.push([x, y]);
        }
    }
    return targets;
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

export function diagonalSquares(target: GridLocation): GridLocation[] {
    if (!currentCombat) {
        return [];
    }

    const cardinals: GridLocation[] = [];
    const [x, y] = target;

    const touchingTopBorder = y <= 0;
    const touchingLeftBorder = x <= 0;
    const touchingBottomBorder = y >= currentCombat.height - 1;
    const touchingRightBorder = x >= currentCombat.width - 1;

    if (!touchingLeftBorder && !touchingTopBorder) {
        cardinals.push([x - 1, y - 1]);
    }
    if (!touchingRightBorder && !touchingTopBorder) {
        cardinals.push([x + 1, y - 1]);
    }
    if (!touchingRightBorder && !touchingBottomBorder) {
        cardinals.push([x + 1, y + 1]);
    }
    if (!touchingLeftBorder && !touchingBottomBorder) {
        cardinals.push([x - 1, y + 1]);
    }
    
    return cardinals;
}

export function emptyCardinalSquares(target: GridLocation): GridLocation[] {
    const cardinals = cardinalSquares(target).filter((square) => !getActorAtLocation(square));
    return cardinals;
}
