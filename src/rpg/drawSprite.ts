export interface SpriteSheet {
    readonly image: HTMLImageElement;
    readonly spriteWidth: number;
    readonly spriteHeight: number;
}

export function drawSprite(
    context: CanvasRenderingContext2D,
    sheet: SpriteSheet,
    x: number,
    y: number,
    frame: readonly [x: number, y: number],
    renderDimensions?: { width: number; height: number }
) {
    context.drawImage(
        sheet.image,
        frame[0] * sheet.spriteWidth,
        frame[1] * sheet.spriteHeight,
        sheet.spriteWidth,
        sheet.spriteHeight,
        x - (renderDimensions?.width ?? sheet.spriteWidth) / 2,
        y - (renderDimensions?.height ?? sheet.spriteHeight) / 2,
        renderDimensions?.width ?? sheet.spriteWidth,
        renderDimensions?.height ?? sheet.spriteHeight
    );
}
