/**
 * Calls the given callback every frame for a duration, passing in an elapsed time
 * Then resolves a promise. This is useful for e.g. performing an attack animation and then continuing
 */
export async function animate(callback: (dt: number) => void, duration: number) {
    const startTime = performance.now();
    return new Promise<void>((resolve) => {
        function tick(timestamp: number) {
            const dt = timestamp - startTime;
            callback(dt);
            if (dt < duration) {
                requestAnimationFrame(tick);
            } else {
                resolve();
            }
        }
        requestAnimationFrame(tick);
    });
}
