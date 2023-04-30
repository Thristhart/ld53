export interface PositionAnimation {
    startPos: readonly [x: number, y: number];
    currentPos: readonly [x: number, y: number];
    tick(time: number): void;
    duration: number;
}

export interface FrameAnimation {
    frames: ReadonlyArray<readonly [x: number, y: number]>;
    currentIndex: number;
    tick(time: number): void;
    timePerFrame: number;
    startTime: number;
}

export function makeLerpAnimation(
    startPos: readonly [x: number, y: number],
    endPos: readonly [x: number, y: number],
    duration: number,
    startTime: number = 0,
    onComplete?: () => void
): PositionAnimation {
    const animation = {
        startPos,
        currentPos: startPos,
        duration,
        tick(time: number) {
            const dt = time - startTime;
            if (dt > 0) {
                animation.currentPos = lerp(startPos, endPos, Math.min(dt / duration, 1));
            }
            if (dt >= duration) {
                onComplete?.();
            }
        },
    };
    return animation;
}

export function makeFrameAnimation(
    frames: ReadonlyArray<readonly [x: number, y: number]>,
    timePerFrame: number,
    startTime: number = 0
): FrameAnimation {
    const animation = {
        frames,
        currentIndex: 0,
        timePerFrame,
        startTime,
        tick(time: number) {
            const dt = time - startTime;
            if (dt > 0) {
                animation.currentIndex = Math.floor(dt / timePerFrame);
            }
        },
    };
    return animation;
}

function lerp(a: readonly [x: number, y: number], b: readonly [x: number, y: number], frac: number) {
    const nx = a[0] + (b[0] - a[0]) * frac;
    const ny = a[1] + (b[1] - a[1]) * frac;
    return [nx, ny] as const;
}
