export function randomFromArray<T>(array: ReadonlyArray<T>): T {
    return array[Math.floor(Math.random() * array.length)];
}
