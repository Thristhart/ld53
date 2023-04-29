export function loadImage(path: string) {
    const img = new Image();
    img.src = path;
    return img;
}
