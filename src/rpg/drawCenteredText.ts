export function drawCenteredText(
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    background?: string,
    foreground?: string
) {
    const textMetrics = context.measureText(text);
    const height = textMetrics.actualBoundingBoxAscent - textMetrics.actualBoundingBoxDescent;

    if (background) {
        context.fillStyle = background;
        context.fillRect(x - textMetrics.width / 2 - 8, y - height - 8, textMetrics.width + 16, height + 16);
    }
    if (foreground) {
        context.fillStyle = foreground;
    }

    context.fillText(text, x - textMetrics.width / 2, y);
}
