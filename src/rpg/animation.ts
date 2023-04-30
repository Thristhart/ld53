export interface PositionAnimation {
    startPos: readonly [x: number, y: number];
    currentPos: readonly [x: number, y: number];
    tick(time: number): void;
    duration: number;
}

export function makeLerpAnimation(
    startPos: readonly [x: number, y: number],
    endPos: readonly [x: number, y: number],
    duration: number,
    startTime: number = 0,
    onComplete?: () => void
): PositionAnimation {
    return {
        startPos,
        currentPos: startPos,
        duration,
        tick(time) {
            const dt = time - startTime;
            if (dt > 0) {
                this.currentPos = lerp(startPos, endPos, Math.min(dt / duration, 1));
            }
            if (dt >= duration) {
                onComplete?.();
            }
        },
    };
}

function lerp(a: readonly [x: number, y: number], b: readonly [x: number, y: number], frac: number) {
    const nx = a[0] + (b[0] - a[0]) * frac;
    const ny = a[1] + (b[1] - a[1]) * frac;
    return [nx, ny] as const;
}
